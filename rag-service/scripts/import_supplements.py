#!/usr/bin/env python3
"""
Import tài liệu bổ sung vào chunks.csv + documents.csv.

Tài liệu:
  D016 — Đại Việt Sử Ký Toàn Thư (Ngô Sĩ Liên) - PDF text
  D017 — Việt Nam Sử Lược (Trần Trọng Kim) - TXT

Cách chạy:
  python rag-service/scripts/import_supplements.py --dry-run
  python rag-service/scripts/import_supplements.py
"""
from __future__ import annotations
import argparse, csv, re, sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPTS_DIR.parent.parent
CHUNKS_CSV  = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/chunks.csv"
DOCS_CSV    = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/documents.csv"
SUPP_DIR    = Path("/Volumes/SSD/RAG-history-pdfs/supplements")

csv.field_size_limit(50 * 1024 * 1024)
TARGET_CHUNK_CHARS = 1400

SUPPLEMENTS = [
    {
        "doc_id":    "D016",
        "title":     "Đại Việt Sử Ký Toàn Thư - Ngô Sĩ Liên",
        "filename":  "Dai-Viet-Su-Ky-Toan-Thu.pdf",
        "type":      "pdf",
        "period":    "bổ sung D003 (thế kỷ XV-XVI)",
    },
    {
        "doc_id":    "D017",
        "title":     "Việt Nam Sử Lược - Trần Trọng Kim",
        "filename":  "Viet-Nam-Su-Luoc-full.txt",
        "type":      "txt",
        "period":    "bổ sung D007 (1897-1918)",
    },
]


def existing_doc_ids() -> set[str]:
    ids = set()
    with DOCS_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ids.add(row["doc_id"].strip().upper())
    return ids


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


def chunk_text(text: str, doc_id: str, source_file: str) -> list[dict]:
    """Chia text thành chunks ~TARGET_CHUNK_CHARS ký tự."""
    # Tách theo đoạn văn
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks = []
    buf: list[str] = []
    buf_chars = 0
    chunk_idx = 0

    def flush(buf: list[str]) -> None:
        nonlocal chunk_idx
        if not buf:
            return
        full = "\n\n".join(buf)
        chunk_idx += 1
        chunks.append({
            "chunk_id":           f"{doc_id}_C{chunk_idx:04d}",
            "doc_id":             doc_id,
            "page_id":            f"{doc_id}_P{chunk_idx:04d}",
            "page_start":         str(chunk_idx),
            "page_end":           str(chunk_idx),
            "chunk_index":        str(chunk_idx),
            "text":               full,
            "token_count":        str(len(full) // 4),
            "char_count":         str(len(full)),
            "section_hint":       full.split("\n")[0][:80],
            "years_detected":     detect_years(full),
            "entities_detected":  "",
            "extraction_method":  "text_import",
            "source_file":        source_file[:80],
        })
        buf.clear()

    for para in paragraphs:
        buf.append(para)
        buf_chars += len(para)
        if buf_chars >= TARGET_CHUNK_CHARS:
            flush(buf)
            buf_chars = 0

    flush(buf)
    return chunks


def extract_pdf_text(path: Path) -> str:
    """Extract text từ PDF dùng PyMuPDF."""
    sys.path.insert(0, "/Users/lehuytuong/Library/Python/3.9/lib/python/site-packages")
    import fitz
    doc = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc, 1):
        text = page.get_text().strip()
        if text and len(text) > 30:
            pages.append(f"[Trang {i}]\n{text}")
    return "\n\n".join(pages)


def add_to_docs_csv(doc_id: str, meta: dict, total_pages: int) -> None:
    with DOCS_CSV.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            doc_id,
            meta["title"],
            meta["filename"],
            f"supplements/{meta['filename']}",
            str(total_pages),
            "ok",
            "false",
            meta["period"],
        ])


def process(meta: dict, dry_run: bool) -> int:
    doc_id    = meta["doc_id"]
    file_path = SUPP_DIR / meta["filename"]

    print(f"\n>> {doc_id} | {meta['title']}")
    print(f"   File: {file_path.name}")

    if not file_path.exists():
        print(f"   ✗ File không tồn tại: {file_path}", file=sys.stderr)
        return 0

    existing = existing_chunk_count(doc_id)
    if existing > 0:
        print(f"   Đã có {existing} chunk — bỏ qua (dùng --overwrite)")
        return 0

    # Extract text
    print("   Đọc text...", end="", flush=True)
    if meta["type"] == "pdf":
        text = extract_pdf_text(file_path)
    else:
        text = file_path.read_text(encoding="utf-8")
    print(f" {len(text):,} ký tự")

    # Chunk
    chunks = chunk_text(text, doc_id, file_path.stem)
    print(f"   → {len(chunks)} chunks")

    if dry_run:
        print("   [DRY RUN] không ghi file")
        return len(chunks)

    # Ghi vào documents.csv nếu chưa có
    existing_ids = existing_doc_ids()
    if doc_id not in existing_ids:
        add_to_docs_csv(doc_id, meta, len(chunks))
        print(f"   Đã thêm {doc_id} vào documents.csv")

    # Ghi chunks vào chunks.csv
    fieldnames = list(chunks[0].keys())
    with CHUNKS_CSV.open("a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        for chunk in chunks:
            writer.writerow(chunk)
    print(f"   ✓ {len(chunks)} chunk → chunks.csv")
    return len(chunks)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    print("== Import tài liệu bổ sung ==")

    if args.overwrite and not args.dry_run:
        for meta in SUPPLEMENTS:
            did = meta["doc_id"]
            n = existing_chunk_count(did)
            if n:
                print(f"--overwrite: xóa {n} chunk của {did}")
                tmp = CHUNKS_CSV.with_suffix(".tmp")
                with CHUNKS_CSV.open(encoding="utf-8") as fin, \
                     tmp.open("w", encoding="utf-8", newline="") as fout:
                    reader = csv.DictReader(fin)
                    writer = csv.DictWriter(fout, fieldnames=reader.fieldnames)
                    writer.writeheader()
                    for row in reader:
                        if row["doc_id"].strip().upper() != did:
                            writer.writerow(row)
                tmp.replace(CHUNKS_CSV)

    total = 0
    for meta in SUPPLEMENTS:
        total += process(meta, args.dry_run)

    print(f"\n== XONG: {total} chunk mới ==")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
