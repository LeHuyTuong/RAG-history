#!/usr/bin/env python3
"""
OCR các tập PDF bị scan (D003, D007) bằng PaddleOCR (local, free),
rồi append kết quả vào chunks.csv.

Cách chạy:
  # Test 5 trang:
  python rag-service/scripts/ocr_scanned_pdfs.py --doc-ids D003 --limit-pages 5

  # Chạy full:
  python rag-service/scripts/ocr_scanned_pdfs.py --doc-ids D003
  python rag-service/scripts/ocr_scanned_pdfs.py --doc-ids D007
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPTS_DIR.parent.parent
CHUNKS_CSV = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/chunks.csv"
DOCUMENTS_CSV = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/documents.csv"
PDF_DIR = Path("/Volumes/SSD/RAG-history-pdfs")
POPPLER_PATH = "/opt/homebrew/bin"

csv.field_size_limit(50 * 1024 * 1024)

TARGET_CHUNK_CHARS = 1500


def read_documents() -> dict[str, dict]:
    docs: dict[str, dict] = {}
    if not DOCUMENTS_CSV.is_file():
        return docs
    with DOCUMENTS_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            docs[row["doc_id"].strip().upper()] = {
                "title": row.get("title") or row["doc_id"],
                "filename": row.get("filename", ""),
                "total_pages": int(row.get("total_pages") or 0),
            }
    return docs


def find_pdf(doc_id: str, meta: dict) -> Path | None:
    filename = meta.get("filename", "")
    if filename:
        candidate = PDF_DIR / filename
        if candidate.is_file():
            return candidate
    num = int(doc_id.lstrip("D"))
    for p in PDF_DIR.glob("*.pdf"):
        if f"tập {num:02d}" in p.name:
            return p
    return None


def existing_chunk_count(doc_id: str) -> int:
    count = 0
    with CHUNKS_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["doc_id"].strip().upper() == doc_id:
                count += 1
    return count


def detect_years(text: str) -> str:
    years = sorted(set(re.findall(r"\b(1[0-9]{3}|20[0-2][0-9])\b", text)))
    return "|".join(years[:10])


def ocr_page_paddle(ocr, img) -> str:
    """OCR 1 trang ảnh PIL bằng PaddleOCR, trả về text."""
    import numpy as np
    result = ocr.predict(np.array(img))
    if not result:
        return ""
    r = result[0]
    texts = [t for t, s in zip(r.get("rec_texts", []), r.get("rec_scores", []))
             if s > 0.5 and t.strip()]
    return "\n".join(texts)


def process_doc(doc_id: str, meta: dict, ocr, dpi: int,
                limit_pages: int | None, dry_run: bool) -> int:
    from pdf2image import convert_from_path

    pdf_path = find_pdf(doc_id, meta)
    if pdf_path is None:
        print(f"  ✗ Không tìm thấy PDF cho {doc_id}", file=sys.stderr)
        return 0

    print(f"\n>> {doc_id} | {meta['title']}")
    print(f"   PDF: {pdf_path.name}")

    existing = existing_chunk_count(doc_id)
    if existing > 0:
        print(f"   Đã có {existing} chunk — bỏ qua (dùng --overwrite để ghi lại)")
        return 0

    total_pages = meta.get("total_pages", 0)
    pages_to_do = min(total_pages, limit_pages) if limit_pages else total_pages
    print(f"   Tổng trang: {total_pages} | Sẽ OCR: {pages_to_do}")

    if dry_run:
        speed = 3  # ~3s/trang trên CPU
        print(f"   [DRY RUN] ~{pages_to_do * speed // 60} phút trên CPU")
        return 0

    source_file = pdf_path.stem[:80]
    created_at = datetime.now(timezone.utc).isoformat()
    chunks_written = 0
    chunk_index = 0
    buf_pages: list[int] = []
    buf_texts: list[str] = []

    def flush_chunk() -> None:
        nonlocal chunk_index, chunks_written
        if not buf_texts:
            return
        full_text = "\n\n".join(buf_texts)
        chunk_index += 1
        row = {
            "chunk_id": f"{doc_id}_C{chunk_index:04d}",
            "doc_id": doc_id,
            "page_id": f"{doc_id}_P{buf_pages[0]:04d}",
            "page_start": str(buf_pages[0]),
            "page_end": str(buf_pages[-1]),
            "chunk_index": str(chunk_index),
            "text": full_text,
            "token_count": str(len(full_text) // 4),
            "char_count": str(len(full_text)),
            "section_hint": full_text.split("\n")[0][:80],
            "years_detected": detect_years(full_text),
            "entities_detected": "",
            "extraction_method": "paddleocr",
            "source_file": source_file,
        }
        with CHUNKS_CSV.open("a", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(row.keys()))
            writer.writerow(row)
        chunks_written += 1
        buf_pages.clear()
        buf_texts.clear()

    BATCH = 10  # nhỏ hơn để tiết kiệm RAM
    page_num = 0
    t_start = time.time()

    for batch_start in range(1, pages_to_do + 1, BATCH):
        batch_end = min(batch_start + BATCH - 1, pages_to_do)
        images = convert_from_path(
            str(pdf_path), dpi=dpi,
            first_page=batch_start, last_page=batch_end,
            fmt="jpeg", thread_count=2, poppler_path=POPPLER_PATH,
        )
        for img in images:
            page_num += 1
            t0 = time.time()
            text = ocr_page_paddle(ocr, img)
            elapsed_page = time.time() - t0
            page_text = f"[Page {page_num}]\n{text}" if text else f"[Page {page_num}]"
            buf_pages.append(page_num)
            buf_texts.append(page_text)

            if sum(len(t) for t in buf_texts) >= TARGET_CHUNK_CHARS:
                flush_chunk()

            elapsed_total = time.time() - t_start
            remaining = pages_to_do - page_num
            eta = (elapsed_total / page_num * remaining) if page_num else 0
            print(
                f"   trang {page_num}/{pages_to_do} | "
                f"{elapsed_page:.1f}s/trang | "
                f"chunk: {chunks_written} | "
                f"ETA: {eta/60:.1f} phút   ",
                end="\r", flush=True,
            )

    flush_chunk()
    print(f"\n   ✓ {doc_id}: {chunks_written} chunk từ {page_num} trang")
    return chunks_written


def remove_chunks(doc_id: str) -> None:
    tmp = CHUNKS_CSV.with_suffix(".tmp")
    with CHUNKS_CSV.open(encoding="utf-8") as fin, \
         tmp.open("w", encoding="utf-8", newline="") as fout:
        reader = csv.DictReader(fin)
        writer = csv.DictWriter(fout, fieldnames=reader.fieldnames)
        writer.writeheader()
        for row in reader:
            if row["doc_id"].strip().upper() != doc_id:
                writer.writerow(row)
    tmp.replace(CHUNKS_CSV)


def main() -> int:
    parser = argparse.ArgumentParser(description="OCR PDF scan bằng PaddleOCR")
    parser.add_argument("--doc-ids", default="D003,D007",
                        help="Doc IDs cần OCR (mặc định: D003,D007)")
    parser.add_argument("--dpi", type=int, default=120,
                        help="DPI render PDF (mặc định 120 — đủ cho OCR, nhẹ hơn 150)")
    parser.add_argument("--limit-pages", type=int, default=None,
                        help="Giới hạn số trang mỗi tập (để test)")
    parser.add_argument("--overwrite", action="store_true",
                        help="Xóa chunk cũ và OCR lại")
    parser.add_argument("--dry-run", action="store_true",
                        help="Ước tính thời gian, không chạy OCR")
    args = parser.parse_args()

    docs = read_documents()
    doc_ids = [d.strip().upper() for d in args.doc_ids.split(",") if d.strip()]

    print(f"Backend : PaddleOCR (local)")
    print(f"Doc IDs : {', '.join(doc_ids)}")
    print(f"DPI     : {args.dpi}")
    print(f"PDF dir : {PDF_DIR}")

    if args.overwrite and not args.dry_run:
        for did in doc_ids:
            n = existing_chunk_count(did)
            if n:
                print(f"  --overwrite: xóa {n} chunk cũ của {did}")
                remove_chunks(did)

    if not args.dry_run:
        import warnings; warnings.filterwarnings("ignore")
        os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
        print("\nKhởi động PaddleOCR (lần đầu tải model ~10s)...")
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(
            lang="vi",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
        print("PaddleOCR sẵn sàng.\n")
    else:
        ocr = None

    total = 0
    for did in doc_ids:
        meta = docs.get(did)
        if not meta:
            print(f"  ✗ {did} không có trong documents.csv", file=sys.stderr)
            continue
        total += process_doc(did, meta, ocr, args.dpi, args.limit_pages, args.dry_run)

    if not args.dry_run:
        print(f"\n== XONG: {total} chunk mới ==")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
