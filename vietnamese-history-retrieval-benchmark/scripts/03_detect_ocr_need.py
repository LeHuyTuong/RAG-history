from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.extraction import DOCUMENT_COLUMNS, PAGE_COLUMNS
from src.pdf_processing.ocr import OCR_REPORT_COLUMNS, create_ocr_report, update_documents_ocr_required
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect which extracted pages need OCR or manual review.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    extracted_dir = resolve_path(config, "extracted_dir")
    pages = read_csv(extracted_dir / "pages.csv", PAGE_COLUMNS)
    documents = read_csv(extracted_dir / "documents.csv", DOCUMENT_COLUMNS)

    if pages.empty:
        logger.warning("No pages found. Run scripts/02_extract_pdf_pages.py first.")
        write_csv(pd.DataFrame(columns=OCR_REPORT_COLUMNS), extracted_dir / "ocr_report.csv")
        return

    updated_pages, ocr_report = create_ocr_report(pages, config)
    updated_documents = update_documents_ocr_required(documents, ocr_report)
    write_csv(updated_pages, extracted_dir / "pages.csv")
    write_csv(updated_documents, extracted_dir / "documents.csv")
    write_csv(ocr_report, extracted_dir / "ocr_report.csv")
    logger.info("OCR detection complete: %s pages need OCR/manual review.", (ocr_report["ocr_needed"] == "true").sum())


if __name__ == "__main__":
    main()
