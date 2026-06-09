from __future__ import annotations

import itertools
from collections import deque

import pandas as pd

from src.pdf_processing.chunking import CHUNK_COLUMNS
from src.utils.io import split_pipe
from src.utils.text import POLICY_EVENT_TERMS, text_preview

CANDIDATE_COLUMNS = [
    "candidate_id",
    "qid",
    "question",
    "question_type",
    "expected_answer_type",
    "difficulty",
    "source_doc_hint",
    "candidate_chunk_id",
    "candidate_doc_id",
    "candidate_page_id",
    "candidate_page_number",
    "evidence_preview",
    "trigger_terms",
    "notes",
]


def _first(values: list[str], fallback: str = "nội dung này") -> str:
    return values[0] if values else fallback


def _policy_terms_in_text(text: str) -> list[str]:
    lowered = text.lower()
    return [term for term in POLICY_EVENT_TERMS if term.lower() in lowered]


def generate_candidates(chunks: pd.DataFrame, max_candidates: int = 200) -> pd.DataFrame:
    chunks = chunks.copy()
    for column in CHUNK_COLUMNS:
        if column not in chunks.columns:
            chunks[column] = ""
    chunks["_page_start_int"] = pd.to_numeric(chunks["page_start"], errors="coerce").fillna(0).astype(int)
    chunks["_token_count_int"] = pd.to_numeric(chunks["token_count"], errors="coerce").fillna(0).astype(int)
    candidate_chunks = chunks[
        (chunks["_page_start_int"] >= 20)
        & (chunks["_token_count_int"] >= 150)
    ].copy()
    if candidate_chunks.empty:
        candidate_chunks = chunks.copy()

    rows: list[dict] = []
    counter = itertools.count(1)
    balanced_counts: dict[str, int] = {}
    no_answer_target = min(5, max_candidates)

    def add_candidate(chunk: dict, question: str, question_type: str, answer_type: str, difficulty: str, triggers: list[str]):
        if len(rows) >= max_candidates - no_answer_target:
            return
        if balanced_counts.get(question_type, 0) >= max(8, max_candidates // 8):
            return
        index = next(counter)
        balanced_counts[question_type] = balanced_counts.get(question_type, 0) + 1
        rows.append(
            {
                "candidate_id": f"CAND_{index:04d}",
                "qid": f"Q{index:04d}",
                "question": question,
                "question_type": question_type,
                "expected_answer_type": answer_type,
                "difficulty": difficulty,
                "source_doc_hint": chunk.get("doc_id", ""),
                "candidate_chunk_id": chunk.get("chunk_id", ""),
                "candidate_doc_id": chunk.get("doc_id", ""),
                "candidate_page_id": chunk.get("page_id", ""),
                "candidate_page_number": chunk.get("page_start", ""),
                "evidence_preview": text_preview(chunk.get("text", "")),
                "trigger_terms": "|".join(dict.fromkeys(triggers)),
                "notes": "AUTO_CANDIDATE_ONLY; manual review and qrels verification required",
            }
        )

    grouped_records = [
        deque(group.sort_values(["_page_start_int", "chunk_id"]).to_dict("records"))
        for _, group in candidate_chunks.groupby("doc_id", sort=True)
    ]
    ordered_chunks: list[dict] = []
    while any(grouped_records):
        for group in grouped_records:
            if group:
                ordered_chunks.append(group.popleft())

    for chunk in ordered_chunks:
        text = str(chunk.get("text", ""))
        if not text.strip():
            continue
        years = split_pipe(chunk.get("years_detected", ""))
        entities = split_pipe(chunk.get("entities_detected", ""))
        policy_terms = _policy_terms_in_text(text)
        trigger = _first(entities or policy_terms or years)

        if years:
            year = years[0]
            add_candidate(
                chunk,
                f"Tài liệu mô tả sự kiện hoặc nội dung gì liên quan đến năm {year}?",
                "fact_date",
                "date_or_event",
                "easy",
                [year],
            )

        if entities:
            entity = entities[0]
            add_candidate(
                chunk,
                f"Vai trò hoặc hành động của {entity} được tài liệu mô tả như thế nào?",
                "person_entity",
                "person_or_organization",
                "medium",
                [entity],
            )

        if policy_terms:
            term = policy_terms[0]
            add_candidate(
                chunk,
                f"Sự kiện lịch sử nào được tài liệu mô tả liên quan đến {term}?",
                "event",
                "event",
                "medium",
                [term],
            )
            add_candidate(
                chunk,
                f"Khái niệm hoặc chính sách {term} được trình bày như thế nào trong tài liệu?",
                "policy_concept",
                "concept",
                "medium",
                [term],
            )
            add_candidate(
                chunk,
                f"Nguyên nhân hoặc hệ quả nào được nêu liên quan đến {term}?",
                "cause_effect",
                "explanation",
                "hard",
                [term],
            )

        if years and (entities or policy_terms):
            add_candidate(
                chunk,
                f"Mốc thời gian nào được nêu liên quan đến {trigger}?",
                "timeline",
                "timeline",
                "medium",
                [trigger] + years[:3],
            )
            add_candidate(
                chunk,
                f"Tài liệu ghi nhận sự kiện gì liên quan đến {trigger} trong giai đoạn được nêu?",
                "event",
                "event",
                "medium",
                [trigger] + years[:3],
            )

        if len(entities) >= 2:
            add_candidate(
                chunk,
                f"Mối liên hệ giữa {entities[0]} và {entities[1]} được tài liệu trình bày như thế nào?",
                "multi_hop",
                "relationship",
                "hard",
                entities[:2],
            )

        if entities or policy_terms or years:
            add_candidate(
                chunk,
                f"Trang nào cung cấp bằng chứng cho thông tin về {trigger}?",
                "citation_grounded",
                "citation",
                "easy",
                [trigger],
            )

        if len(rows) >= max_candidates:
            break

    # Placeholders for no-answer design. These are intentionally not grounded labels.
    for _ in range(min(no_answer_target, max_candidates - len(rows))):
        index = next(counter)
        rows.append(
            {
                "candidate_id": f"CAND_{index:04d}",
                "qid": f"Q{index:04d}",
                "question": "Câu hỏi no-answer cần được người gán nhãn thay bằng một câu hỏi không có bằng chứng trong 15 PDF.",
                "question_type": "no_answer",
                "expected_answer_type": "none",
                "difficulty": "medium",
                "source_doc_hint": "",
                "candidate_chunk_id": "",
                "candidate_doc_id": "",
                "candidate_page_id": "",
                "candidate_page_number": "",
                "evidence_preview": "",
                "trigger_terms": "",
                "notes": "PLACEHOLDER_NO_ANSWER; replace manually; verified must remain false until checked",
            }
        )

    return pd.DataFrame(rows, columns=CANDIDATE_COLUMNS)


def prepare_manual_templates(candidates: pd.DataFrame, max_questions: int = 50) -> tuple[pd.DataFrame, pd.DataFrame]:
    target_distribution = [
        ("fact_date", 8),
        ("person_entity", 8),
        ("event", 6),
        ("timeline", 6),
        ("cause_effect", 6),
        ("policy_concept", 4),
        ("no_answer", 2),
    ]
    selected_parts = []
    used_indexes: set[int] = set()
    for question_type, quota in target_distribution:
        if len(used_indexes) >= max_questions:
            break
        quota = min(quota, max_questions - len(used_indexes))
        part = candidates[
            (candidates["question_type"] == question_type)
            & (~candidates.index.isin(used_indexes))
        ].head(quota)
        selected_parts.append(part)
        used_indexes.update(part.index.tolist())

    selected = pd.concat(selected_parts, ignore_index=False) if selected_parts else candidates.head(0)
    if len(selected) < max_questions:
        fill = candidates[~candidates.index.isin(used_indexes)].head(max_questions - len(selected))
        selected = pd.concat([selected, fill], ignore_index=False)
    selected = selected.head(max_questions).copy().reset_index(drop=True)
    questions = selected[
        [
            "qid",
            "question",
            "question_type",
            "expected_answer_type",
            "difficulty",
            "source_doc_hint",
            "notes",
        ]
    ].copy()
    questions["notes"] = questions["notes"].astype(str) + "; MANUAL_FINALIZATION_REQUIRED"

    qrel_rows = []
    for row in selected.to_dict("records"):
        if row.get("question_type") == "no_answer":
            qrel_rows.append(
                {
                    "qid": row.get("qid", ""),
                    "chunk_id": "",
                    "doc_id": "",
                    "page_id": "",
                    "page_number": "",
                    "relevance": "NONE",
                    "evidence_note": "No-answer candidate; manually verify no sufficient evidence exists.",
                    "labeler": "",
                    "verified": "false",
                }
            )
        else:
            qrel_rows.append(
                {
                    "qid": row.get("qid", ""),
                    "chunk_id": row.get("candidate_chunk_id", ""),
                    "doc_id": row.get("candidate_doc_id", ""),
                    "page_id": row.get("candidate_page_id", ""),
                    "page_number": row.get("candidate_page_number", ""),
                    "relevance": "0",
                    "evidence_note": "Candidate evidence only; set relevance=1 only after manual verification.",
                    "labeler": "",
                    "verified": "false",
                }
            )
    qrels = pd.DataFrame(
        qrel_rows,
        columns=[
            "qid",
            "chunk_id",
            "doc_id",
            "page_id",
            "page_number",
            "relevance",
            "evidence_note",
            "labeler",
            "verified",
        ],
    )
    return questions, qrels
