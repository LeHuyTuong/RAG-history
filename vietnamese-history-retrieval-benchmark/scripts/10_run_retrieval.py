from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.qrels import relevant_chunk_ids_by_qid, verified_qrels
from src.retrieval.bm25 import load_bm25_index, search_bm25
from src.retrieval.dense import DenseEncoder, load_dense_index, search_dense
from src.retrieval.hybrid import apply_temporal_entity_boost, combine_hybrid
from src.utils.io import load_config, read_csv, resolve_path, truthy, write_csv
from src.utils.logging import setup_logging
from src.utils.text import text_preview

RETRIEVAL_COLUMNS = [
    "qid",
    "method",
    "rank",
    "chunk_id",
    "doc_id",
    "page_id",
    "page_number",
    "score",
    "dense_score",
    "bm25_score",
    "text_preview",
    "is_relevant",
]


class RetrievalRunner:
    def __init__(self, config: dict):
        self.config = config
        self.indexes_dir = resolve_path(config, "indexes_dir")
        self.bm25_bundle = None
        self.bge_bundle = None
        self.e5_bundle = None
        self.bm25_cache: dict[str, list[dict]] = {}
        self.bge_cache: dict[str, list[dict]] = {}
        self.e5_cache: dict[str, list[dict]] = {}

    def method_available(self, method: str) -> tuple[bool, str]:
        bm25_ok = (self.indexes_dir / "bm25" / "bm25.pkl").exists()
        e5_ok = (self.indexes_dir / "faiss_e5" / "index.faiss").exists()
        bge_ok = (self.indexes_dir / "faiss_bge_m3" / "index.faiss").exists()
        if method == "bm25":
            return bm25_ok, "missing indexes/bm25/bm25.pkl"
        if method == "e5":
            return e5_ok, "missing indexes/faiss_e5/index.faiss"
        if method == "bge_m3":
            return bge_ok, "missing indexes/faiss_bge_m3/index.faiss"
        if method == "hybrid_e5":
            return bm25_ok and e5_ok, "missing BM25 or E5 index"
        if method in {"hybrid_bge_m3", "temporal_entity_hybrid_bge_m3"}:
            return bm25_ok and bge_ok, "missing BM25 or BGE-M3 index"
        return False, "unknown method"

    def bm25(self, query: str) -> list[dict]:
        if query not in self.bm25_cache:
            if self.bm25_bundle is None:
                self.bm25_bundle = load_bm25_index(self.indexes_dir / "bm25")
            index, metadata = self.bm25_bundle
            self.bm25_cache[query] = search_bm25(query, index, metadata, int(self.config.get("bm25_top_k", 50)))
        return self.bm25_cache[query]

    def bge_m3(self, query: str) -> list[dict]:
        if query not in self.bge_cache:
            if self.bge_bundle is None:
                index, metadata, info = load_dense_index(self.indexes_dir / "faiss_bge_m3")
                encoder = DenseEncoder(info["model_name"], info["model_type"])
                self.bge_bundle = (index, metadata, info, encoder)
            index, metadata, info, encoder = self.bge_bundle
            self.bge_cache[query] = search_dense(
                query,
                index,
                metadata,
                info,
                int(self.config.get("dense_top_k", 50)),
                encoder=encoder,
            )
        return self.bge_cache[query]

    def e5(self, query: str) -> list[dict]:
        if query not in self.e5_cache:
            if self.e5_bundle is None:
                index, metadata, info = load_dense_index(self.indexes_dir / "faiss_e5")
                encoder = DenseEncoder(info["model_name"], info["model_type"])
                self.e5_bundle = (index, metadata, info, encoder)
            index, metadata, info, encoder = self.e5_bundle
            self.e5_cache[query] = search_dense(
                query,
                index,
                metadata,
                info,
                int(self.config.get("dense_top_k", 50)),
                encoder=encoder,
            )
        return self.e5_cache[query]

    def run_method(self, method: str, query: str) -> list[dict]:
        top_k = int(self.config.get("hybrid_top_k", 50))
        if method == "bm25":
            return self.bm25(query)[: int(self.config.get("bm25_top_k", 50))]
        if method == "bge_m3":
            return self.bge_m3(query)[: int(self.config.get("dense_top_k", 50))]
        if method == "e5":
            return self.e5(query)[: int(self.config.get("dense_top_k", 50))]
        if method == "hybrid_bge_m3":
            return combine_hybrid(self.bm25(query), self.bge_m3(query), self.config, top_k=top_k)
        if method == "hybrid_e5":
            return combine_hybrid(self.bm25(query), self.e5(query), self.config, top_k=top_k)
        if method == "temporal_entity_hybrid_bge_m3":
            hybrid = combine_hybrid(self.bm25(query), self.bge_m3(query), self.config, top_k=top_k)
            return apply_temporal_entity_boost(query, hybrid, self.config)[:top_k]
        raise ValueError(f"Unknown method: {method}")


