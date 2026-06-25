#!/usr/bin/env python3
"""
OCR PDF nguồn rồi nạp thẳng vào Qdrant — dùng cho D003/D007 mà chunks.csv không có data.

Pipeline:
  pdf2image → trang ảnh → tesseract (vie) → text → chunk (800 chars, 120 overlap)
  → Gemini embedding → Qdrant upsert

Cách dùng (chạy từ rag-service/):
  .venv/bin/python scripts/ocr_and_load.py --pdf /path/to/file.pdf --doc-id D003
  .venv/bin/python scripts/ocr_and_load.py --pdf /path/to/file.pdf --doc-id D003 --resume
  .venv/bin/python scripts/ocr_and_load.py --pdf /path/to/file.pdf --doc-id D003 --dry-run

Yêu cầu hệ thống: tesseract + vie language pack (brew install tesseract tesseract-lang)
Yêu cầu Python: pdf2image, pillow (đã cài trong venv)
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent
DEFAULT_DOCS = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/documents.csv"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
OCR_DPI = 200
MIN_PAGE_CHARS = 80

# -- reuse helpers từ load_dataset.py --

def load_dotenv_into_environ(env_file: Path) -> bool:
    if not env_file.is_file():
        return False
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)
    return True


def resolve_env_file(explicit: str | None) -> Path | None:
    candidates = [Path(explicit)] if explicit else [
        Path.cwd() / ".env",
        REPO_ROOT / ".env",
        RAG_SERVICE_DIR / ".env",
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


def read_document_meta(doc_id: str) -> dict:
    """Đọc title + file_path từ documents.csv."""
    import csv
    target = doc_id.strip().upper()
    if DEFAULT_DOCS.is_file():
        with DEFAULT_DOCS.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("doc_id", "").strip().upper() == target:
                    return {
                        "title": row.get("title") or row.get("filename") or target,
                        "file_path": row.get("file_path"),
                    }
    return {"title": target, "file_path": None}


def doc_num(doc_id: str) -> int:
    return int(doc_id.strip().upper().lstrip("D"))


# -- OCR --

def ocr_page_tesseract(image) -> str:
    """OCR 1 ảnh PIL bằng tesseract CLI, trả text."""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp_path = f.name
    try:
        image.save(tmp_path)
        result = subprocess.run(
            ["tesseract", tmp_path, "stdout", "-l", "vie", "--psm", "3"],
            capture_output=True, text=True, timeout=60,
        )
        return result.stdout.strip()
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def count_pdf_pages(pdf_path: Path) -> int:
    """Đếm số trang PDF không cần load ảnh."""
    result = subprocess.run(
        ["pdfinfo", str(pdf_path)], capture_output=True, text=True
    )
    for line in result.stdout.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":")[1].strip())
    return 0


def ocr_cache_path(pdf_path: Path, dpi: int) -> Path:
    """Cache file: cạnh PDF, đặt tên theo pdf + dpi."""
    return pdf_path.parent / f".ocr_cache_{pdf_path.stem}_dpi{dpi}.json"


def load_ocr_cache(cache_path: Path) -> dict[int, str]:
    """Load cache {page_number: text}. Trả {} nếu chưa có."""
    import json
    if cache_path.is_file():
        try:
            return {int(k): v for k, v in json.loads(cache_path.read_text(encoding="utf-8")).items()}
        except Exception:
            return {}
    return {}


def save_ocr_cache(cache_path: Path, cache: dict[int, str]) -> None:
    import json
    cache_path.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")


def iter_pages_ocr(pdf_path: Path, dpi: int = OCR_DPI):
    """Yield (page_number_1based, text) cho từng trang PDF — convert 1 trang/lần để tránh OOM.
    Cache kết quả OCR ra file JSON để resume không cần OCR lại."""
    from pdf2image import convert_from_path
    total = count_pdf_pages(pdf_path)
    cache_path = ocr_cache_path(pdf_path, dpi)
    cache = load_ocr_cache(cache_path)

    cached_count = sum(1 for t in cache.values() if len(t) >= MIN_PAGE_CHARS)
    if cache:
        print(f"  {total} trang — cache có sẵn {len(cache)} trang ({cached_count} trang có text). OCR trang còn thiếu...")
    else:
        print(f"  {total} trang, OCR từng trang (DPI={dpi})...")

    good = cached_count
    for i in range(1, total + 1):
        if i in cache:
            if len(cache[i]) >= MIN_PAGE_CHARS:
                yield i, cache[i]
            continue
        images = convert_from_path(str(pdf_path), dpi=dpi, first_page=i, last_page=i)
        if not images:
            cache[i] = ""
            continue
        text = ocr_page_tesseract(images[0])
        cache[i] = text
        if len(text) >= MIN_PAGE_CHARS:
            yield i, text
            good += 1
        # Save cache sau mỗi 10 trang để không mất data nếu bị ngắt
        if i % 10 == 0:
            save_ocr_cache(cache_path, cache)
        print(f"    OCR {i}/{total} trang | {good} trang có text | trang này: {len(text)} ký tự",
              end="\r", flush=True)

    save_ocr_cache(cache_path, cache)
    print()


# -- Chunking --

def chunk_pages(pages: list[tuple[int, str]], chunk_size: int = CHUNK_SIZE,
                overlap: int = CHUNK_OVERLAP) -> list[tuple[int, str]]:
    """
    Ghép tất cả trang thành 1 luồng text (có marker [Page N]).
    Slide cửa sổ chunk_size ký tự, overlap ký tự.
    Trả [(page_number, chunk_text)].
    """
    # Xây dựng danh sách (char_offset, page_number, text) để map offset → page
    segments: list[tuple[int, int, str]] = []
    offset = 0
    for page_num, text in pages:
        tagged = f"[Page {page_num}]\n{text}\n"
        segments.append((offset, page_num, tagged))
        offset += len(tagged)

    full_text = "".join(seg[2] for seg in segments)

    # Map offset → page_number
    page_breakpoints = [(seg[0], seg[1]) for seg in segments]

    def page_at(pos: int) -> int:
        pn = 1
        for bp_offset, bp_page in page_breakpoints:
            if pos >= bp_offset:
                pn = bp_page
            else:
                break
        return pn

    chunks: list[tuple[int, str]] = []
    start = 0
    while start < len(full_text):
        end = min(start + chunk_size, len(full_text))
        chunk_text = full_text[start:end].strip()
        if len(chunk_text) >= 20:
            chunks.append((page_at(start), chunk_text))
        start += chunk_size - overlap

    return chunks


# -- Embed + Qdrant (copy từ load_dataset.py) --

def _parse_retry_delay(exc: Exception) -> float | None:
    import re
    match = re.search(r'retry in (\d+(?:\.\d+)?)s', str(exc))
    return float(match.group(1)) + 3 if match else None


def _is_hard_daily_quota(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and (
        "PerDay" in msg or "per-day" in msg or "requests-per-day" in msg
        or "free_tier_requests" in msg
    )


def _make_embed_fn(api_key: str):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)

    def embed_documents(texts: list[str]) -> list[list[float]]:
        from app.config import settings
        results: list[list[float]] = []
        for i in range(0, len(texts), 100):
            batch = texts[i: i + 100]
            response = client.models.embed_content(
                model=settings.embedding_model,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=settings.embedding_dim,
                ),
            )
            results.extend(e.values for e in response.embeddings)
        return results

    return embed_documents


def make_embed_with_retry(embed_fn_list: list, retries: int = 10, backoff: float = 60.0):
    state = {"key_index": 0}

    def embed_with_retry(texts: list[str]) -> list[list[float]]:
        for attempt in range(1, retries + 1):
            embed_documents = embed_fn_list[state["key_index"]]
            try:
                return embed_documents(texts)
            except Exception as exc:  # noqa: BLE001
                if _is_hard_daily_quota(exc):
                    state["key_index"] += 1
                    if state["key_index"] < len(embed_fn_list):
                        print(
                            f"\n  ! Key {state['key_index']} hết RPD → chuyển sang key {state['key_index'] + 1}",
                            file=sys.stderr,
                        )
                        continue
                    print(
                        "\n  ✗ TẤT CẢ KEY HẾT QUOTA NGÀY (RPD).\n"
                        "    Chờ 07:00 sáng VN (00:00 UTC) rồi chạy lại với --resume.",
                        file=sys.stderr,
                    )
                    raise
                if attempt == retries:
                    raise
                wait = _parse_retry_delay(exc) or backoff
                print(f"    ! embed 429 (lần {attempt}/{retries}): chờ {wait:.0f}s", file=sys.stderr)
                time.sleep(wait)

    return embed_with_retry


def build_payload(source_id: int, title: str, file_path: str | None,
                  chunk_index: int, page_number: int | None, text: str, created_at: str) -> dict:
    return {
        "sourceId": source_id,
        "sourceType": "DOCUMENT",
        "articleId": None,
        "documentId": source_id,
        "sourceUrl": None,
        "filePath": file_path,
        "chunkIndex": chunk_index,
        "pageNumber": page_number,
        "chunkText": text,
        "title": title,
        "categoryId": None,
        "categoryName": None,
        "slug": None,
        "tagIds": [],
        "eventIds": [],
        "periodIds": [],
        "createdAt": created_at,
    }


# -- Main --

def main() -> int:
    parser = argparse.ArgumentParser(
        description="OCR PDF rồi embed + nạp vào Qdrant (dùng cho D003/D007 bị mất text)."
    )
    parser.add_argument("--pdf", required=True, help="đường dẫn file PDF cần OCR.")
    parser.add_argument("--doc-id", required=True, help="doc id: 'D003' hoặc 'D007'.")
    parser.add_argument("--embed-batch", type=int, default=3,
                        help="số chunk mỗi lần gọi embedding (mặc định 3).")
    parser.add_argument("--batch-sleep", type=float, default=5.0,
                        help="giây chờ giữa 2 lần gọi embedding (mặc định 5s).")
    parser.add_argument("--dpi", type=int, default=OCR_DPI,
                        help=f"DPI khi chuyển PDF thành ảnh (mặc định {OCR_DPI}).")
    parser.add_argument("--collection", default=None, help="ghi đè tên collection.")
    parser.add_argument("--env-file", default=None, help="chỉ định file .env.")
    parser.add_argument("--resume", action="store_true",
                        help="Bỏ qua chunk đã có trong Qdrant.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Chỉ OCR + đếm chunk, không embed/nạp.")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.is_file():
        print(f"ERROR: không tìm thấy PDF: {pdf_path}", file=sys.stderr)
        return 1

    doc_id = args.doc_id.strip().upper()
    sid = doc_num(doc_id)
    meta = read_document_meta(doc_id)
    title = meta["title"]
    file_path = meta["file_path"] or str(pdf_path)

    print(f"== OCR & Load ==")
    print(f"PDF        : {pdf_path}")
    print(f"Doc        : {doc_id} | {title}")
    print(f"DPI        : {args.dpi}")

    # Bước 1: OCR
    print(f"\n[1/3] OCR...")
    pages = list(iter_pages_ocr(pdf_path, dpi=args.dpi))
    print(f"  Kết quả: {len(pages)} trang có text (>= {MIN_PAGE_CHARS} ký tự)")

    if not pages:
        print("ERROR: không OCR được trang nào.", file=sys.stderr)
        return 1

    # Bước 2: Chunk
    print(f"\n[2/3] Chunking (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    chunks = chunk_pages(pages, CHUNK_SIZE, CHUNK_OVERLAP)
    print(f"  Tổng: {len(chunks)} chunks")

    if args.dry_run:
        print(f"\n-- DRY RUN: sẽ nạp {len(chunks)} chunks, không gọi embedding. --")
        for i, (page, text) in enumerate(chunks[:3]):
            print(f"  Chunk {i} (trang {page}): {repr(text[:100])}...")
        return 0

    # Bước 3: Embed + Qdrant
    print(f"\n[3/3] Embed + Qdrant...")
    env_file = resolve_env_file(args.env_file)
    if env_file and load_dotenv_into_environ(env_file):
        print(f"env        : {env_file}")

    sys.path.insert(0, str(RAG_SERVICE_DIR))
    try:
        from app.config import settings
        from app.vectorstore.qdrant_client import ensure_collection, get_client
        from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert
    except Exception as exc:
        print(f"ERROR khi import app/: {exc}", file=sys.stderr)
        return 1

    api_keys = [settings.google_api_key]
    for i in range(2, 10):
        k = os.environ.get(f"GOOGLE_API_KEY_{i}", "").strip()
        if k:
            api_keys.append(k)
        else:
            break
    print(f"API keys   : {len(api_keys)} key(s) sẵn sàng")

    embed_with_retry = make_embed_with_retry([_make_embed_fn(k) for k in api_keys])
    collection = args.collection or settings.qdrant_collection
    print(f"collection : {collection}")
    ensure_collection(collection)

    if not args.resume:
        delete_by_source_id(collection, sid)

    created_at = datetime.now(timezone.utc).isoformat()
    doc_count = 0
    skipped = 0
    t_start = time.time()

    batch_items: list[tuple[int, int, str]] = []  # (chunk_index, page_num, text)

    def flush():
        nonlocal doc_count, skipped
        if not batch_items:
            return
        if args.resume:
            all_ids = [point_id(sid, idx) for idx, _, _ in batch_items]
            existing = {str(p.id) for p in get_client().retrieve(
                collection_name=collection, ids=all_ids,
                with_payload=False, with_vectors=False,
            )}
            to_process = [(idx, pg, tx) for idx, pg, tx in batch_items
                          if point_id(sid, idx) not in existing]
            skipped += len(batch_items) - len(to_process)
        else:
            to_process = batch_items[:]

        batch_items.clear()
        if not to_process:
            return

        indices, pages_list, texts = zip(*to_process)
        vectors = embed_with_retry(list(texts))
        ids = [point_id(sid, idx) for idx in indices]
        payloads = [build_payload(sid, title, file_path, idx, pg, tx, created_at)
                    for idx, pg, tx in to_process]
        upsert(collection, ids, vectors, payloads)
        doc_count += len(to_process)
        label = f"   ... đã nạp {doc_count}/{len(chunks)} chunk"
        if skipped:
            label += f" (bỏ qua {skipped} đã có)"
        print(label, end="\r", flush=True)

    try:
        for chunk_index, (page_num, text) in enumerate(chunks):
            batch_items.append((chunk_index, page_num, text))
            if len(batch_items) >= args.embed_batch:
                flush()
                time.sleep(args.batch_sleep)
        flush()
    except Exception as exc:
        print(f"\n   ERROR: {exc}", file=sys.stderr)
        print("   Chạy lại với --resume để tiếp tục.", file=sys.stderr)
        return 1

    elapsed = time.time() - t_start
    summary = f"\n   ✓ {doc_id}: {doc_count} chunk -> Qdrant"
    if skipped:
        summary += f"  ({skipped} chunk đã có, bỏ qua)"
    print(summary)
    print(f"\n== XONG: {doc_count} chunk trong {elapsed:.0f}s ==")
    print(f"Thử ngay: POST http://localhost:8001/rag/chat  body {{\"question\": \"...\"}}")
    return 0


if __name__ == "__main__":
    sys.exit(main())