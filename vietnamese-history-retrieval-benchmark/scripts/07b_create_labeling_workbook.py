from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.utils.io import load_config, read_csv, resolve_path, truthy, write_csv
from src.utils.logging import setup_logging
from src.utils.text import text_preview


WORKBOOK_COLUMNS = [
    "qid",
    "original_question",
    "suggested_rewritten_question",
    "question_type",
    "difficulty",
    "doc_id",
    "page_id",
    "page_number",
    "chunk_id",
    "evidence_text",
    "evidence_text_short",
    "years_detected",
    "entities_detected",
    "extraction_method",
    "quality_flag",
    "ocr_needed",
    "proposed_answer",
    "keep_for_benchmark",
    "relevance",
    "verified",
    "labeler",
    "notes",
]

FINAL_QUESTION_COLUMNS = [
    "qid",
    "question",
    "question_type",
    "expected_answer_type",
    "difficulty",
    "source_doc_hint",
    "notes",
]

FINAL_QREL_COLUMNS = [
    "qid",
    "chunk_id",
    "doc_id",
    "page_id",
    "page_number",
    "relevance",
    "evidence_note",
    "labeler",
    "verified",
]

YEAR_RE = re.compile(r"\b(?:[1-2]\d{3}|[3-9]\d{2})\b")
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?。！？])\s+|\n+")
POLICY_TERMS = [
    "Cách mạng",
    "kháng chiến",
    "cải cách",
    "đổi mới",
    "hiệp định",
    "hội nghị",
    "triều đại",
    "phong trào",
    "chiến dịch",
    "độc lập",
    "thuộc địa",
    "nhà Nguyễn",
    "nhà Trần",
    "nhà Lý",
    "Đảng Cộng sản",
    "Việt Minh",
    "Mặt trận",
]
EVENT_CUES = [
    "khởi nghĩa",
    "chiến dịch",
    "hội nghị",
    "hiệp định",
    "phong trào",
    "cách mạng",
    "kháng chiến",
    "thành lập",
    "ban hành",
    "tấn công",
    "giải phóng",
]
CAUSE_CUES = [
    "nguyên nhân",
    "hậu quả",
    "kết quả",
    "do ",
    "vì ",
    "bởi ",
    "dẫn đến",
    "làm cho",
    "cho nên",
]


def split_pipe(value: object) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []
    return [part.strip() for part in text.split("|") if part.strip()]


def first_sentence_matching(text: str, terms: list[str]) -> str:
    if not text.strip() or not terms:
        return ""
    normalized_terms = [term.lower() for term in terms if term]
    for sentence in SENTENCE_SPLIT_RE.split(text):
        cleaned = " ".join(sentence.split())
        lowered = cleaned.lower()
        if cleaned and any(term in lowered for term in normalized_terms):
            return cleaned
    return ""


def first_good_entity(entities_detected: str) -> str:
    for entity in split_pipe(entities_detected):
        words = entity.split()
        lowered = entity.lower()
        if len(words) >= 2 and not any(skip in lowered for skip in ["lịch sử", "việt nam l", "chương"]):
            return entity
    values = split_pipe(entities_detected)
    return values[0] if values else ""


def first_policy_term(text: str) -> str:
    lowered = text.lower()
    for term in POLICY_TERMS:
        if term.lower() in lowered:
            return term
    return ""


def first_event_term(text: str) -> str:
    lowered = text.lower()
    for cue in EVENT_CUES:
        if cue in lowered:
            return cue
    return ""


def first_cause_term(text: str) -> str:
    lowered = text.lower()
    for cue in CAUSE_CUES:
        if cue in lowered:
            return cue.strip()
    return ""


def pick_year(years_detected: str, text: str) -> str:
    for year in split_pipe(years_detected):
        if year and year in text:
            return year
    match = YEAR_RE.search(text)
    return match.group(0) if match else ""


