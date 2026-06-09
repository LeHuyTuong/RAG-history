from __future__ import annotations

import argparse
import re
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.retrieval.bm25 import search_bm25
from src.utils.io import load_config, read_csv, resolve_path, stringify_list, truthy, write_csv
from src.utils.logging import setup_logging
from src.utils.text import detect_entity_candidates, detect_years, text_preview, tokenize_vietnamese


HIGH_QUALITY_COLUMNS = [
    "qid",
    "question",
    "question_type",
    "expected_answer_type",
    "doc_id",
    "page_id",
    "page_number",
    "chunk_id",
    "evidence_text",
    "proposed_answer",
    "quality_score",
    "label_status",
]

SILVER_QUESTION_COLUMNS = [
    "qid",
    "question",
    "question_type",
    "expected_answer_type",
    "difficulty",
    "source_doc_hint",
    "proposed_answer",
    "label_status",
    "label_source",
    "label_quality",
    "verified",
    "notes",
]

SILVER_QREL_COLUMNS = [
    "qid",
    "chunk_id",
    "doc_id",
    "page_id",
    "page_number",
    "relevance",
    "evidence_note",
    "labeler",
    "verified",
    "label_source",
    "label_quality",
    "answer_text",
    "decision_reason",
]

FRONT_MATTER_PATTERNS = [
    "lời nói đầu",
    "mục lục",
    "tài liệu tham khảo",
    "danh sách tác giả",
    "isbn",
    "nxb",
    "nhà xuất bản",
    "copyright",
    "lịch sử việt nam - tập",
    "viện hàn lâm",
    "lời giới thiệu",
    "volume introduction",
]

GENERIC_ENTITIES = {
    "Việt Nam",
    "Lịch Sử",
    "Lịch Sử Việt Nam",
    "Tập",
    "Chương",
    "Nhà Xuất Bản",
    "Viện Sử",
    "Khoa Học",
}

HISTORICAL_TERMS = [
    "khởi nghĩa",
    "chiến dịch",
    "chiến tranh",
    "kháng chiến",
    "cách mạng",
    "cải cách",
    "đổi mới",
    "hiệp định",
    "hội nghị",
    "phong trào",
    "triều đình",
    "thuộc địa",
    "độc lập",
    "giải phóng",
    "thành lập",
    "xâm lược",
    "đàn áp",
    "chính sách",
    "hợp tác xã",
    "cải tạo",
    "Việt Minh",
    "Đảng Cộng sản",
    "Mặt trận",
    "Liên Xô",
    "Trung Quốc",
    "Pháp",
    "Mỹ",
]

CAUSE_TERMS = [
    "nguyên nhân",
    "hậu quả",
    "kết quả",
    "do ",
    "vì ",
    "bởi ",
    "dẫn đến",
    "làm cho",
    "tác động",
    "ảnh hưởng",
]

LOCATION_HINTS = [
    "Hà Nội",
    "Sài Gòn",
    "Huế",
    "Đà Nẵng",
    "Điện Biên",
    "Nam Bộ",
    "Bắc Bộ",
    "Trung Kỳ",
    "Nam Kỳ",
    "Bắc Kỳ",
    "Gia Định",
]

NO_ANSWER_POOL = [
    {
        "question": "Năm 1776, tài liệu mô tả Quốc hội Lục địa Hoa Kỳ thông qua Tuyên ngôn Độc lập như thế nào?",
        "expected_answer_type": "none",
        "proposed_answer": "Không có bằng chứng trực tiếp trong corpus silver-label.",
        "keywords": ["Quốc hội Lục địa", "Tuyên ngôn Độc lập Hoa Kỳ", "1776"],
    },
    {
        "question": "Tài liệu có trình bày nguyên nhân sụp đổ của Bức tường Berlin năm 1989 không?",
        "expected_answer_type": "none",
        "proposed_answer": "Không có bằng chứng trực tiếp trong corpus silver-label.",
        "keywords": ["Bức tường Berlin", "1989", "Đông Đức"],
    },
    {
        "question": "Tài liệu nêu chính sách Minh Trị Duy Tân của Nhật Bản năm 1868 tác động đến giáo dục Nhật như thế nào?",
        "expected_answer_type": "none",
        "proposed_answer": "Không có bằng chứng trực tiếp trong corpus silver-label.",
        "keywords": ["Minh Trị Duy Tân", "1868", "giáo dục Nhật"],
    },
    {
        "question": "Tài liệu mô tả vai trò của Nelson Mandela trong cuộc bầu cử Nam Phi năm 1994 như thế nào?",
        "expected_answer_type": "none",
        "proposed_answer": "Không có bằng chứng trực tiếp trong corpus silver-label.",
        "keywords": ["Nelson Mandela", "Nam Phi", "1994"],
    },
]

