from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from src.utils.io import ensure_dir, write_csv
from src.utils.text import has_vietnamese_diacritics, normalize_vietnamese_text

DOCUMENT_COLUMNS = [
    "doc_id",
    "title",
    "filename",
    "file_path",
    "total_pages",
    "extraction_status",
    "ocr_required",
    "notes",
]

PAGE_COLUMNS = [
    "doc_id",
    "page_id",
    "page_number",
    "text",
    "text_length",
    "extraction_method",
    "ocr_used",
    "ocr_confidence",
    "has_vietnamese_diacritics",
    "quality_flag",
]

EXTRACTION_REPORT_COLUMNS = [
    "doc_id",
    "filename",
    "status",
    "total_pages",
    "pages_extracted",
    "pages_empty",
    "warning",
    "error",
]


def list_pdf_files(raw_pdf_dir: str | Path) -> list[Path]:
    raw_pdf_dir = Path(raw_pdf_dir)
    return sorted(raw_pdf_dir.rglob("*.pdf"), key=lambda p: str(p.relative_to(raw_pdf_dir)).lower())


def inventory_pdfs(raw_pdf_dir: str | Path) -> pd.DataFrame:
    rows = []
    for index, pdf_path in enumerate(list_pdf_files(raw_pdf_dir), start=1):
        try:
            file_path = str(pdf_path.relative_to(Path.cwd()))
        except ValueError:
            file_path = str(pdf_path)
        rows.append(
            {
                "doc_id": f"D{index:03d}",
                "title": pdf_path.stem,
                "filename": pdf_path.name,
                "file_path": file_path,
                "total_pages": "",
                "extraction_status": "pending",
                "ocr_required": "",
                "notes": "",
            }
        )
    return pd.DataFrame(rows, columns=DOCUMENT_COLUMNS)


def _load_fitz():
    try:
        import fitz

        return fitz
    except Exception as exc:
        raise RuntimeError(
            "PyMuPDF is required for PDF extraction. Install with `pip install PyMuPDF`."
        ) from exc


def extract_pages_from_pdf(
    doc_id: str,
    pdf_path: str | Path,
    audit_dir: str | Path | None = None,
    logger: logging.Logger | None = None,
) -> tuple[list[dict], dict]:
    fitz = _load_fitz()
    pdf_path = Path(pdf_path)
    page_rows: list[dict] = []
    logger = logger or logging.getLogger(__name__)
    audit_path = ensure_dir(audit_dir) if audit_dir else None

    try:
        document = fitz.open(pdf_path)
    except Exception as exc:
        return [], {
            "doc_id": doc_id,
            "filename": pdf_path.name,
            "status": "failed",
            "total_pages": 0,
            "pages_extracted": 0,
            "pages_empty": 0,
            "warning": "",
            "error": str(exc),
        }

    pages_empty = 0
    try:
        total_pages = document.page_count
        for page_index in range(total_pages):
            page_number = page_index + 1
            page_id = f"{doc_id}_P{page_number:04d}"
            try:
                page = document.load_page(page_index)
                raw_text = page.get_text("text") or ""
                text = normalize_vietnamese_text(raw_text)
                if audit_path is not None:
                    (audit_path / f"{page_id}_pymupdf.txt").write_text(raw_text, encoding="utf-8")
                if not text:
                    pages_empty += 1
                page_rows.append(
                    {
                        "doc_id": doc_id,
                        "page_id": page_id,
                        "page_number": page_number,
                        "text": text,
                        "text_length": len(text),
                        "extraction_method": "pymupdf",
                        "ocr_used": "false",
                        "ocr_confidence": "",
                        "has_vietnamese_diacritics": str(has_vietnamese_diacritics(text)).lower(),
                        "quality_flag": "unreviewed",
                    }
                )
            except Exception as exc:
                logger.exception("Failed to extract %s page %s", pdf_path.name, page_number)
                pages_empty += 1
                page_rows.append(
                    {
                        "doc_id": doc_id,
                        "page_id": page_id,
                        "page_number": page_number,
                        "text": "",
                        "text_length": 0,
                        "extraction_method": "pymupdf_failed",
                        "ocr_used": "false",
                        "ocr_confidence": "",
                        "has_vietnamese_diacritics": "false",
                        "quality_flag": "extraction_failed",
                    }
                )
        status = "ok" if page_rows else "failed"
        warning = "some_pages_empty" if pages_empty else ""
        report = {
            "doc_id": doc_id,
            "filename": pdf_path.name,
            "status": status,
            "total_pages": total_pages,
            "pages_extracted": len(page_rows),
            "pages_empty": pages_empty,
            "warning": warning,
            "error": "",
        }
        return page_rows, report
    finally:
        document.close()


def extract_all_pdfs(raw_pdf_dir: str | Path, extracted_dir: str | Path, logger: logging.Logger) -> None:
    raw_pdf_dir = Path(raw_pdf_dir)
    extracted_dir = ensure_dir(extracted_dir)
    audit_dir = ensure_dir(extracted_dir / "page_text_audit")
    documents = inventory_pdfs(raw_pdf_dir)
    pages: list[dict] = []
    reports: list[dict] = []

    for doc in documents.to_dict("records"):
        doc_id = doc["doc_id"]
        pdf_path = Path(doc["file_path"])
        logger.info("Extracting %s as %s", pdf_path.name, doc_id)
        page_rows, report = extract_pages_from_pdf(doc_id, pdf_path, audit_dir=audit_dir, logger=logger)
        pages.extend(page_rows)
        reports.append(report)
        mask = documents["doc_id"] == doc_id
        documents.loc[mask, "total_pages"] = str(report["total_pages"])
        documents.loc[mask, "extraction_status"] = report["status"]
        documents.loc[mask, "notes"] = report["error"] or report["warning"]

    if len(documents) != 15:
        logger.warning("Expected 15 PDFs for the pilot, found %s in %s", len(documents), raw_pdf_dir)

    write_csv(documents[DOCUMENT_COLUMNS], extracted_dir / "documents.csv")
    write_csv(pd.DataFrame(pages, columns=PAGE_COLUMNS), extracted_dir / "pages.csv")
    write_csv(pd.DataFrame(reports, columns=EXTRACTION_REPORT_COLUMNS), extracted_dir / "extraction_report.csv")