def suggested_question(question_type: str, text: str, years: str, entities: str) -> str:
    if question_type == "no_answer":
        return ""

    year = pick_year(years, text)
    entity = first_good_entity(entities)
    policy = first_policy_term(text)
    event = first_event_term(text)
    main = entity or policy or event

    if question_type == "fact_date":
        if year and main:
            return f"Năm {year}, tài liệu nêu sự kiện hoặc nội dung gì liên quan đến {main}?"
        if year:
            return f"Năm {year}, tài liệu mô tả sự kiện hoặc nội dung lịch sử nào?"
    if question_type == "person_entity":
        if entity:
            return f"Tài liệu mô tả vai trò hoặc hành động của {entity} như thế nào?"
    if question_type == "event":
        if event and main:
            return f"Sự kiện liên quan đến {main} được tài liệu mô tả như thế nào?"
        if main:
            return f"Tài liệu mô tả sự kiện lịch sử nào liên quan đến {main}?"
    if question_type == "timeline":
        if year and main:
            return f"Mốc {year} có ý nghĩa gì trong diễn biến liên quan đến {main}?"
        if year:
            return f"Mốc {year} được đặt trong trình tự lịch sử nào?"
    if question_type == "cause_effect":
        if policy:
            return f"Nguyên nhân hoặc hệ quả nào được tài liệu nêu liên quan đến {policy}?"
        if main:
            return f"Tài liệu nêu nguyên nhân hoặc hệ quả nào liên quan đến {main}?"
    if question_type == "policy_concept":
        if policy:
            return f"Tài liệu giải thích hoặc mô tả khái niệm/chính sách {policy} như thế nào?"
    return "NEEDS_MANUAL_REWRITE"


def proposed_answer(question_type: str, text: str, years: str, entities: str) -> str:
    if question_type == "no_answer" or not text.strip():
        return "NEEDS_MANUAL_ANSWER"

    terms: list[str] = []
    year = pick_year(years, text)
    entity = first_good_entity(entities)
    policy = first_policy_term(text)
    event = first_event_term(text)
    cause = first_cause_term(text)

    if question_type in {"fact_date", "timeline"}:
        terms.extend([year, entity, policy, event])
    elif question_type == "person_entity":
        terms.extend([entity])
    elif question_type == "event":
        terms.extend([event, entity, policy, year])
    elif question_type == "cause_effect":
        terms.extend([cause, policy, entity])
    elif question_type == "policy_concept":
        terms.extend([policy])
    else:
        terms.extend([entity, policy, year])

    sentence = first_sentence_matching(text, [term for term in terms if term])
    if not sentence:
        return "NEEDS_MANUAL_ANSWER"
    if len(sentence) > 320:
        sentence = sentence[:317].rstrip() + "..."
    if len(sentence) < 25:
        return "NEEDS_MANUAL_ANSWER"
    return sentence


def build_notes(doc_id: str, evidence_text: str, ocr_needed: str, quality_flag: str, existing_note: str) -> str:
    notes = [part for part in str(existing_note or "").split("|") if part]
    if doc_id in {"D003", "D007"}:
        notes.append("image-only/no usable extracted text")
    if truthy(ocr_needed):
        notes.append("original PDF page should be inspected before verification")
    if len(str(evidence_text or "").strip()) < 120:
        notes.append("weak evidence")
    if quality_flag and quality_flag not in {"clean_text", "unreviewed"}:
        notes.append(f"quality_flag={quality_flag}")
    notes.append("manual review required")
    return "|".join(dict.fromkeys(notes))