SILVER_TARGET = {
    "fact_date": 8,
    "person_entity": 6,
    "event": 6,
    "timeline": 6,
    "cause_effect": 6,
    "policy_concept": 4,
    "citation_grounded": 2,
    "no_answer": 2,
}

SENTENCE_RE = re.compile(r"(?<=[.!?。！？])\s+|\n+")
YEAR_RE = re.compile(r"\b(?:[1-2]\d{3}|[3-9]\d{2})\b")


def sentences(text: str) -> list[str]:
    cleaned = str(text or "").replace("[Page", "\n[Page")
    parts = [" ".join(part.split()) for part in SENTENCE_RE.split(cleaned)]
    return [part for part in parts if len(part) >= 30]


def is_front_matter(text: str, page_number: int) -> bool:
    lowered = text.lower()
    hits = sum(1 for pattern in FRONT_MATTER_PATTERNS if pattern in lowered)
    if page_number <= 18 and hits:
        return True
    if hits >= 3:
        return True
    if page_number <= 25 and any(pattern in lowered for pattern in ["mục lục", "lời nói đầu", "isbn"]):
        return True
    return False


def useful_entities(text: str, entities_detected: str) -> list[str]:
    candidates = detect_entity_candidates(text, max_entities=30)
    candidates.extend([part.strip() for part in str(entities_detected or "").split("|") if part.strip()])
    useful = []
    for entity in candidates:
        normalized = " ".join(entity.split()).strip(" .,;:-")
        if not normalized or normalized in GENERIC_ENTITIES:
            continue
        if len(normalized.split()) < 2 and normalized not in {"Pháp", "Mỹ"}:
            continue
        if any(skip.lower() in normalized.lower() for skip in ["lịch sử", "chương", "tập "]):
            continue
        useful.append(normalized)
    return list(dict.fromkeys(useful))[:10]


