from __future__ import annotations

import io
import logging
import os
from pathlib import Path

import pandas as pd

from src.pdf_processing.extraction import DOCUMENT_COLUMNS, PAGE_COLUMNS
from src.utils.io import ensure_dir, truthy, write_csv
from src.utils.text import (
    broken_character_ratio,
    has_vietnamese_diacritics,
    normalize_vietnamese_text,
)

OCR_REPORT_COLUMNS = [
    "doc_id",
    "page_id",
    "page_number",
    "ocr_needed",
    "ocr_used",
    "ocr_engine",
    "confidence",
    "reason",
    "warning",
]


def detect_ocr_reason(row: pd.Series, config: dict) -> tuple[bool, str, str]:
    text = str(row.get("text", "") or "")
    text_length = int(row.get("text_length", len(text)) or 0)
    min_chars = int(config.get("ocr_min_text_chars", 80))
    broken_threshold = float(config.get("ocr_broken_char_threshold", 0.03))

    reasons: list[str] = []
    warnings: list[str] = []
    if text_length == 0:
        reasons.append("empty_text")
        reasons.append("likely_scanned")
    elif text_length < min_chars:
        reasons.append("short_text")

    broken_ratio = broken_character_ratio(text)
    if broken_ratio > broken_threshold:
        reasons.append(f"broken_text:{broken_ratio:.3f}")

    if text_length >= min_chars and not has_vietnamese_diacritics(text):
        reasons.append("missing_vietnamese_diacritics")
        warnings.append("manual_review_recommended")

    existing_flag = str(row.get("quality_flag", "")).lower()
    if "failed" in existing_flag:
        reasons.append("extraction_failed")

    return bool(reasons), "|".join(dict.fromkeys(reasons)), "|".join(dict.fromkeys(warnings))


