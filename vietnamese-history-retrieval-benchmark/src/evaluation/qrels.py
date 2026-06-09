from __future__ import annotations

import pandas as pd

from src.utils.io import truthy


def verified_qrels(qrels: pd.DataFrame) -> pd.DataFrame:
    if qrels.empty:
        return qrels.copy()
    return qrels[qrels["verified"].map(truthy)].copy()


def usable_qrels(qrels: pd.DataFrame, include_silver: bool = False) -> pd.DataFrame:
    if qrels.empty:
        return qrels.copy()
    verified_mask = qrels["verified"].map(truthy) if "verified" in qrels.columns else False
    if include_silver and "label_quality" in qrels.columns:
        silver_mask = qrels["label_quality"].astype(str).str.lower().eq("silver")
        return qrels[verified_mask | silver_mask].copy()
    return qrels[verified_mask].copy()


def relevant_qrels(qrels: pd.DataFrame, include_silver: bool = False) -> pd.DataFrame:
    usable = usable_qrels(qrels, include_silver=include_silver)
    return usable[usable["relevance"].astype(str) == "1"].copy()


def no_answer_qids(questions: pd.DataFrame, qrels: pd.DataFrame, include_silver: bool = False) -> set[str]:
    qids = set(
        questions.loc[
            questions["question_type"].astype(str).str.lower() == "no_answer",
            "qid",
        ].astype(str)
    )
    usable = usable_qrels(qrels, include_silver=include_silver)
    if not usable.empty:
        none_rows = usable[usable["relevance"].astype(str).str.upper() == "NONE"]
        qids.update(none_rows["qid"].astype(str))
    return qids


def relevant_chunk_ids_by_qid(qrels: pd.DataFrame, include_silver: bool = False) -> dict[str, set[str]]:
    relevant = relevant_qrels(qrels, include_silver=include_silver)
    grouped: dict[str, set[str]] = {}
    for qid, group in relevant.groupby("qid"):
        grouped[str(qid)] = set(group["chunk_id"].astype(str))
    return grouped


def expected_pages_by_qid(qrels: pd.DataFrame, include_silver: bool = False) -> dict[str, set[str]]:
    relevant = relevant_qrels(qrels, include_silver=include_silver)
    grouped: dict[str, set[str]] = {}
    for qid, group in relevant.groupby("qid"):
        grouped[str(qid)] = set(group["page_number"].astype(str))
    return grouped


def answerable_qids(questions: pd.DataFrame, qrels: pd.DataFrame, include_silver: bool = False) -> list[str]:
    no_answer = no_answer_qids(questions, qrels, include_silver=include_silver)
    relevant = relevant_chunk_ids_by_qid(qrels, include_silver=include_silver)
    return [qid for qid in questions["qid"].astype(str).tolist() if qid not in no_answer and qid in relevant]
