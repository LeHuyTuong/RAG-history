from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.extraction import inventory_pdfs
from src.utils.io import load_config, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Inventory PDFs and assign stable D001... IDs.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    raw_pdf_dir = resolve_path(config, "raw_pdf_dir")
    extracted_dir = resolve_path(config, "extracted_dir")
    extracted_dir.mkdir(parents=True, exist_ok=True)

    documents = inventory_pdfs(raw_pdf_dir)
    if len(documents) != 15:
        logger.warning("Expected 15 PDFs, found %s in %s", len(documents), raw_pdf_dir)
    write_csv(documents, extracted_dir / "documents.csv")
    logger.info("Wrote %s document rows to %s", len(documents), extracted_dir / "documents.csv")


if __name__ == "__main__":
    main()
