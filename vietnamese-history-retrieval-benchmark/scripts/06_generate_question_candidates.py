from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.question_generation import CANDIDATE_COLUMNS, generate_candidates
from src.pdf_processing.chunking import CHUNK_COLUMNS
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate unverified Vietnamese question candidates from chunks.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--max-candidates", type=int, default=200)
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    chunks = read_csv(resolve_path(config, "extracted_dir") / "chunks.csv", CHUNK_COLUMNS)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    if chunks.empty:
        raise SystemExit("No chunks found. Run scripts/05_chunk_pages.py first.")

    candidates = generate_candidates(chunks, max_candidates=args.max_candidates)
    write_csv(candidates, benchmark_dir / "question_generation_candidates.csv")
    logger.info("Wrote %s unverified candidates to %s", len(candidates), benchmark_dir / "question_generation_candidates.csv")


if __name__ == "__main__":
    main()
