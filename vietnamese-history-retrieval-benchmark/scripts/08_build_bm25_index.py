from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.chunking import CHUNK_COLUMNS
from src.retrieval.bm25 import build_bm25_index
from src.utils.io import load_config, read_csv, resolve_path
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Build BM25 index from chunks.csv.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    chunks = read_csv(resolve_path(config, "extracted_dir") / "chunks.csv", CHUNK_COLUMNS)
    if chunks.empty:
        raise SystemExit("No chunks found. Run scripts/05_chunk_pages.py first.")
    index_dir = resolve_path(config, "indexes_dir") / "bm25"
    build_bm25_index(chunks, index_dir)
    logger.info("BM25 index built at %s", index_dir)


if __name__ == "__main__":
    main()
