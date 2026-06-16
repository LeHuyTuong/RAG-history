from __future__ import annotations

import json
import re
import unicodedata
from typing import Any

import pandas as pd

from src.utils.io import truthy
from src.utils.text import detect_years, tokenize_vietnamese


ANSWER_EVALUATION_COLUMNS = [
    "qid",
    "question",
    "expected_answer",
    "actual_answer",
    "citations",
    "correctness_score",
    "faithfulness_score",
    "hallucination_flag",
    "evaluation_status",
    "question_type",
    "expected_source",
    "citation_hit",
    "answer_token_recall",
    "answer_token_precision",
    "faithfulness_token_precision",
    "judge_notes",
]

ANSWER_METRIC_COLUMNS = [
    "num_questions",
    "evaluated_questions",
    "missing_ground_truth",
    "missing_chat_results",
    "mean_correctness_score",
    "mean_faithfulness_score",
    "hallucination_rate",
    "citation_hit_rate",
    "no_answer_accuracy",
]

ANSWER_COLUMNS = [
    "expected_answer",
    "proposed_answer",
    "reference_answer",
    "gold_answer",
    "answer_text",
    "expected_answer_summary",
]

EVIDENCE_COLUMNS = [
    "evidence_text",
    "evidence_note",
    "answer_text",
    "text_preview",
]

ACTUAL_ANSWER_COLUMNS = [
    "actual_answer",
    "answer",
    "response_answer",
]

REFUSAL_MARKERS = [
    "khong du",
    "khong co du lieu",
    "khong co thong tin",
    "chua du",
    "chua co du lieu",
    "du lieu chua du",
    "không đủ",
    "không có dữ liệu",
    "không có thông tin",
    "chưa đủ",
    "chưa có dữ liệu",
    "dữ liệu chưa đủ",
    "insufficient",
    "cannot answer",
    "no data",
]

STOPWORDS = {
    "a",
    "ai",
    "an",
    "anh",
    "bi",
    "boi",
    "cac",
    "cai",
    "can",
    "cang",
    "cau",
    "cho",
    "chua",
    "co",
    "con",
    "cua",
    "cung",
    "da",
    "dang",
    "day",
    "de",
    "den",
    "duoc",
    "duoi",
    "gi",
    "hai",
    "hay",
    "hoac",
    "hoi",
    "khi",
    "la",
    "lai",
    "lam",
    "mot",
    "nao",
    "nay",
    "nam",
    "neu",
    "nhieu",
    "nhung",
    "nhu",
    "o",
    "qua",
    "ra",
    "rang",
    "sau",
    "the",
    "thi",
    "theo",
    "trong",
    "tu",
    "va",
    "vao",
    "ve",
    "vi",
    "voi",
}


