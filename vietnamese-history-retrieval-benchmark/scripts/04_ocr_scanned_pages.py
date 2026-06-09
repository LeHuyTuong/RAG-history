from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.extraction import DOCUMENT_COLUMNS, PAGE_COLUMNS
from src.pdf_processing.ocr import OCR_REPORT_COLUMNS, apply_ocr, create_ocr_report
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Run OCR only for pages marked as needing OCR.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    extracted_dir = resolve_path(config, "extracted_dir")
    pages = read_csv(extracted_dir / "pages.csv", PAGE_COLUMNS)
    documents = read_csv(extracted_dir / "documents.csv", DOCUMENT_COLUMNS)
    ocr_report = read_csv(extracted_dir / "ocr_report.csv", OCR_REPORT_COLUMNS)

    if pages.empty:
        raise SystemExit("No pages found. Run scripts/02_extract_pdf_pages.py first.")
    if ocr_report.empty:
        logger.info("No OCR report found; creating OCR decisions first.")
        pages, ocr_report = create_ocr_report(pages, config)

    updated_pages, updated_report = apply_ocr(pages, documents, ocr_report, config, logger)
    write_csv(updated_pages, extracted_dir / "pages.csv")
    write_csv(updated_report, extracted_dir / "ocr_report.csv")
    logger.info("OCR step complete. Used OCR on %s pages.", (updated_report["ocr_used"] == "true").sum())


if __name__ == "__main__":
    main()