def _methods_from_args(method_arg: str, config: dict, include_hybrid_e5: bool, include_temporal: bool) -> list[str]:
    if method_arg != "all":
        return [method_arg]
    methods = ["bm25", "e5", "bge_m3", "hybrid_e5", "hybrid_bge_m3"]
    if include_temporal or truthy(config.get("run_temporal_entity_rag_lite", False)):
        methods.append("temporal_entity_hybrid_bge_m3")
    return methods


def _result_row(qid: str, method: str, row: dict, relevant_chunks: set[str]) -> dict:
    chunk_id = str(row.get("chunk_id", ""))
    page_number = row.get("page_start", row.get("page_number", ""))
    return {
        "qid": qid,
        "method": method,
        "rank": row.get("rank", ""),
        "chunk_id": chunk_id,
        "doc_id": row.get("doc_id", ""),
        "page_id": row.get("page_id", ""),
        "page_number": page_number,
        "score": f"{float(row.get('score', 0.0)):.8f}",
        "dense_score": "" if "dense_score" not in row else f"{float(row.get('dense_score', 0.0)):.8f}",
        "bm25_score": "" if "bm25_score" not in row else f"{float(row.get('bm25_score', 0.0)):.8f}",
        "text_preview": text_preview(row.get("text", "")),
        "is_relevant": str(chunk_id in relevant_chunks).lower(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run retrieval baselines and write results/retrieval_results.csv.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument(
        "--method",
        default="all",
        choices=[
            "all",
            "bm25",
            "bge_m3",
            "e5",
            "hybrid_bge_m3",
            "hybrid_e5",
            "temporal_entity_hybrid_bge_m3",
        ],
    )
    parser.add_argument("--include-hybrid-e5", action="store_true")
    parser.add_argument("--include-temporal-rag-lite", action="store_true")
    parser.add_argument("--questions", default=None, help="Path to questions CSV. Defaults to data/benchmark/questions.csv.")
    parser.add_argument("--qrels", default=None, help="Path to qrels CSV. Defaults to data/benchmark/qrels.csv.")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    results_dir = resolve_path(config, "results_dir")
    questions_path = Path(args.questions) if args.questions else benchmark_dir / "questions.csv"
    qrels_path = Path(args.qrels) if args.qrels else benchmark_dir / "qrels.csv"
    if not questions_path.is_absolute():
        questions_path = ROOT / questions_path
    if not qrels_path.is_absolute():
        qrels_path = ROOT / qrels_path
    questions = read_csv(questions_path)
    qrels = read_csv(qrels_path)

    if questions.empty:
        raise SystemExit("No questions found. Finalize data/benchmark/questions.csv first.")

    include_silver = "label_quality" in qrels.columns and qrels["label_quality"].astype(str).str.lower().eq("silver").any()
    verified = verified_qrels(qrels)
    if verified.empty:
        if include_silver:
            logger.warning("No human-verified qrels found. Using silver_qrels for preliminary is_relevant flags.")
        else:
            logger.warning("No verified qrels found. is_relevant will be false and metrics should remain TBD.")
    relevant_by_qid = relevant_chunk_ids_by_qid(qrels, include_silver=include_silver)

    methods = _methods_from_args(args.method, config, args.include_hybrid_e5, args.include_temporal_rag_lite)
    runner = RetrievalRunner(config)
    available_methods = []
    status_rows = []
    for method in methods:
        available, reason = runner.method_available(method)
        status_rows.append({"method": method, "status": "available" if available else "unavailable", "reason": "" if available else reason})
        if available:
            available_methods.append(method)
        else:
            logger.warning("Skipping method=%s: %s", method, reason)
    if not available_methods:
        raise SystemExit("No requested retrieval methods have built indexes.")
    write_csv(pd.DataFrame(status_rows), results_dir / "baseline_run_status.csv")
    output_rows = []
    for question in questions.to_dict("records"):
        qid = str(question["qid"])
        query = str(question["question"])
        for method in available_methods:
            logger.info("Retrieving qid=%s method=%s", qid, method)
            results = runner.run_method(method, query)
            relevant_chunks = relevant_by_qid.get(qid, set())
            output_rows.extend(_result_row(qid, method, row, relevant_chunks) for row in results)

    output = pd.DataFrame(output_rows, columns=RETRIEVAL_COLUMNS)
    write_csv(output, results_dir / "retrieval_results.csv")
    logger.info("Wrote %s retrieval rows to %s", len(output), results_dir / "retrieval_results.csv")


if __name__ == "__main__":
    main()
