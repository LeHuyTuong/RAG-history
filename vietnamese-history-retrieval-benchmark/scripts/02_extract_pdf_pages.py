from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pdf_processing.extraction import extract_all_pdfs
from src.utils.io import load_config, resolve_path
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract selectable PDF text page by page with PyMuPDF.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    extract_all_pdfs(
        raw_pdf_dir=resolve_path(config, "raw_pdf_dir"),
        extracted_dir=resolve_path(config, "extracted_dir"),
        logger=logger,
    )


if __name__ == "__main__":
    main()
