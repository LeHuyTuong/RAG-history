from __future__ import annotations

import pandas as pd

from src.evaluation.qrels import (
    answerable_qids,
    expected_pages_by_qid,
    no_answer_qids,
    relevant_chunk_ids_by_qid,
)

METRIC_COLUMNS = [
    "method",
    "num_queries",
    "recall_at_5",
    "recall_at_10",
    "mrr_at_10",
    "evidence_hit_rate_at_5",
    "citation_accuracy_at_5",
    "no_answer_accuracy",
]

PER_QUERY_COLUMNS = [
    "qid",
    "question",
    "question_type",
    "method",
    "first_relevant_rank",
    "hit_at_5",
    "hit_at_10",
    "reciprocal_rank",
    "expected_pages",
    "retrieved_pages_top5",
    "error_type",
]


def _safe_mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _infer_error_type(
    question_type: str,
    is_no_answer: bool,
    no_answer_correct: bool | None,
    hit_at_5: bool,
    citation_hit_at_5: bool,
    first_relevant_rank: int | None,
) -> str:
    if is_no_answer:
        return "no_error" if no_answer_correct else "no_answer_failed"
    if hit_at_5:
        return "no_error"
    if citation_hit_at_5 and first_relevant_rank is None:
        return "chunking_error"
    if citation_hit_at_5 and first_relevant_rank and first_relevant_rank > 5:
        return "chunking_error"
    if question_type == "fact_date":
        return "missed_exact_date"
    if question_type == "person_entity":
        return "missed_named_entity"
    if question_type in {"event", "timeline", "cause_effect", "policy_concept", "multi_hop"}:
        return "semantic_mismatch"
    return "wrong_page"


def evaluate_retrieval(
    questions: pd.DataFrame,
    qrels: pd.DataFrame,
    retrieval_results: pd.DataFrame,
    no_answer_threshold: float,
    include_silver: bool = False,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    if questions.empty or qrels.empty or retrieval_results.empty:
        return (
            pd.DataFrame(columns=METRIC_COLUMNS),
            pd.DataFrame(columns=PER_QUERY_COLUMNS),
        )

    questions = questions.copy()
    questions["qid"] = questions["qid"].astype(str)
    retrieval_results = retrieval_results.copy()
    retrieval_results["qid"] = retrieval_results["qid"].astype(str)
    retrieval_results["rank_int"] = retrieval_results["rank"].astype(int)
    retrieval_results["score_float"] = retrieval_results["score"].astype(float)

    relevant_chunks = relevant_chunk_ids_by_qid(qrels, include_silver=include_silver)
    expected_pages = expected_pages_by_qid(qrels, include_silver=include_silver)
    no_answer = no_answer_qids(questions, qrels, include_silver=include_silver)
    answerable = set(answerable_qids(questions, qrels, include_silver=include_silver))
    methods = sorted(retrieval_results["method"].astype(str).unique())
    question_by_id = {row["qid"]: row for row in questions.to_dict("records")}

    metric_rows = []
    per_query_rows = []

    for method in methods:
        method_results = retrieval_results[retrieval_results["method"].astype(str) == method]
        recall5_values: list[float] = []
        recall10_values: list[float] = []
        mrr10_values: list[float] = []
        citation5_values: list[float] = []
        no_answer_values: list[float] = []

        evaluated_qids = sorted(answerable | no_answer)
        for qid in evaluated_qids:
            question = question_by_id.get(qid, {})
            question_type = str(question.get("question_type", ""))
            query_results = method_results[method_results["qid"] == qid].sort_values("rank_int")
            top5 = query_results.head(5)
            top10 = query_results.head(10)
            relevant = relevant_chunks.get(qid, set())
            expected = expected_pages.get(qid, set())
            retrieved_chunks_top10 = top10["chunk_id"].astype(str).tolist()
            retrieved_pages_top5 = top5["page_number"].astype(str).tolist()

            first_relevant_rank: int | None = None
            for _, row in top10.iterrows():
                if str(row["chunk_id"]) in relevant:
                    first_relevant_rank = int(row["rank_int"])
                    break

            hit_at_5 = any(str(chunk_id) in relevant for chunk_id in top5["chunk_id"].astype(str))
            hit_at_10 = any(chunk_id in relevant for chunk_id in retrieved_chunks_top10)
            citation_hit_at_5 = bool(expected and expected.intersection(set(retrieved_pages_top5)))
            reciprocal_rank = 1.0 / first_relevant_rank if first_relevant_rank else 0.0

            is_no_answer = qid in no_answer
            no_answer_correct: bool | None = None
            if is_no_answer:
                max_score = float(top5["score_float"].max()) if not top5.empty else 0.0
                no_answer_correct = max_score < no_answer_threshold
                no_answer_values.append(1.0 if no_answer_correct else 0.0)
            elif qid in answerable:
                recall5_values.append(1.0 if hit_at_5 else 0.0)
                recall10_values.append(1.0 if hit_at_10 else 0.0)
                mrr10_values.append(reciprocal_rank)
                citation5_values.append(1.0 if citation_hit_at_5 else 0.0)

            per_query_rows.append(
                {
                    "qid": qid,
                    "question": str(question.get("question", "")),
                    "question_type": question_type,
                    "method": method,
                    "first_relevant_rank": "" if first_relevant_rank is None else first_relevant_rank,
                    "hit_at_5": str(hit_at_5).lower(),
                    "hit_at_10": str(hit_at_10).lower(),
                    "reciprocal_rank": f"{reciprocal_rank:.6f}",
                    "expected_pages": "|".join(sorted(expected)),
                    "retrieved_pages_top5": "|".join(retrieved_pages_top5),
                    "error_type": _infer_error_type(
                        question_type,
                        is_no_answer,
                        no_answer_correct,
                        hit_at_5,
                        citation_hit_at_5,
                        first_relevant_rank,
                    ),
                }
            )

        metric_rows.append(
            {
                "method": method,
                "num_queries": len(evaluated_qids),
                "recall_at_5": _safe_mean(recall5_values),
                "recall_at_10": _safe_mean(recall10_values),
                "mrr_at_10": _safe_mean(mrr10_values),
                "evidence_hit_rate_at_5": _safe_mean(recall5_values),
                "citation_accuracy_at_5": _safe_mean(citation5_values),
                "no_answer_accuracy": _safe_mean(no_answer_values),
            }
        )

    return (
        pd.DataFrame(metric_rows, columns=METRIC_COLUMNS),
        pd.DataFrame(per_query_rows, columns=PER_QUERY_COLUMNS),
    )
