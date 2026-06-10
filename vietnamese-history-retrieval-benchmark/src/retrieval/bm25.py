from __future__ import annotations

import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

from src.utils.io import ensure_dir
from src.utils.text import tokenize_vietnamese, tokenizer_name


def _load_rank_bm25():
    try:
        from rank_bm25 import BM25Okapi

        return BM25Okapi
    except Exception as exc:
        raise RuntimeError("rank_bm25 is required. Install with `pip install rank-bm25`.") from exc


def build_bm25_index(chunks: pd.DataFrame, index_dir: str | Path) -> None:
    BM25Okapi = _load_rank_bm25()
    index_dir = ensure_dir(index_dir)
    chunks = chunks.copy()
    chunks["text"] = chunks["text"].fillna("")
    tokenized_corpus = [tokenize_vietnamese(text) for text in chunks["text"].tolist()]
    bm25 = BM25Okapi(tokenized_corpus)

    with (index_dir / "bm25.pkl").open("wb") as f:
        pickle.dump({"index": bm25, "tokens": tokenized_corpus}, f)
    chunks.to_csv(index_dir / "metadata.csv", index=False)
    (index_dir / "index_info.json").write_text(
        json.dumps(
            {
                "num_chunks": int(len(chunks)),
                "tokenizer": tokenizer_name(),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def load_bm25_index(index_dir: str | Path):
    index_dir = Path(index_dir)
    with (index_dir / "bm25.pkl").open("rb") as f:
        payload = pickle.load(f)
    metadata = pd.read_csv(index_dir / "metadata.csv", dtype=str, keep_default_na=False)
    return payload["index"], metadata


def search_bm25(query: str, bm25_index, metadata: pd.DataFrame, top_k: int) -> list[dict]:
    tokens = tokenize_vietnamese(query)
    scores = np.asarray(bm25_index.get_scores(tokens), dtype=float)
    if len(scores) == 0:
        return []
    top_indices = np.argsort(scores)[::-1][:top_k]
    results = []
    for rank, idx in enumerate(top_indices, start=1):
        row = metadata.iloc[int(idx)].to_dict()
        row["rank"] = rank
        row["bm25_score"] = float(scores[int(idx)])
        row["score"] = float(scores[int(idx)])
        results.append(row)
    return results
