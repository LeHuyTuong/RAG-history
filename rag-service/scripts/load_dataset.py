#!/usr/bin/env python3
"""
Bulk loader: nạp dataset "Lịch sử Việt Nam (15 tập)" vào Qdrant của rag-service.

Tại sao KHÔNG đi qua HTTP /rag/ingest:
  - PDF nguồn là bản scan (ocr_required=true, pypdf extract ra text rời rạc/lỗi font).
    Text SẠCH đã nằm sẵn ở data/extracted/chunks.csv (pipeline benchmark đã OCR + chunk).
  - Đọc lại 200MB PDF rồi để rag-service tự extract sẽ cho chất lượng kém hơn.

Script này TÁI DÙNG đúng các module của rag-service (embedding_service, vector_repository,
qdrant_client) nên vector + payload + point-id sinh ra GIỐNG HỆT luồng /rag/ingest →
/rag/chat retrieve được ngay. Khác biệt có lợi: giữ nguyên page number (page_start)
và ranh giới chunk gốc thay vì để rag-service chunk lại.

Mapping nguồn:
  doc_id "D001" -> sourceId 1, sourceType="DOCUMENT", documentId=1, title từ documents.csv.
  Mỗi chunk -> 1 point trong Qdrant, payload bám sát ingest_service._build_payload.

Idempotent: trước khi nạp 1 tập, xóa toàn bộ vector cũ của sourceId đó (như re-ingest).

Cách chạy (cần .env có QDRANT_* + GOOGLE_API_KEY):
  # xem trước, KHÔNG gọi API:
  python rag-service/scripts/load_dataset.py --dry-run
  # nạp thử 1 tập, giới hạn 200 chunk cho rẻ:
  python rag-service/scripts/load_dataset.py --doc-ids D001 --limit-chunks 200
  # nạp toàn bộ:
  python rag-service/scripts/load_dataset.py
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# --- đường dẫn ---
SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent
DEFAULT_CHUNKS = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/chunks.csv"
DEFAULT_DOCS = REPO_ROOT / "vietnamese-history-retrieval-benchmark/data/extracted/documents.csv"

# chunk text có thể dài hơn giới hạn field mặc định của csv (131072) -> nới rộng
csv.field_size_limit(50 * 1024 * 1024)


def load_dotenv_into_environ(env_file: Path) -> bool:
    """Đọc 1 file .env (KEY=VALUE) vào os.environ. Không ghi đè biến đã set sẵn.
    Tự viết để không phụ thuộc python-dotenv. Trả True nếu đọc được file."""
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


def parse_doc_ids(spec: str | None, available: list[int]) -> list[int]:
    """Hỗ trợ 'D001', '1', '1-5', 'D001,D003'. None/empty -> tất cả."""
    if not spec:
        return available
    wanted: set[int] = set()
    for token in spec.split(","):
        token = token.strip().upper().lstrip("D")
        if not token:
            continue
        if "-" in token:
            lo, hi = token.split("-", 1)
            wanted.update(range(int(lo), int(hi) + 1))
        else:
            wanted.add(int(token))
    return [d for d in available if d in wanted]


def doc_num(doc_id: str) -> int:
    """'D001' -> 1."""
    return int(doc_id.strip().upper().lstrip("D"))


def to_int(value: str | None) -> int | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def read_documents(path: Path) -> dict[int, dict]:
    """doc num -> {title, file_path}."""
    docs: dict[int, dict] = {}
    if not path.is_file():
        return docs
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            docs[doc_num(row["doc_id"])] = {
                "title": row.get("title") or row.get("filename") or row["doc_id"],
                "file_path": row.get("file_path"),
            }
    return docs


def iter_doc_chunks(chunks_csv: Path, source_id: int, min_chars: int, limit: int | None):
    """Yield (page_number, text) cho 1 doc, theo đúng thứ tự trong CSV.
    Đọc streaming để không nạp 20MB vào RAM cùng lúc."""
    target = f"D{source_id:03d}"
    count = 0
    with chunks_csv.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["doc_id"].strip().upper() != target:
                continue
            text = (row.get("text") or "").strip()
            if len(text) < min_chars:
                continue
            yield to_int(row.get("page_start")), text
            count += 1
            if limit is not None and count >= limit:
                return


def build_payload(source_id: int, title: str, file_path: str | None,
                  chunk_index: int, page_number: int | None, text: str, created_at: str) -> dict:
    """Bám sát ingest_service._build_payload để /rag/chat retrieve + cite đồng nhất."""
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


def _parse_retry_delay(exc: Exception) -> float | None:
    """Đọc số giây từ 'Please retry in Xs' trong error message của Gemini 429."""
    import re
    match = re.search(r'retry in (\d+(?:\.\d+)?)s', str(exc))
    return float(match.group(1)) + 3 if match else None  # +3s buffer


def _is_daily_quota(exc: Exception) -> bool:
    """True nếu 429 do hết quota NGÀY (không có retryDelay) — không thể retry trong ngày."""
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and "retry in" not in msg


def embed_with_retry(embed_documents, texts: list[str], retries: int = 6, backoff: float = 30.0):
    for attempt in range(1, retries + 1):
        try:
            return embed_documents(texts)
        except Exception as exc:  # noqa: BLE001
            if _is_daily_quota(exc):
                print(
                    "\n  ✗ HẾT QUOTA NGÀY (RPD) — không thể tiếp tục hôm nay.\n"
                    "    Giải pháp:\n"
                    "      1. Chờ đến 07:00 sáng mai (VN) rồi chạy lại.\n"
                    "      2. Bật billing tại aistudio.google.com → Settings → Billing\n"
                    "         (toàn bộ 7425 chunk ~$0.24, không bị giới hạn RPD).",
                    file=sys.stderr,
                )
                raise
            if attempt == retries:
                raise
            wait = _parse_retry_delay(exc) or (backoff * attempt)
            print(f"    ! embed lỗi (lần {attempt}/{retries}): 429 rate limit/phút -> chờ {wait:.0f}s",
                  file=sys.stderr)
            time.sleep(wait)


def main() -> int:
    parser = argparse.ArgumentParser(description="Nạp dataset lịch sử vào Qdrant của rag-service.")
    parser.add_argument("--chunks-csv", default=str(DEFAULT_CHUNKS), help="đường dẫn chunks.csv")
    parser.add_argument("--documents-csv", default=str(DEFAULT_DOCS), help="đường dẫn documents.csv")
    parser.add_argument("--doc-ids", default=None,
                        help="tập cần nạp: 'D001', '1', '1-5', 'D001,D003'. Bỏ trống = tất cả.")
    parser.add_argument("--limit-chunks", type=int, default=None,
                        help="giới hạn số chunk MỖI tập (để test rẻ). Bỏ trống = tất cả.")
    parser.add_argument("--embed-batch", type=int, default=50,
                        help="số chunk mỗi lần gọi embedding API (Gemini tối đa 100).")
    parser.add_argument("--batch-sleep", type=float, default=1.2,
                        help="giây chờ giữa 2 lần gọi embedding để tránh 429 (mặc định 1.2s).")
    parser.add_argument("--min-chars", type=int, default=20, help="bỏ chunk ngắn hơn ngần này.")
    parser.add_argument("--collection", default=None, help="ghi đè tên collection (mặc định lấy từ config).")
    parser.add_argument("--env-file", default=None, help="chỉ định file .env (mặc định tự dò).")
    parser.add_argument("--recreate", action="store_true",
                        help="XÓA và tạo lại collection trước khi nạp (mất toàn bộ data cũ).")
    parser.add_argument("--dry-run", action="store_true",
                        help="chỉ đếm + in kế hoạch, KHÔNG gọi embedding/Qdrant.")
    args = parser.parse_args()

    chunks_csv = Path(args.chunks_csv)
    documents_csv = Path(args.documents_csv)
    if not chunks_csv.is_file():
        print(f"ERROR: không thấy chunks.csv tại {chunks_csv}", file=sys.stderr)
        return 1

    documents = read_documents(documents_csv)
    available = sorted(documents) or list(range(1, 16))
    selected = parse_doc_ids(args.doc_ids, available)
    if not selected:
        print("ERROR: không có tập nào được chọn (kiểm tra --doc-ids).", file=sys.stderr)
        return 1

    print(f"== Kế hoạch nạp ==")
    print(f"chunks.csv : {chunks_csv}")
    print(f"Tập chọn   : {', '.join('D%03d' % d for d in selected)}")
    print(f"Giới hạn   : {args.limit_chunks if args.limit_chunks is not None else 'tất cả'} chunk/tập")
    print(f"min-chars  : {args.min_chars}")

    if args.dry_run:
        print("\n-- DRY RUN: đếm chunk hợp lệ mỗi tập (không gọi API) --")
        total = 0
        for sid in selected:
            n = sum(1 for _ in iter_doc_chunks(chunks_csv, sid, args.min_chars, args.limit_chunks))
            total += n
            title = documents.get(sid, {}).get("title", f"D{sid:03d}")
            print(f"  D{sid:03d}  {n:>6} chunk  | {title}")
        print(f"\nTổng cộng sẽ nạp ~{total} chunk ({(total + args.embed_batch - 1)//args.embed_batch} lần gọi embedding).")
        print("Bỏ --dry-run để nạp thật.")
        return 0

    # --- chỉ tới đây mới cần env + deps + kết nối ---
    env_file = resolve_env_file(args.env_file)
    if env_file and load_dotenv_into_environ(env_file):
        print(f"env        : {env_file}")
    else:
        print("env        : (không tìm thấy .env — dựa vào biến môi trường sẵn có)")

    sys.path.insert(0, str(RAG_SERVICE_DIR))
    try:
        from app.config import settings
        from app.services.embedding_service import embed_documents
        from app.vectorstore.qdrant_client import ensure_collection, get_client
        from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR khi import app/ (thiếu .env hay deps?): {exc}", file=sys.stderr)
        return 1

    collection = args.collection or settings.qdrant_collection
    print(f"collection : {collection}  (embedding_dim={settings.embedding_dim}, model={settings.embedding_model})")

    if args.recreate and get_client().collection_exists(collection):
        print(f"!! --recreate: xóa collection '{collection}'")
        get_client().delete_collection(collection)
    ensure_collection(collection)

    created_at = datetime.now(timezone.utc).isoformat()
    grand_total = 0
    t_start = time.time()

    for sid in selected:
        meta = documents.get(sid, {})
        title = meta.get("title", f"D{sid:03d}")
        file_path = meta.get("file_path")
        print(f"\n>> D{sid:03d} | {title}")

        # idempotent: xóa vector cũ của source này trước khi nạp lại
        delete_by_source_id(collection, sid)

        chunk_index = 0
        batch_texts: list[str] = []
        batch_pages: list[int | None] = []

        def flush() -> int:
            nonlocal chunk_index
            if not batch_texts:
                return 0
            vectors = embed_with_retry(embed_documents, batch_texts)
            ids, payloads = [], []
            for page, text in zip(batch_pages, batch_texts):
                ids.append(point_id(sid, chunk_index))
                payloads.append(build_payload(sid, title, file_path, chunk_index, page, text, created_at))
                chunk_index += 1
            upsert(collection, ids, vectors, payloads)
            n = len(batch_texts)
            batch_texts.clear()
            batch_pages.clear()
            return n

        doc_count = 0
        try:
            for page, text in iter_doc_chunks(chunks_csv, sid, args.min_chars, args.limit_chunks):
                batch_texts.append(text)
                batch_pages.append(page)
                if len(batch_texts) >= args.embed_batch:
                    doc_count += flush()
                    print(f"   ... đã nạp {doc_count} chunk", end="\r", flush=True)
                    time.sleep(args.batch_sleep)  # throttle tránh 429
            doc_count += flush()
        except Exception as exc:  # noqa: BLE001
            print(f"\n   ERROR khi nạp D{sid:03d}: {exc}", file=sys.stderr)
            print("   (chạy lại script để nạp lại tập này — idempotent theo sourceId)", file=sys.stderr)
            return 1

        grand_total += doc_count
        print(f"   ✓ D{sid:03d}: {doc_count} chunk -> Qdrant")

    elapsed = time.time() - t_start
    print(f"\n== XONG: {grand_total} chunk vào collection '{collection}' trong {elapsed:.0f}s ==")
    print("Thử ngay: POST http://localhost:8001/rag/chat  body {\"question\": \"...\"}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
