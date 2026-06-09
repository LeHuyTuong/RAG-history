from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from src.utils.io import ensure_dir


def _normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    embeddings = embeddings.astype("float32")
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return embeddings / norms


class DenseEncoder:
    def __init__(self, model_name: str, model_type: str):
        self.model_name = model_name
        self.model_type = model_type
        self.backend = "sentence_transformers"
        self.model = None

        if model_type == "bge_m3":
            try:
                from FlagEmbedding import BGEM3FlagModel

                self.model = BGEM3FlagModel(model_name, use_fp16=False)
                self.backend = "flagembedding_bge_m3"
                return
            except Exception:
                pass

        try:
            from sentence_transformers import SentenceTransformer
        except Exception as exc:
            raise RuntimeError(
                "sentence-transformers is required for dense retrieval. "
                "Install with `pip install sentence-transformers`."
            ) from exc
        self.model = SentenceTransformer(model_name)

    def encode(self, texts: list[str], batch_size: int, show_progress: bool = False) -> np.ndarray:
        if self.backend == "flagembedding_bge_m3":
            encoded = self.model.encode(texts, batch_size=batch_size, max_length=8192)
            dense = encoded.get("dense_vecs") if isinstance(encoded, dict) else encoded
            return _normalize_embeddings(np.asarray(dense, dtype="float32"))

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True,
            normalize_embeddings=False,
        )
        return _normalize_embeddings(np.asarray(embeddings, dtype="float32"))


def encode_texts(model_name: str, texts: list[str], model_type: str, batch_size: int) -> np.ndarray:
    return DenseEncoder(model_name, model_type).encode(texts, batch_size=batch_size, show_progress=True)


def _format_passages(texts: list[str], model_type: str) -> list[str]:
    if model_type == "e5":
        return [f"passage: {text}" for text in texts]
    return texts


def _format_query(query: str, model_type: str) -> str:
    if model_type == "e5":
        return f"query: {query}"
    return query


def build_dense_index(
    chunks: pd.DataFrame,
    index_dir: str | Path,
    model_name: str,
    model_type: str,
    batch_size: int,
) -> None:
    try:
        import faiss
    except Exception as exc:
        raise RuntimeError("faiss-cpu is required. Install with `pip install faiss-cpu`.") from exc

    index_dir = ensure_dir(index_dir)
    chunks = chunks.copy()
    chunks["text"] = chunks["text"].fillna("")
    passages = _format_passages(chunks["text"].tolist(), model_type)
    encoder = DenseEncoder(model_name, model_type)
    embeddings = encoder.encode(passages, batch_size=batch_size, show_progress=True)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, str(index_dir / "index.faiss"))
    np.save(index_dir / "embeddings.npy", embeddings)
    chunks.to_csv(index_dir / "metadata.csv", index=False)
    (index_dir / "index_info.json").write_text(
        json.dumps(
            {
                "model_name": model_name,
                "model_type": model_type,
                "num_chunks": int(len(chunks)),
                "embedding_dim": int(embeddings.shape[1]),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def load_dense_index(index_dir: str | Path):
    try:
        import faiss
    except Exception as exc:
        raise RuntimeError("faiss-cpu is required. Install with `pip install faiss-cpu`.") from exc

    index_dir = Path(index_dir)
    index = faiss.read_index(str(index_dir / "index.faiss"))
    metadata = pd.read_csv(index_dir / "metadata.csv", dtype=str, keep_default_na=False)
    info = json.loads((index_dir / "index_info.json").read_text(encoding="utf-8"))
    return index, metadata, info


def search_dense(
    query: str,
    index,
    metadata: pd.DataFrame,
    info: dict,
    top_k: int,
    encoder: DenseEncoder | None = None,
) -> list[dict]:
    model_name = str(info["model_name"])
    model_type = str(info["model_type"])
    batch_size = 1
    if encoder is None:
        encoder = DenseEncoder(model_name, model_type)
    query_embedding = encoder.encode([_format_query(query, model_type)], batch_size=batch_size)
    scores, indices = index.search(query_embedding.astype("float32"), top_k)
    results: list[dict] = []
    for rank, (score, idx) in enumerate(zip(scores[0], indices[0]), start=1):
        if idx < 0:
            continue
        row = metadata.iloc[int(idx)].to_dict()
        row["rank"] = rank
        row["dense_score"] = float(score)
        row["score"] = float(score)
        results.append(row)
    return results