def create_workbook(config_path: str) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    config = load_config(config_path)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    extracted_dir = resolve_path(config, "extracted_dir")

    questions = read_csv(benchmark_dir / "questions.csv")
    qrels = read_csv(benchmark_dir / "qrels.csv")
    chunks = read_csv(extracted_dir / "chunks.csv")
    pages = read_csv(extracted_dir / "pages.csv")
    ocr = read_csv(extracted_dir / "ocr_report.csv")

    if questions.empty:
        raise SystemExit("data/benchmark/questions.csv is empty. Run scripts/07_prepare_manual_qrels_template.py first.")
    if qrels.empty:
        raise SystemExit("data/benchmark/qrels.csv is empty. Run scripts/07_prepare_manual_qrels_template.py first.")

    question_by_id = {str(row["qid"]): row for row in questions.to_dict("records")}
    chunk_by_id = {str(row["chunk_id"]): row for row in chunks.to_dict("records") if str(row.get("chunk_id", ""))}
    page_by_id = {str(row["page_id"]): row for row in pages.to_dict("records") if str(row.get("page_id", ""))}
    ocr_by_page_id = {str(row["page_id"]): row for row in ocr.to_dict("records") if str(row.get("page_id", ""))}

    workbook_rows: list[dict] = []
    final_question_rows: list[dict] = []
    final_qrel_rows: list[dict] = []

    for qrel in qrels.to_dict("records"):
        qid = str(qrel.get("qid", ""))
        question = question_by_id.get(qid, {})
        chunk_id = str(qrel.get("chunk_id", "") or "")
        chunk = chunk_by_id.get(chunk_id, {}) if chunk_id and chunk_id.upper() != "NONE" else {}
        evidence_text = str(chunk.get("text", "") or "")

        doc_id = str(qrel.get("doc_id", "") or chunk.get("doc_id", "") or question.get("source_doc_hint", "") or "")
        page_id = str(qrel.get("page_id", "") or chunk.get("page_id", "") or "")
        page_number = str(qrel.get("page_number", "") or chunk.get("page_start", "") or "")
        page = page_by_id.get(page_id, {})
        ocr_row = ocr_by_page_id.get(page_id, {})

        question_type = str(question.get("question_type", ""))
        years_detected = str(chunk.get("years_detected", "") or "")
        entities_detected = str(chunk.get("entities_detected", "") or "")
        quality_flag = str(page.get("quality_flag", "") or "")
        ocr_needed = str(ocr_row.get("ocr_needed", "") or "")
        rewritten = suggested_question(question_type, evidence_text, years_detected, entities_detected)
        answer = proposed_answer(question_type, evidence_text, years_detected, entities_detected)
        notes = build_notes(doc_id, evidence_text, ocr_needed, quality_flag, str(qrel.get("evidence_note", "")))

        workbook_rows.append(
            {
                "qid": qid,
                "original_question": str(question.get("question", "")),
                "suggested_rewritten_question": rewritten,
                "question_type": question_type,
                "difficulty": str(question.get("difficulty", "")),
                "doc_id": doc_id,
                "page_id": page_id,
                "page_number": page_number,
                "chunk_id": chunk_id,
                "evidence_text": evidence_text,
                "evidence_text_short": text_preview(evidence_text, 500),
                "years_detected": years_detected,
                "entities_detected": entities_detected,
                "extraction_method": str(chunk.get("extraction_method", "")),
                "quality_flag": quality_flag,
                "ocr_needed": ocr_needed,
                "proposed_answer": answer,
                "keep_for_benchmark": "false",
                "relevance": str(qrel.get("relevance", "")),
                "verified": "false",
                "labeler": str(qrel.get("labeler", "")),
                "notes": notes,
            }
        )

        final_question_rows.append(
            {
                "qid": qid,
                "question": rewritten if rewritten and rewritten != "NEEDS_MANUAL_REWRITE" else str(question.get("question", "")),
                "question_type": question_type,
                "expected_answer_type": str(question.get("expected_answer_type", "")),
                "difficulty": str(question.get("difficulty", "")),
                "source_doc_hint": doc_id,
                "notes": "TEMPLATE_ONLY; keep/edit manually; not verified ground truth",
            }
        )
        final_qrel_rows.append(
            {
                "qid": qid,
                "chunk_id": chunk_id,
                "doc_id": doc_id,
                "page_id": page_id,
                "page_number": page_number,
                "relevance": str(qrel.get("relevance", "")),
                "evidence_note": "TEMPLATE_ONLY; inspect original PDF/chunk before setting relevance=1",
                "labeler": "",
                "verified": "false",
            }
        )

    workbook = pd.DataFrame(workbook_rows, columns=WORKBOOK_COLUMNS)
    final_questions = pd.DataFrame(final_question_rows, columns=FINAL_QUESTION_COLUMNS)
    final_qrels = pd.DataFrame(final_qrel_rows, columns=FINAL_QREL_COLUMNS)

    write_csv(workbook, benchmark_dir / "labeling_workbook.csv")
    write_csv(final_questions, benchmark_dir / "final_questions_template.csv")
    write_csv(final_qrels, benchmark_dir / "final_qrels_template.csv")
    return workbook, final_questions, final_qrels


