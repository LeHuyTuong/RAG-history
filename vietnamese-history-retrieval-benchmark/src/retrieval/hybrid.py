from __future__ import annotations

from src.retrieval.scoring import min_max_normalize, reciprocal_rank_fusion
from src.utils.io import split_pipe
from src.utils.text import detect_entity_candidates, detect_years


def combine_weighted(
    bm25_results: list[dict],
    dense_results: list[dict],
    dense_weight: float,
    bm25_weight: float,
    top_k: int,
) -> list[dict]:
    bm25_scores = {str(row["chunk_id"]): float(row.get("bm25_score", row.get("score", 0.0))) for row in bm25_results}
    dense_scores = {str(row["chunk_id"]): float(row.get("dense_score", row.get("score", 0.0))) for row in dense_results}
    bm25_norm = min_max_normalize(bm25_scores)
    dense_norm = min_max_normalize(dense_scores)
    metadata = {str(row["chunk_id"]): dict(row) for row in bm25_results + dense_results}

    combined = []
    for chunk_id in sorted(set(bm25_scores) | set(dense_scores)):
        row = metadata[chunk_id]
        bm25_score = bm25_scores.get(chunk_id, 0.0)
        dense_score = dense_scores.get(chunk_id, 0.0)
        final_score = dense_weight * dense_norm.get(chunk_id, 0.0) + bm25_weight * bm25_norm.get(chunk_id, 0.0)
        row["score"] = float(final_score)
        row["dense_score"] = float(dense_score)
        row["bm25_score"] = float(bm25_score)
        combined.append(row)

    combined.sort(key=lambda row: row["score"], reverse=True)
    for rank, row in enumerate(combined[:top_k], start=1):
        row["rank"] = rank
    return combined[:top_k]


def combine_rrf(
    bm25_results: list[dict],
    dense_results: list[dict],
    rrf_k: int,
    top_k: int,
) -> list[dict]:
    bm25_ranked = [str(row["chunk_id"]) for row in bm25_results]
    dense_ranked = [str(row["chunk_id"]) for row in dense_results]
    fused_scores = reciprocal_rank_fusion([bm25_ranked, dense_ranked], rrf_k=rrf_k)
    metadata = {str(row["chunk_id"]): dict(row) for row in bm25_results + dense_results}
    bm25_scores = {str(row["chunk_id"]): float(row.get("bm25_score", row.get("score", 0.0))) for row in bm25_results}
    dense_scores = {str(row["chunk_id"]): float(row.get("dense_score", row.get("score", 0.0))) for row in dense_results}

    combined = []
    for chunk_id, score in fused_scores.items():
        row = metadata[chunk_id]
        row["score"] = float(score)
        row["dense_score"] = float(dense_scores.get(chunk_id, 0.0))
        row["bm25_score"] = float(bm25_scores.get(chunk_id, 0.0))
        combined.append(row)

    combined.sort(key=lambda row: row["score"], reverse=True)
    for rank, row in enumerate(combined[:top_k], start=1):
        row["rank"] = rank
    return combined[:top_k]


def combine_hybrid(
    bm25_results: list[dict],
    dense_results: list[dict],
    config: dict,
    top_k: int,
) -> list[dict]:
    if str(config.get("hybrid_fusion", "weighted")).lower() == "rrf":
        return combine_rrf(
            bm25_results,
            dense_results,
            rrf_k=int(config.get("rrf_k", 60)),
            top_k=top_k,
        )
    return combine_weighted(
        bm25_results,
        dense_results,
        dense_weight=float(config.get("dense_weight", 0.5)),
        bm25_weight=float(config.get("bm25_weight", 0.5)),
        top_k=top_k,
    )


def apply_temporal_entity_boost(query: str, results: list[dict], config: dict) -> list[dict]:
    boost = float(config.get("temporal_entity_boost", 0.05))
    query_years = set(detect_years(query))
    query_entities = {entity.lower() for entity in detect_entity_candidates(query)}

    boosted = []
    for row in results:
        updated = dict(row)
        chunk_years = set(split_pipe(updated.get("years_detected", "")))
        chunk_entities = {entity.lower() for entity in split_pipe(updated.get("entities_detected", ""))}
        added = 0.0
        if query_years and query_years.intersection(chunk_years):
            added += boost
        if query_entities and query_entities.intersection(chunk_entities):
            added += boost
        updated["score"] = float(updated.get("score", 0.0)) + added
        boosted.append(updated)

    boosted.sort(key=lambda row: row["score"], reverse=True)
    for rank, row in enumerate(boosted, start=1):
        row["rank"] = rank
    return boosted
