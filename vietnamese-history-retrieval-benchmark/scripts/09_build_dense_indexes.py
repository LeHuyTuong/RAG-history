from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.chunking import CHUNK_COLUMNS
from src.retrieval.dense import build_dense_index
from src.utils.io import load_config, read_csv, resolve_path
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Build FAISS dense indexes for BGE-M3 and/or multilingual-E5.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--models", choices=["all", "bge_m3", "e5"], default="all")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    chunks = read_csv(resolve_path(config, "extracted_dir") / "chunks.csv", CHUNK_COLUMNS)
    if chunks.empty:
        raise SystemExit("No chunks found. Run scripts/05_chunk_pages.py first.")

    indexes_dir = resolve_path(config, "indexes_dir")
    batch_size = int(config.get("embedding_batch_size", 16))
    if args.models in {"all", "bge_m3"}:
        try:
            build_dense_index(
                chunks,
                indexes_dir / "faiss_bge_m3",
                model_name=str(config.get("bge_m3_model_name", "BAAI/bge-m3")),
                model_type="bge_m3",
                batch_size=batch_size,
            )
            logger.info("BGE-M3 FAISS index built.")
        except Exception as exc:
            logger.exception("BGE-M3 FAISS index failed; continuing when possible. Error: %s", exc)
            if args.models == "bge_m3":
                raise
    if args.models in {"all", "e5"}:
        try:
            build_dense_index(
                chunks,
                indexes_dir / "faiss_e5",
                model_name=str(config.get("e5_model_name", "intfloat/multilingual-e5-base")),
                model_type="e5",
                batch_size=batch_size,
            )
            logger.info("multilingual-E5 FAISS index built.")
        except Exception as exc:
            logger.exception("multilingual-E5 FAISS index failed. Error: %s", exc)
            raise


if __name__ == "__main__":
    main()
