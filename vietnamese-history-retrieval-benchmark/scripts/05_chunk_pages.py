from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.chunking import CHUNK_COLUMNS, chunk_pages
from src.pdf_processing.extraction import DOCUMENT_COLUMNS, PAGE_COLUMNS
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Create page-aware retrieval chunks.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    extracted_dir = resolve_path(config, "extracted_dir")
    pages = read_csv(extracted_dir / "pages.csv", PAGE_COLUMNS)
    documents = read_csv(extracted_dir / "documents.csv", DOCUMENT_COLUMNS)
    if pages.empty:
        raise SystemExit("No pages found. Run scripts/02_extract_pdf_pages.py first.")

    chunks = chunk_pages(pages, documents, config)
    write_csv(chunks, extracted_dir / "chunks.csv")
    logger.info("Wrote %s chunks to %s", len(chunks), extracted_dir / "chunks.csv")


if __name__ == "__main__":
    main()
