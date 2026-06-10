from __future__ import annotations

from collections import defaultdict


def min_max_normalize(score_by_id: dict[str, float]) -> dict[str, float]:
    if not score_by_id:
        return {}
    values = list(score_by_id.values())
    min_score = min(values)
    max_score = max(values)
    if max_score == min_score:
        return {key: 1.0 for key in score_by_id}
    return {
        key: (value - min_score) / (max_score - min_score)
        for key, value in score_by_id.items()
    }


def reciprocal_rank_fusion(ranked_lists: list[list[str]], rrf_k: int = 60) -> dict[str, float]:
    scores: dict[str, float] = defaultdict(float)
    for ranked in ranked_lists:
        for rank, chunk_id in enumerate(ranked, start=1):
            scores[chunk_id] += 1.0 / (rrf_k + rank)
    return dict(scores)