def write_checklist(path: Path) -> None:
    path.write_text(
        """# Manual Labeling Checklist

Use `data/benchmark/labeling_workbook.csv` as the review surface. It is not ground truth.

## Choose 30-50 Final Questions

- Start from rows where `evidence_text` is readable and specific.
- Prefer questions spread across many PDFs.
- Avoid keeping many near-duplicate questions about the same year, person, or page.
- Set `keep_for_benchmark=true` only after you decide a row belongs in the final pilot set.
- Keep at least several question types represented. Include no-answer questions only after manually checking the corpus.

## Rewrite Vague Questions

- Replace generic wording such as "Tài liệu mô tả sự kiện gì..." with a concrete entity, year, event, policy, or period from the evidence.
- The final question should be answerable from the cited chunk/page, not from general historical knowledge.
- If `suggested_rewritten_question` is still vague, write your own final version.

## Verify Evidence

- Read `evidence_text` and `evidence_text_short`.
- Open the original PDF page when the page has OCR warnings, very short text, missing text, or suspicious characters.
- Confirm that `doc_id`, `page_id`, `page_number`, and `chunk_id` point to evidence that directly supports the question.
- If the chunk only mentions the right word but does not answer the question, keep `relevance=0`.

## Set Relevance

- Use `relevance=1` only when the chunk/page contains sufficient evidence.
- Use `relevance=0` when inspected evidence is not sufficient.
- Set `verified=true` only after manual inspection.
- Fill `labeler` with your name or initials for every verified row.

## No-Answer Questions

- Replace placeholder no-answer questions with real questions that should not have supporting evidence in the 15 PDFs.
- Search the extracted chunks and inspect likely PDFs before deciding.
- For verified no-answer rows, use `relevance=NONE`, leave evidence IDs blank, and set `verified=true`.
- Do not use `NONE` simply because the automatic candidate lacks evidence.

## Avoid Auto-Ground-Truth Leakage

- Candidate questions and template qrels are automatically generated suggestions.
- Do not treat `proposed_answer` as final; it is only a short extract from the candidate evidence when obvious.
- Do not evaluate retrieval until final `questions.csv` and `qrels.csv` contain manually verified labels.
""",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a human-friendly manual labeling workbook.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    workbook, _, _ = create_workbook(args.config)
    checklist_path = resolve_path(load_config(args.config), "benchmark_dir") / "manual_labeling_checklist.md"
    write_checklist(checklist_path)

    has_evidence = workbook["evidence_text"].astype(str).str.strip() != ""
    missing_evidence = ~has_evidence
    ocr_needed = workbook["ocr_needed"].map(truthy)
    from_image_only = workbook["doc_id"].isin(["D003", "D007"])

    logger.info("Wrote data/benchmark/labeling_workbook.csv")
    logger.info("Wrote data/benchmark/final_questions_template.csv")
    logger.info("Wrote data/benchmark/final_qrels_template.csv")
    logger.info("Wrote data/benchmark/manual_labeling_checklist.md")
    print(f"total rows: {len(workbook)}")
    print(f"rows with evidence text: {int(has_evidence.sum())}")
    print(f"rows missing evidence text: {int(missing_evidence.sum())}")
    print(f"rows needing OCR: {int(ocr_needed.sum())}")
    print(f"rows from D003/D007: {int(from_image_only.sum())}")
    print(
        "recommended next action: review labeling_workbook.csv, rewrite vague questions, "
        "set keep_for_benchmark=true only for accepted rows, and set verified=true only after manual evidence checks."
    )


if __name__ == "__main__":
    main()
