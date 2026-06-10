from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.utils.io import stringify_list
from src.utils.text import (
    detect_entity_candidates,
    detect_years,
    normalize_vietnamese_text,
    word_count,
)

CHUNK_COLUMNS = [
    "chunk_id",
    "doc_id",
    "page_id",
    "page_start",
    "page_end",
    "chunk_index",
    "text",
    "token_count",
    "char_count",
    "section_hint",
    "years_detected",
    "entities_detected",
    "extraction_method",
    "source_file",
]


def _words(text: str) -> list[str]:
    return normalize_vietnamese_text(text).split()


def _section_hint(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:5]:
        if len(line) <= 120 and (line.isupper() or line.endswith(":") or line[:1].isdigit()):
            return line[:120]
    return ""


def _make_chunk(
    doc_id: str,
    chunk_number: int,
    page_rows: list[dict],
    text: str,
) -> dict:
    first_page = page_rows[0]
    last_page = page_rows[-1]
    source_files = [str(row.get("source_file", "")) for row in page_rows]
    methods = [str(row.get("extraction_method", "")) for row in page_rows]
    chunk_id = f"{doc_id}_C{chunk_number:04d}"
    normalized = normalize_vietnamese_text(text)
    return {
        "chunk_id": chunk_id,
        "doc_id": doc_id,
        "page_id": first_page.get("page_id", ""),
        "page_start": first_page.get("page_number", ""),
        "page_end": last_page.get("page_number", ""),
        "chunk_index": chunk_number,
        "text": normalized,
        "token_count": word_count(normalized),
        "char_count": len(normalized),
        "section_hint": _section_hint(normalized),
        "years_detected": stringify_list(detect_years(normalized)),
        "entities_detected": stringify_list(detect_entity_candidates(normalized)),
        "extraction_method": stringify_list(methods),
        "source_file": stringify_list(source_files),
    }


def chunk_pages(pages: pd.DataFrame, documents: pd.DataFrame, config: dict) -> pd.DataFrame:
    chunk_size = int(config.get("chunk_size", 500))
    chunk_min_words = int(config.get("chunk_min_words", 300))
    overlap = max(0, int(config.get("chunk_overlap", 50)))
    merge_short_pages = str(config.get("merge_short_pages", True)).lower() in {"1", "true", "yes"}

    filename_by_doc = {
        str(row["doc_id"]): str(row.get("filename", ""))
        for row in documents.to_dict("records")
    }

    page_records = pages.copy()
    page_records["page_number_int"] = page_records["page_number"].astype(int)
    page_records = page_records.sort_values(["doc_id", "page_number_int"])

    chunk_rows: list[dict] = []
    for doc_id, group in page_records.groupby("doc_id", sort=True):
        chunk_number = 1
        pending_rows: list[dict] = []
        pending_texts: list[str] = []
        pending_count = 0

        def flush_pending() -> None:
            nonlocal chunk_number, pending_rows, pending_texts, pending_count
            if pending_rows and pending_texts:
                chunk_rows.append(_make_chunk(doc_id, chunk_number, pending_rows, "\n\n".join(pending_texts)))
                chunk_number += 1
            pending_rows = []
            pending_texts = []
            pending_count = 0

        for row in group.to_dict("records"):
            text = normalize_vietnamese_text(row.get("text", ""))
            if not text:
                continue
            row["source_file"] = filename_by_doc.get(doc_id, "")
            words = _words(text)
            count = len(words)

            if count > chunk_size:
                flush_pending()
                step = max(1, chunk_size - overlap)
                for start in range(0, count, step):
                    end = min(start + chunk_size, count)
                    piece = " ".join(words[start:end])
                    chunk_rows.append(_make_chunk(doc_id, chunk_number, [row], piece))
                    chunk_number += 1
                    if end >= count:
                        break
                continue

            if not merge_short_pages:
                chunk_rows.append(_make_chunk(doc_id, chunk_number, [row], text))
                chunk_number += 1
                continue

            if pending_rows and pending_count + count > chunk_size:
                flush_pending()

            pending_rows.append(row)
            pending_texts.append(f"[Page {row.get('page_number')}]\n{text}")
            pending_count += count

            if pending_count >= chunk_min_words:
                flush_pending()

        flush_pending()

    return pd.DataFrame(chunk_rows, columns=CHUNK_COLUMNS)