def terms_in_text(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    return [term for term in terms if term.lower() in lowered]


def extract_answer_sentence(text: str, required_terms: list[str]) -> str:
    wanted = [term.lower() for term in required_terms if term]
    for sentence in sentences(text):
        lowered = sentence.lower()
        if wanted and all(term.lower() in lowered for term in wanted[:2]):
            return sentence[:360]
    for sentence in sentences(text):
        lowered = sentence.lower()
        if wanted and any(term.lower() in lowered for term in wanted):
            return sentence[:360]
    return sentences(text)[0][:360] if sentences(text) else "NEEDS_MANUAL_ANSWER"


def chunk_quality(row: dict, page_quality: str, ocr_needed: bool) -> int:
    text = str(row.get("text", ""))
    page_number = int(str(row.get("page_start", "0") or "0"))
    if str(row.get("doc_id", "")) in {"D003", "D007"}:
        return 1
    if ocr_needed or page_quality in {"ocr_needed", "low_ocr_confidence", "extraction_failed"}:
        return 2
    if is_front_matter(text, page_number):
        return 1
    score = 1
    years = detect_years(text)
    entities = useful_entities(text, str(row.get("entities_detected", "")))
    history_terms = terms_in_text(text, HISTORICAL_TERMS)
    cause_terms = terms_in_text(text, CAUSE_TERMS)
    locations = terms_in_text(text, LOCATION_HINTS)
    if years:
        score += 1
    if entities:
        score += 1
    if history_terms:
        score += 1
    if cause_terms or locations or len(years) >= 2:
        score += 1
    return min(score, 5)


def make_candidate(row: dict, question_type: str, qid_number: int) -> dict | None:
    text = str(row.get("text", ""))
    doc_id = str(row.get("doc_id", ""))
    page_number = str(row.get("page_start", ""))
    chunk_id = str(row.get("chunk_id", ""))
    page_id = str(row.get("page_id", ""))
    years = detect_years(text)
    entities = useful_entities(text, str(row.get("entities_detected", "")))
    history_terms = terms_in_text(text, HISTORICAL_TERMS)
    cause_terms = terms_in_text(text, CAUSE_TERMS)
    main_entity = entities[0] if entities else ""
    main_term = history_terms[0] if history_terms else ""
    answer = "NEEDS_MANUAL_ANSWER"
    question = ""
    expected = ""

    if question_type == "fact_date" and years and (main_entity or main_term):
        year = years[0]
        topic = main_entity or main_term
        question = f"Năm {year}, tài liệu mô tả sự kiện hoặc diễn biến nào liên quan đến {topic}?"
        answer = extract_answer_sentence(text, [year, topic])
        expected = "date_event"
    elif question_type == "person_entity" and main_entity:
        context = main_term or (years[0] if years else "bối cảnh lịch sử được nêu")
        question = f"Tài liệu mô tả vai trò hoặc hành động của {main_entity} trong {context} như thế nào?"
        answer = extract_answer_sentence(text, [main_entity])
        expected = "person_role"
    elif question_type == "event" and (main_term or main_entity) and years:
        topic = main_term or main_entity
        question = f"Tài liệu trình bày sự kiện nào liên quan đến {topic} trong giai đoạn có mốc {years[0]}?"
        answer = extract_answer_sentence(text, [topic, years[0]])
        expected = "event"
    elif question_type == "timeline" and len(years) >= 2:
        topic = main_entity or main_term or "giai đoạn được nêu"
        question = f"Trong các mốc {years[0]}-{years[-1]}, tài liệu nêu diễn biến chính nào liên quan đến {topic}?"
        answer = extract_answer_sentence(text, [years[0], years[-1]])
        expected = "timeline"
    elif question_type == "cause_effect" and (cause_terms or main_term) and (main_entity or main_term):
        topic = main_entity or main_term
        cue = cause_terms[0] if cause_terms else main_term
        question = f"Tài liệu nêu nguyên nhân hoặc hệ quả nào liên quan đến {topic}?"
        answer = extract_answer_sentence(text, [cue, topic])
        expected = "explanation"
    elif question_type == "policy_concept" and main_term:
        question = f"Tài liệu giải thích hoặc mô tả khái niệm/chính sách {main_term} như thế nào?"
        answer = extract_answer_sentence(text, [main_term])
        expected = "concept"
    elif question_type == "citation_grounded" and (main_entity or main_term):
        topic = main_entity or main_term
        question = f"Trang {page_number} cung cấp bằng chứng gì về {topic}?"
        answer = extract_answer_sentence(text, [topic])
        expected = "citation"

    if not question or "Việt Nam như thế nào" in question:
        return None
    if answer == "NEEDS_MANUAL_ANSWER" or len(answer) < 45:
        return None
    if answer.endswith("...") or answer.count("...") >= 1:
        return None
    if question_type == "fact_date" and years and years[0] not in answer:
        return None
    if question_type == "timeline" and len(years) >= 2 and not (years[0] in answer or years[-1] in answer):
        return None

    return {
        "qid": f"SQ{qid_number:04d}",
        "question": question,
        "question_type": question_type,
        "expected_answer_type": expected,
        "doc_id": doc_id,
        "page_id": page_id,
        "page_number": page_number,
        "chunk_id": chunk_id,
        "evidence_text": text,
        "proposed_answer": answer,
        "quality_score": str(4),
        "label_status": "silver_candidate",
    }


def build_bm25(chunks: pd.DataFrame):
    from rank_bm25 import BM25Okapi

    corpus = [tokenize_vietnamese(text) for text in chunks["text"].astype(str).tolist()]
    return BM25Okapi(corpus), chunks.reset_index(drop=True)


def no_answer_is_plausible(question: str, keywords: list[str], bm25, chunks: pd.DataFrame) -> bool:
    query = " ".join([question] + keywords)
    results = search_bm25(query, bm25, chunks, top_k=10)
    keyword_hits = 0
    strong_keywords = [keyword for keyword in keywords if not str(keyword).isdigit()]
    for row in results[:10]:
        text = str(row.get("text", "")).lower()
        if any(keyword.lower() in text for keyword in strong_keywords):
            keyword_hits += 1
    return keyword_hits == 0


def generate_candidates(chunks: pd.DataFrame, pages: pd.DataFrame, ocr: pd.DataFrame, target_count: int) -> pd.DataFrame:
    page_quality = {str(row["page_id"]): str(row.get("quality_flag", "")) for row in pages.to_dict("records")}
    ocr_needed_by_page = {str(row["page_id"]): truthy(row.get("ocr_needed", "")) for row in ocr.to_dict("records")}
    records = []
    for row in chunks.to_dict("records"):
        page_number = int(str(row.get("page_start", "0") or "0"))
        page_id = str(row.get("page_id", ""))
        text = str(row.get("text", ""))
        if str(row.get("doc_id", "")) in {"D003", "D007"}:
            continue
        if page_number < 20 or is_front_matter(text, page_number):
            continue
        quality = chunk_quality(row, page_quality.get(page_id, ""), ocr_needed_by_page.get(page_id, False))
        if quality < 4:
            continue
        row["_quality"] = quality
        records.append(row)

    by_doc: dict[str, deque] = {}
    for doc_id, group in pd.DataFrame(records).groupby("doc_id", sort=True):
        by_doc[str(doc_id)] = deque(group.sort_values(["page_start", "chunk_id"]).to_dict("records"))

    ordered = []
    while any(by_doc.values()):
        for doc_id in sorted(by_doc):
            if by_doc[doc_id]:
                ordered.append(by_doc[doc_id].popleft())

    rows = []
    qid_number = 1
    type_counts = Counter()
    per_doc_counts = Counter()
    type_cycle = ["fact_date", "person_entity", "event", "timeline", "cause_effect", "policy_concept", "citation_grounded"]
    for chunk in ordered:
        if len(rows) >= target_count - 4:
            break
        doc_id = str(chunk.get("doc_id", ""))
        if per_doc_counts[doc_id] >= 15:
            continue
        for qtype in sorted(type_cycle, key=lambda item: type_counts[item]):
            if type_counts[qtype] >= 25:
                continue
            candidate = make_candidate(chunk, qtype, qid_number)
            if candidate is None:
                continue
            candidate["quality_score"] = str(chunk.get("_quality", 4))
            rows.append(candidate)
            qid_number += 1
            type_counts[qtype] += 1
            per_doc_counts[doc_id] += 1
            break

    bm25, metadata = build_bm25(chunks)
    for no_answer in NO_ANSWER_POOL:
        if len(rows) >= target_count:
            break
        if no_answer_is_plausible(no_answer["question"], no_answer["keywords"], bm25, metadata):
            rows.append(
                {
                    "qid": f"SQ{qid_number:04d}",
                    "question": no_answer["question"],
                    "question_type": "no_answer",
                    "expected_answer_type": no_answer["expected_answer_type"],
                    "doc_id": "",
                    "page_id": "",
                    "page_number": "",
                    "chunk_id": "",
                    "evidence_text": "",
                    "proposed_answer": no_answer["proposed_answer"],
                    "quality_score": "4",
                    "label_status": "silver_candidate",
                }
            )
            qid_number += 1

    return pd.DataFrame(rows, columns=HIGH_QUALITY_COLUMNS)


def token_overlap(a: str, b: str) -> float:
    a_tokens = {token for token in tokenize_vietnamese(a) if len(token) >= 3}
    b_tokens = {token for token in tokenize_vietnamese(b) if len(token) >= 3}
    if not a_tokens or not b_tokens:
        return 0.0
    return len(a_tokens & b_tokens) / max(len(a_tokens), 1)


def directly_supports(question: str, answer: str, candidate_text: str) -> tuple[bool, str]:
    years = set(YEAR_RE.findall(question + " " + answer))
    year_ok = not years or any(year in candidate_text for year in years)
    answer_overlap = token_overlap(answer, candidate_text)
    question_overlap = token_overlap(question, candidate_text)
    if year_ok and answer_overlap >= 0.45:
        return True, f"answer_overlap={answer_overlap:.2f};year_ok={year_ok}"
    if year_ok and answer_overlap >= 0.30 and question_overlap >= 0.18:
        return True, f"answer_overlap={answer_overlap:.2f};question_overlap={question_overlap:.2f};year_ok={year_ok}"
    return False, f"answer_overlap={answer_overlap:.2f};question_overlap={question_overlap:.2f};year_ok={year_ok}"


def select_silver_questions(candidates: pd.DataFrame) -> pd.DataFrame:
    selected_rows = []
    used_chunks = set()
    doc_counts = Counter()
    no_answer_candidates = candidates[candidates["question_type"] == "no_answer"]

    for qtype, quota in SILVER_TARGET.items():
        pool = candidates[
            (candidates["question_type"] == qtype)
            & (pd.to_numeric(candidates["quality_score"], errors="coerce").fillna(0) >= 4)
        ].copy()
        if qtype != "no_answer":
            pool = pool.sort_values(["quality_score", "doc_id", "page_number"], ascending=[False, True, True])
        else:
            pool = no_answer_candidates.copy()
        picked = 0
        for row in pool.to_dict("records"):
            doc_id = str(row.get("doc_id", ""))
            chunk_id = str(row.get("chunk_id", ""))
            if qtype != "no_answer":
                if doc_counts[doc_id] >= 5:
                    continue
                if chunk_id in used_chunks:
                    continue
            selected_rows.append(row)
            picked += 1
            if chunk_id:
                used_chunks.add(chunk_id)
            if doc_id:
                doc_counts[doc_id] += 1
            if picked >= quota:
                break

    selected = pd.DataFrame(selected_rows)
    selected = selected.head(sum(SILVER_TARGET.values())).copy()
    selected["qid"] = [f"SQ{i:04d}" for i in range(1, len(selected) + 1)]
    return selected


def create_silver_outputs(selected: pd.DataFrame, chunks: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    bm25, metadata = build_bm25(chunks)
    chunk_by_id = {str(row["chunk_id"]): row for row in chunks.to_dict("records")}
    question_rows = []
    qrel_rows = []

    for row in selected.to_dict("records"):
        qid = str(row["qid"])
        qtype = str(row["question_type"])
        question_rows.append(
            {
                "qid": qid,
                "question": row["question"],
                "question_type": qtype,
                "expected_answer_type": row["expected_answer_type"],
                "difficulty": "hard" if qtype in {"timeline", "cause_effect"} else "medium",
                "source_doc_hint": row.get("doc_id", ""),
                "proposed_answer": row.get("proposed_answer", ""),
                "label_status": "silver_question",
                "label_source": "llm_assisted",
                "label_quality": "silver",
                "verified": "false",
                "notes": "LLM-assisted labeling; preliminary evaluation only; requires manual audit",
            }
        )
        if qtype == "no_answer":
            qrel_rows.append(
                {
                    "qid": qid,
                    "chunk_id": "",
                    "doc_id": "",
                    "page_id": "",
                    "page_number": "",
                    "relevance": "NONE",
                    "evidence_note": "Silver no-answer candidate; keyword/BM25 screened; requires manual verification",
                    "labeler": "",
                    "verified": "false",
                    "label_source": "llm_assisted",
                    "label_quality": "silver",
                    "answer_text": row.get("proposed_answer", ""),
                    "decision_reason": "no obvious evidence found by keyword/BM25 screening",
                }
            )
            continue

        source_chunk = chunk_by_id.get(str(row.get("chunk_id", "")), {})
        qrel_rows.append(
            {
                "qid": qid,
                "chunk_id": row.get("chunk_id", ""),
                "doc_id": row.get("doc_id", ""),
                "page_id": row.get("page_id", ""),
                "page_number": row.get("page_number", ""),
                "relevance": "1",
                "evidence_note": text_preview(row.get("evidence_text", ""), 280),
                "labeler": "",
                "verified": "false",
                "label_source": "llm_assisted",
                "label_quality": "silver",
                "answer_text": row.get("proposed_answer", ""),
                "decision_reason": "source chunk used as initial silver positive evidence",
            }
        )

        seen = {str(row.get("chunk_id", ""))}
        bm25_results = search_bm25(str(row["question"]), bm25, metadata, top_k=20)
        for candidate in bm25_results:
            chunk_id = str(candidate.get("chunk_id", ""))
            if not chunk_id or chunk_id in seen:
                continue
            supports, reason = directly_supports(str(row["question"]), str(row.get("proposed_answer", "")), str(candidate.get("text", "")))
            if not supports:
                continue
            seen.add(chunk_id)
            qrel_rows.append(
                {
                    "qid": qid,
                    "chunk_id": chunk_id,
                    "doc_id": candidate.get("doc_id", ""),
                    "page_id": candidate.get("page_id", ""),
                    "page_number": candidate.get("page_start", ""),
                    "relevance": "1",
                    "evidence_note": text_preview(candidate.get("text", ""), 280),
                    "labeler": "",
                    "verified": "false",
                    "label_source": "llm_assisted",
                    "label_quality": "silver",
                    "answer_text": row.get("proposed_answer", ""),
                    "decision_reason": f"BM25 expansion silver positive; {reason}",
                }
            )
            if len(seen) >= 4:
                break

    return (
        pd.DataFrame(question_rows, columns=SILVER_QUESTION_COLUMNS),
        pd.DataFrame(qrel_rows, columns=SILVER_QREL_COLUMNS),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate high-quality silver benchmark candidates and silver_qrels.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--candidate-count", type=int, default=100)
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    extracted_dir = resolve_path(config, "extracted_dir")
    benchmark_dir = resolve_path(config, "benchmark_dir")
    chunks = read_csv(extracted_dir / "chunks.csv")
    pages = read_csv(extracted_dir / "pages.csv")
    ocr = read_csv(extracted_dir / "ocr_report.csv")
    if chunks.empty:
        raise SystemExit("chunks.csv is empty. Run scripts/05_chunk_pages.py first.")

    candidates = generate_candidates(chunks, pages, ocr, target_count=max(80, min(args.candidate_count, 120)))
    if len(candidates) < 40:
        raise SystemExit(f"Only generated {len(candidates)} candidates; not enough for a 40-question pilot.")
    selected = select_silver_questions(candidates)
    silver_questions, silver_qrels = create_silver_outputs(selected, chunks)

    write_csv(candidates, benchmark_dir / "high_quality_benchmark_candidates.csv")
    write_csv(silver_questions, benchmark_dir / "silver_questions.csv")
    write_csv(silver_qrels, benchmark_dir / "silver_qrels.csv")

    logger.info("Wrote %s high-quality silver candidates.", len(candidates))
    logger.info("Wrote %s silver questions.", len(silver_questions))
    logger.info("Wrote %s silver qrels.", len(silver_qrels))
    print("candidate rows:", len(candidates))
    print("silver questions:", len(silver_questions))
    print("silver qrels:", len(silver_qrels))
    print("question type counts:")
    for qtype, count in silver_questions["question_type"].value_counts().to_dict().items():
        print(f"- {qtype}: {count}")
    print("doc counts:")
    for doc_id, count in silver_questions["source_doc_hint"].replace("", "NO_DOC").value_counts().sort_index().to_dict().items():
        print(f"- {doc_id}: {count}")
    print("verified true rows:", int(silver_qrels["verified"].map(truthy).sum()))


if __name__ == "__main__":
    main()