def create_ocr_report(pages: pd.DataFrame, config: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    report_rows = []
    updated_pages = pages.copy()
    for index, row in updated_pages.iterrows():
        needed, reason, warning = detect_ocr_reason(row, config)
        quality_flag = "ocr_needed" if needed else "clean_text"
        if "manual_review_recommended" in warning and not needed:
            quality_flag = "manual_review"
        updated_pages.at[index, "quality_flag"] = quality_flag
        updated_pages.at[index, "has_vietnamese_diacritics"] = str(
            has_vietnamese_diacritics(row.get("text", ""))
        ).lower()
        report_rows.append(
            {
                "doc_id": row.get("doc_id", ""),
                "page_id": row.get("page_id", ""),
                "page_number": row.get("page_number", ""),
                "ocr_needed": str(needed).lower(),
                "ocr_used": "false",
                "ocr_engine": "",
                "confidence": "",
                "reason": reason,
                "warning": warning,
            }
        )
    return updated_pages[PAGE_COLUMNS], pd.DataFrame(report_rows, columns=OCR_REPORT_COLUMNS)


def _load_fitz():
    try:
        import fitz

        return fitz
    except Exception as exc:
        raise RuntimeError("PyMuPDF is required for OCR page rendering.") from exc


def _render_page_to_image(pdf_path: Path, page_number: int, dpi: int):
    fitz = _load_fitz()
    from PIL import Image

    document = fitz.open(pdf_path)
    try:
        page = document.load_page(page_number - 1)
        pix = page.get_pixmap(dpi=dpi, alpha=False)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        return image
    finally:
        document.close()


def _ocr_with_tesseract(image, language: str) -> tuple[str, float, str]:
    try:
        import pytesseract
    except Exception as exc:
        return "", 0.0, f"pytesseract_not_available:{exc}"

    tesseract_cmd = os.environ.get("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        data = pytesseract.image_to_data(
            image,
            lang=language,
            output_type=pytesseract.Output.DICT,
        )
        words = [word for word in data.get("text", []) if str(word).strip()]
        confidences = []
        for conf in data.get("conf", []):
            try:
                value = float(conf)
            except Exception:
                continue
            if value >= 0:
                confidences.append(value)
        text = normalize_vietnamese_text(" ".join(words))
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return text, confidence, ""
    except Exception as exc:
        return "", 0.0, f"tesseract_failed:{exc}"


def _ocr_with_paddle(image) -> tuple[str, float, str]:
    try:
        from paddleocr import PaddleOCR
    except Exception as exc:
        return "", 0.0, f"paddleocr_not_available:{exc}"

    try:
        use_gpu = os.environ.get("PADDLEOCR_USE_GPU", "0") == "1"
        ocr = PaddleOCR(use_angle_cls=True, lang="vi", use_gpu=use_gpu, show_log=False)
        result = ocr.ocr(image, cls=True)
        texts: list[str] = []
        confidences: list[float] = []
        for page_result in result or []:
            for line in page_result or []:
                if len(line) >= 2 and isinstance(line[1], (list, tuple)):
                    texts.append(str(line[1][0]))
                    confidences.append(float(line[1][1]) * 100.0)
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return normalize_vietnamese_text(" ".join(texts)), confidence, ""
    except Exception as exc:
        return "", 0.0, f"paddleocr_failed:{exc}"


def apply_ocr(
    pages: pd.DataFrame,
    documents: pd.DataFrame,
    ocr_report: pd.DataFrame,
    config: dict,
    logger: logging.Logger,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    if not truthy(config.get("use_ocr", True)):
        logger.info("OCR disabled by config; leaving pages unchanged.")
        ocr_report = ocr_report.copy()
        ocr_report["warning"] = ocr_report["warning"].astype(str).map(
            lambda w: "|".join(filter(None, [w, "ocr_disabled_by_config"]))
        )
        return pages[PAGE_COLUMNS], ocr_report[OCR_REPORT_COLUMNS]

    raw_pdf_dir = Path(config.get("_project_root", ".")) / str(config.get("raw_pdf_dir", "data/raw_pdfs"))
    if Path(str(config.get("raw_pdf_dir", ""))).is_absolute():
        raw_pdf_dir = Path(str(config.get("raw_pdf_dir")))
    audit_dir = ensure_dir(Path(config.get("_project_root", ".")) / "data" / "extracted" / "page_text_audit")
    engine = str(config.get("ocr_engine", "tesseract")).lower()
    language = str(config.get("ocr_language", "vie"))
    dpi = int(config.get("ocr_dpi", 200))
    low_confidence = float(config.get("ocr_low_confidence_threshold", 60))

    pages = pages.copy()
    ocr_report = ocr_report.copy()
    doc_by_id = {row["doc_id"]: row for row in documents.to_dict("records")}

    for report_index, report_row in ocr_report.iterrows():
        if not truthy(report_row.get("ocr_needed", False)):
            continue
        doc_id = str(report_row["doc_id"])
        page_id = str(report_row["page_id"])
        page_number = int(report_row["page_number"])
        doc = doc_by_id.get(doc_id)
        if not doc:
            ocr_report.at[report_index, "warning"] = "missing_document_row"
            continue
        pdf_path = Path(str(doc.get("file_path") or raw_pdf_dir / str(doc.get("filename"))))
        if not pdf_path.is_absolute():
            pdf_path = Path(config.get("_project_root", ".")) / pdf_path
        if not pdf_path.exists():
            ocr_report.at[report_index, "warning"] = "pdf_file_missing"
            continue

        logger.info("Running %s OCR for %s page %s", engine, doc_id, page_number)
        try:
            image = _render_page_to_image(pdf_path, page_number, dpi=dpi)
        except Exception as exc:
            ocr_report.at[report_index, "warning"] = f"render_failed:{exc}"
            continue

        if engine == "paddleocr":
            text, confidence, warning = _ocr_with_paddle(image)
        else:
            text, confidence, warning = _ocr_with_tesseract(image, language=language)

        page_mask = pages["page_id"] == page_id
        existing_warning = str(report_row.get("warning", ""))
        warnings = [existing_warning] if existing_warning else []
        if warning:
            warnings.append(warning)
        if confidence and confidence < low_confidence:
            warnings.append("low_ocr_confidence")

        if text:
            pages.loc[page_mask, "text"] = text
            pages.loc[page_mask, "text_length"] = str(len(text))
            pages.loc[page_mask, "extraction_method"] = f"pymupdf+{engine}"
            pages.loc[page_mask, "ocr_used"] = "true"
            pages.loc[page_mask, "ocr_confidence"] = f"{confidence:.2f}"
            pages.loc[page_mask, "has_vietnamese_diacritics"] = str(has_vietnamese_diacritics(text)).lower()
            pages.loc[page_mask, "quality_flag"] = "low_ocr_confidence" if confidence < low_confidence else "ocr_text"
            (audit_dir / f"{page_id}_{engine}.txt").write_text(text, encoding="utf-8")
            ocr_report.at[report_index, "ocr_used"] = "true"
            ocr_report.at[report_index, "ocr_engine"] = engine
            ocr_report.at[report_index, "confidence"] = f"{confidence:.2f}"
        else:
            warnings.append("ocr_produced_no_text")

        ocr_report.at[report_index, "warning"] = "|".join(dict.fromkeys(warnings))

    return pages[PAGE_COLUMNS], ocr_report[OCR_REPORT_COLUMNS]


def update_documents_ocr_required(documents: pd.DataFrame, ocr_report: pd.DataFrame) -> pd.DataFrame:
    updated = documents.copy()
    needed_docs = set(ocr_report.loc[ocr_report["ocr_needed"].map(truthy), "doc_id"].astype(str))
    for index, row in updated.iterrows():
        updated.at[index, "ocr_required"] = str(str(row.get("doc_id", "")) in needed_docs).lower()
    return updated[DOCUMENT_COLUMNS]