def evaluate_answers(
    questions: pd.DataFrame,
    qrels: pd.DataFrame,
    chat_results: pd.DataFrame,
    include_silver: bool = False,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    if questions.empty:
        return (
            pd.DataFrame(columns=ANSWER_EVALUATION_COLUMNS),
            pd.DataFrame(columns=ANSWER_METRIC_COLUMNS),
        )

    questions = questions.copy()
    questions["qid"] = questions["qid"].astype(str)
    usable_qrels = _usable_qrels(qrels, include_silver=include_silver)
    qrels_by_qid = _group_by_qid(usable_qrels)
    chat_by_qid = _chat_results_by_qid(chat_results)

    rows = []
    for question in questions.to_dict("records"):
        qid = str(question.get("qid", ""))
        qrel_rows = qrels_by_qid.get(qid, [])
        chat_row = chat_by_qid.get(qid)
        expected_answer = _expected_answer(question, qrel_rows)
        actual_answer = _actual_answer(chat_row)
        citations = _parse_citations(_first_value(chat_row or {}, ["citations", "citation_json", "sources"]))
        citation_text = _canonical_citations(citations, chat_row)
        is_no_answer = _is_no_answer_question(question, qrel_rows)
        has_ground_truth = bool(expected_answer) or is_no_answer
        chat_error = _chat_result_error(chat_row)
        has_chat_result = chat_row is not None and not chat_error
        expected_for_output = "NO_ANSWER" if is_no_answer else expected_answer

        if not has_ground_truth:
            status = "missing_ground_truth"
            correctness = None
            faithfulness = None
            hallucination = "unknown"
            answer_precision = None
            answer_recall = None
            faithfulness_precision = None
            citation_hit = None
            notes = "No expected answer or verified/silver qrel was available."
        elif not has_chat_result:
            status = "chat_result_error" if chat_error else "missing_chat_result"
            correctness = None
            faithfulness = None
            hallucination = "unknown"
            answer_precision = None
            answer_recall = None
            faithfulness_precision = None
            citation_hit = None
            notes = _chat_error_note(chat_row) if chat_error else "No RAG chat result row was available for this qid."
        else:
            status = "evaluated"
            correctness, answer_precision, answer_recall, correctness_note = _score_correctness(
                expected_answer=expected_answer,
                actual_answer=actual_answer,
                is_no_answer=is_no_answer,
            )
            citation_hit = _citation_hit(citations, qrel_rows)
            faithfulness, faithfulness_precision, faithfulness_note = _score_faithfulness(
                expected_answer=expected_answer,
                actual_answer=actual_answer,
                citations=citations,
                qrel_rows=qrel_rows,
                citation_hit=citation_hit,
                is_no_answer=is_no_answer,
            )
            hallucination = _hallucination_flag(
                actual_answer=actual_answer,
                correctness_score=correctness,
                faithfulness_score=faithfulness,
                is_no_answer=is_no_answer,
            )
            notes = "; ".join(part for part in [correctness_note, faithfulness_note] if part)

        rows.append(
            {
                "qid": qid,
                "question": str(question.get("question", "")),
                "expected_answer": expected_for_output,
                "actual_answer": actual_answer,
                "citations": citation_text,
                "correctness_score": _format_optional_score(correctness),
                "faithfulness_score": _format_optional_score(faithfulness),
                "hallucination_flag": hallucination,
                "evaluation_status": status,
                "question_type": str(question.get("question_type", "")),
                "expected_source": _expected_source(qrel_rows),
                "citation_hit": _format_optional_bool(citation_hit),
                "answer_token_recall": _format_optional_float(answer_recall),
                "answer_token_precision": _format_optional_float(answer_precision),
                "faithfulness_token_precision": _format_optional_float(faithfulness_precision),
                "judge_notes": notes,
            }
        )

    evaluation = pd.DataFrame(rows, columns=ANSWER_EVALUATION_COLUMNS)
    metrics = summarize_answer_evaluation(evaluation)
    return evaluation, metrics


def summarize_answer_evaluation(evaluation: pd.DataFrame) -> pd.DataFrame:
    if evaluation.empty:
        return pd.DataFrame(columns=ANSWER_METRIC_COLUMNS)

    evaluated = evaluation[evaluation["evaluation_status"] == "evaluated"].copy()
    correctness = pd.to_numeric(evaluated["correctness_score"], errors="coerce")
    faithfulness = pd.to_numeric(evaluated["faithfulness_score"], errors="coerce")
    hallucination_flags = evaluated["hallucination_flag"].astype(str).str.lower()
    citation_hits = evaluated["citation_hit"].astype(str).str.lower()
    no_answer_rows = evaluated[evaluated["expected_answer"].astype(str) == "NO_ANSWER"]
    no_answer_correct = pd.to_numeric(no_answer_rows["correctness_score"], errors="coerce")

    row = {
        "num_questions": len(evaluation),
        "evaluated_questions": len(evaluated),
        "missing_ground_truth": int((evaluation["evaluation_status"] == "missing_ground_truth").sum()),
        "missing_chat_results": int(evaluation["evaluation_status"].isin(["missing_chat_result", "chat_result_error"]).sum()),
        "mean_correctness_score": _mean_or_blank(correctness),
        "mean_faithfulness_score": _mean_or_blank(faithfulness),
        "hallucination_rate": _rate_or_blank(hallucination_flags == "true"),
        "citation_hit_rate": _rate_or_blank(citation_hits == "true"),
        "no_answer_accuracy": _mean_or_blank((no_answer_correct == 3).astype(float)) if not no_answer_rows.empty else "",
    }
    return pd.DataFrame([row], columns=ANSWER_METRIC_COLUMNS)


def _usable_qrels(qrels: pd.DataFrame, include_silver: bool) -> pd.DataFrame:
    if qrels.empty:
        return qrels.copy()
    masks = []
    if "verified" in qrels.columns:
        masks.append(qrels["verified"].map(truthy))
    if include_silver and "label_quality" in qrels.columns:
        masks.append(qrels["label_quality"].astype(str).str.lower().eq("silver"))
    if not masks:
        return qrels.copy()
    mask = masks[0]
    for extra in masks[1:]:
        mask = mask | extra
    return qrels[mask].copy()


def _group_by_qid(df: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    if df.empty or "qid" not in df.columns:
        return {}
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in df.to_dict("records"):
        grouped.setdefault(str(row.get("qid", "")), []).append(row)
    return grouped


def _chat_results_by_qid(df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    if df.empty or "qid" not in df.columns:
        return {}
    return {str(row.get("qid", "")): row for row in df.to_dict("records")}


def _expected_answer(question: dict[str, Any], qrel_rows: list[dict[str, Any]]) -> str:
    question_answer = _first_value(question, ANSWER_COLUMNS)
    if question_answer:
        return question_answer
    answers = [_first_value(row, ["answer_text", "proposed_answer", "expected_answer"]) for row in qrel_rows]
    answers = [answer for answer in answers if answer]
    return " | ".join(dict.fromkeys(answers))


def _actual_answer(chat_row: dict[str, Any] | None) -> str:
    if not chat_row:
        return ""
    return _first_value(chat_row, ACTUAL_ANSWER_COLUMNS)


def _chat_result_error(chat_row: dict[str, Any] | None) -> bool:
    if not chat_row:
        return False
    status = str(chat_row.get("status", "")).strip().lower()
    return status in {"error", "failed", "failure"}


def _chat_error_note(chat_row: dict[str, Any] | None) -> str:
    error = _first_value(chat_row or {}, ["error", "error_message", "detail"])
    if error:
        return f"RAG chat result has error status: {error}"
    return "RAG chat result has error status."


def _is_no_answer_question(question: dict[str, Any], qrel_rows: list[dict[str, Any]]) -> bool:
    if str(question.get("question_type", "")).lower() == "no_answer":
        return True
    return any(str(row.get("relevance", "")).upper() == "NONE" for row in qrel_rows)


def _score_correctness(
    expected_answer: str,
    actual_answer: str,
    is_no_answer: bool,
) -> tuple[int, float, float, str]:
    if is_no_answer:
        if _is_refusal(actual_answer):
            return 3, 1.0, 1.0, "No-answer question correctly refused."
        return 0, 0.0, 0.0, "No-answer question received a substantive answer."
    if not actual_answer.strip() or _is_refusal(actual_answer):
        return 0, 0.0, 0.0, "Answer is empty or refuses despite available ground truth."

    precision, recall, f1 = _token_scores(expected_answer, actual_answer)
    score = _score_from_overlap(precision=precision, recall=recall, f1=f1)
    missing_years = [year for year in detect_years(expected_answer) if year not in detect_years(actual_answer)]
    if missing_years:
        score = min(score, 1)
        return score, precision, recall, f"Missing expected year(s): {', '.join(missing_years)}."
    return score, precision, recall, f"Token precision={precision:.2f}, recall={recall:.2f}, f1={f1:.2f}."


def _score_faithfulness(
    expected_answer: str,
    actual_answer: str,
    citations: list[dict[str, Any]],
    qrel_rows: list[dict[str, Any]],
    citation_hit: bool,
    is_no_answer: bool,
) -> tuple[int, float, str]:
    if is_no_answer:
        if _is_refusal(actual_answer):
            return 3, 1.0, "No-answer refusal is faithful to missing evidence."
        return 0, 0.0, "No-answer expected, but answer asserted unsupported information."
    if not actual_answer.strip() or _is_refusal(actual_answer):
        return 0, 0.0, "Answer is empty or refuses despite available evidence."
    if not citations:
        return 0, 0.0, "Answer has no citations."

    evidence_text = _joined_evidence_text(qrel_rows, citations, expected_answer)
    evidence_precision, _, evidence_f1 = _token_scores(evidence_text, actual_answer)
    if citation_hit and evidence_precision >= 0.7:
        return 3, evidence_precision, "Answer tokens are well supported by a relevant citation."
    if citation_hit and evidence_precision >= 0.4:
        return 2, evidence_precision, "Relevant citation found, but answer support is partial."
    if citation_hit:
        return 2, evidence_precision, "Relevant citation found; textual support could not be strongly verified."
    if evidence_f1 >= 0.45:
        return 2, evidence_precision, "Answer overlaps expected evidence, but cited source did not match qrels."
    return 1, evidence_precision, "Citations exist, but they do not match expected evidence."


def _hallucination_flag(
    actual_answer: str,
    correctness_score: int,
    faithfulness_score: int,
    is_no_answer: bool,
) -> str:
    if not actual_answer.strip():
        return "false"
    if is_no_answer and not _is_refusal(actual_answer):
        return "true"
    if _is_refusal(actual_answer):
        return "false"
    return str(correctness_score <= 1 or faithfulness_score <= 1).lower()


def _score_from_overlap(precision: float, recall: float, f1: float) -> int:
    if recall >= 0.85 or f1 >= 0.75:
        return 3
    if recall >= 0.55 or f1 >= 0.45:
        return 2
    if recall >= 0.25 or precision >= 0.25:
        return 1
    return 0


def _token_scores(reference: str, candidate: str) -> tuple[float, float, float]:
    reference_tokens = set(_content_tokens(reference))
    candidate_tokens = set(_content_tokens(candidate))
    if not reference_tokens or not candidate_tokens:
        return 0.0, 0.0, 0.0
    overlap = reference_tokens & candidate_tokens
    precision = len(overlap) / len(candidate_tokens)
    recall = len(overlap) / len(reference_tokens)
    f1 = 0.0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)
    return precision, recall, f1


def _content_tokens(text: str) -> list[str]:
    tokens = [_fold(token) for token in tokenize_vietnamese(text)]
    return [token for token in tokens if len(token) > 1 and token not in STOPWORDS]


def _fold(text: object) -> str:
    normalized = unicodedata.normalize("NFD", str(text or ""))
    without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "D").lower()


def _is_refusal(text: str) -> bool:
    folded = _fold(text)
    return any(marker in folded or marker in str(text).lower() for marker in REFUSAL_MARKERS)


def _parse_citations(value: object) -> list[dict[str, Any]]:
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return [{"raw": part.strip()} for part in re.split(r"[|;]", text) if part.strip()]
    if isinstance(parsed, list):
        return [item if isinstance(item, dict) else {"raw": item} for item in parsed]
    if isinstance(parsed, dict):
        if isinstance(parsed.get("citations"), list):
            return [item if isinstance(item, dict) else {"raw": item} for item in parsed["citations"]]
        return [parsed]
    return [{"raw": parsed}]


def _canonical_citations(citations: list[dict[str, Any]], chat_row: dict[str, Any] | None) -> str:
    raw = _first_value(chat_row or {}, ["citations", "citation_json", "sources"])
    if raw:
        return raw
    if not citations:
        return ""
    return json.dumps(citations, ensure_ascii=False, sort_keys=True)


def _citation_hit(citations: list[dict[str, Any]], qrel_rows: list[dict[str, Any]]) -> bool:
    relevant_rows = [row for row in qrel_rows if str(row.get("relevance", "")) == "1"]
    if not citations or not relevant_rows:
        return False
    return any(_citation_matches_qrel(citation, row) for citation in citations for row in relevant_rows)


def _citation_matches_qrel(citation: dict[str, Any], qrel: dict[str, Any]) -> bool:
    citation_chunk = _first_value(citation, ["chunk_id", "chunkId", "chunkID"])
    if citation_chunk and citation_chunk == str(qrel.get("chunk_id", "")):
        return True

    citation_page = _to_int(_first_value(citation, ["page_number", "pageNumber", "page"]))
    qrel_page = _to_int(qrel.get("page_number", ""))
    citation_doc = _doc_number(_first_value(citation, ["doc_id", "docId", "sourceId", "documentId"]))
    qrel_doc = _doc_number(qrel.get("doc_id", ""))
    if citation_doc is not None and qrel_doc is not None and citation_doc == qrel_doc and citation_page == qrel_page:
        return True
    if citation_page is not None and qrel_page is not None and citation_page == qrel_page:
        return True
    return False


def _joined_evidence_text(
    qrel_rows: list[dict[str, Any]],
    citations: list[dict[str, Any]],
    expected_answer: str,
) -> str:
    evidence_parts = []
    for row in qrel_rows:
        if str(row.get("relevance", "")) == "1":
            evidence_parts.append(_first_value(row, EVIDENCE_COLUMNS))
    for citation in citations:
        evidence_parts.append(_first_value(citation, ["text", "chunkText", "text_preview", "evidence_text", "raw"]))
    evidence_parts.append(expected_answer)
    return " ".join(part for part in evidence_parts if part)


def _expected_source(qrel_rows: list[dict[str, Any]]) -> str:
    sources = []
    for row in qrel_rows:
        if str(row.get("relevance", "")) != "1":
            continue
        doc_id = str(row.get("doc_id", "")).strip()
        page = str(row.get("page_number", "")).strip()
        chunk = str(row.get("chunk_id", "")).strip()
        parts = [part for part in [doc_id, f"page={page}" if page else "", chunk] if part]
        if parts:
            sources.append(":".join(parts))
    return "|".join(dict.fromkeys(sources))


def _first_value(row: dict[str, Any], columns: list[str]) -> str:
    for column in columns:
        value = row.get(column)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def _to_int(value: object) -> int | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _doc_number(value: object) -> int | None:
    text = str(value or "").strip()
    if not text:
        return None
    as_int = _to_int(text)
    if as_int is not None:
        return as_int
    match = re.search(r"D0*(\d+)", text, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _format_optional_score(value: int | None) -> str:
    return "" if value is None else str(value)


def _format_optional_float(value: float | None) -> str:
    return "" if value is None else f"{value:.6f}"


def _format_optional_bool(value: bool | None) -> str:
    return "" if value is None else str(value).lower()


def _mean_or_blank(series: pd.Series) -> str:
    series = series.dropna()
    if series.empty:
        return ""
    return f"{float(series.mean()):.6f}"


def _rate_or_blank(mask: pd.Series) -> str:
    if mask.empty:
        return ""
    return f"{float(mask.mean()):.6f}"
