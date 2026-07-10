#!/usr/bin/env python3
"""
Bulk loader: nạp dataset Q&A "Vietnam-History-200K-Vi" (HuggingFace) vào Qdrant
như một LỚP FAQ / answer-cache, TÁCH BIỆT với corpus sách lịch sử.

Dataset nguồn (minhxthanh/Vietnam-History-200K-Vi) KHÔNG phải tài liệu nguồn mà là
~200K cặp hỏi–đáp do model sinh (SFT chat). Vì vậy không nạp như sách:
  - Mỗi cặp = 1 point trong Qdrant, embed theo CÂU HỎI (asymmetric FAQ retrieval):
    user hỏi câu gần giống -> hit thẳng câu trả lời đã curated.
  - chunkText = "Hỏi: ...\n\nĐáp: ..." để LLM nhận context QA đã sẵn.
  - sourceType="FAQ", dồn vào 1 sourceId (FAQ_SOURCE_ID) -> pageNumber=null,
    citation hiện rõ là nguồn FAQ/AI-generated, KHÔNG trộn số trang sách thật.

Idempotent: mặc định xóa toàn bộ point FAQ cũ (delete_by_source_id) trước khi nạp.
Dùng --resume để bỏ qua point đã có (khi bị gián đoạn giữa chừng).

Mỗi messages = [system, user, assistant(channel='analysis'), assistant(channel='final')].
  question = nội dung message role=user
  answer   = message role=assistant có channel='final' (fallback: assistant cuối cùng)

Cách chạy (cần .env có QDRANT_* + GOOGLE_API_KEY):
  # tải JSONL (nếu chưa có) + parse + dedup + đếm, KHÔNG gọi embedding:
  python rag-service/scripts/load_faq_dataset.py --dry-run
  # nạp thử 500 cặp đầu (đã dedup) cho rẻ:
  python rag-service/scripts/load_faq_dataset.py --limit 500
  # nạp toàn bộ:
  python rag-service/scripts/load_faq_dataset.py
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Tái dùng helper của load_dataset.py (cùng thư mục scripts/)
SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))
from load_dataset import (  # noqa: E402
    _make_embed_fn,
    load_dotenv_into_environ,
    make_embed_with_retry,
    resolve_env_file,
)

HF_URL = (
    "https://huggingface.co/datasets/minhxthanh/Vietnam-History-200K-Vi/"
    "resolve/main/Vietnam%20History%202025%20Dataset.jsonl"
)
# Cache JSONL ở working dir lớn để không tải lại 185MB mỗi lần
DEFAULT_JSONL = Path("/Volumes/SSD/RAG-history-pdfs/Vietnam-History-200K-Vi.jsonl")

# FAQ dùng 1 sourceId riêng — tách khỏi DOCUMENT (1–999). chunkIndex phân biệt từng cặp.
FAQ_SOURCE_ID = 2_000_000
FAQ_SOURCE_TYPE = "FAQ"
FAQ_TITLE_MAXLEN = 200


def download_jsonl(dest: Path) -> None:
    """Tải JSONL từ HuggingFace về dest (stream, không nạp hết vào RAM)."""
    import httpx

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"   tải {HF_URL}\n   -> {dest}")
    with httpx.stream("GET", HF_URL, timeout=120, follow_redirects=True) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with tmp.open("wb") as f:
            for chunk in r.iter_bytes(chunk_size=1 << 20):
                f.write(chunk)
                done += len(chunk)
                if total:
                    print(f"   ... {done/1e6:.0f}/{total/1e6:.0f} MB", end="\r", flush=True)
    tmp.rename(dest)
    print(f"\n   ✓ tải xong ({dest.stat().st_size/1e6:.0f} MB)")


def normalize_question(q: str) -> str:
    """Chuẩn hóa câu hỏi để dedup: lower + gộp khoảng trắng."""
    return re.sub(r"\s+", " ", q.strip().lower())


def extract_qa(row: dict) -> tuple[str, str] | None:
    """Lấy (question, answer) từ 1 row. None nếu thiếu user hoặc final answer."""
    msgs = row.get("messages") if isinstance(row, dict) else row
    if not isinstance(msgs, list):
        return None
    question = None
    final_answer = None
    last_answer = None
    for m in msgs:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if role == "user":
            question = content  # câu user cuối cùng nếu có nhiều
        elif role == "assistant":
            last_answer = content
            if m.get("channel") == "final":
                final_answer = content
    answer = final_answer or last_answer
    if not question or not answer:
        return None
    return question, answer


def iter_qa(jsonl_path: Path, min_answer_chars: int, dedup: bool, limit: int | None):
    """Yield (question, answer) đã dedup, theo thứ tự xuất hiện."""
    seen: set[str] = set()
    count = 0
    with jsonl_path.open(encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError:
                continue
            qa = extract_qa(row)
            if not qa:
                continue
            question, answer = qa
            if len(answer) < min_answer_chars:
                continue
            if dedup:
                key = normalize_question(question)
                if key in seen:
                    continue
                seen.add(key)
            yield question, answer
            count += 1
            if limit is not None and count >= limit:
                return


def build_payload(chunk_index: int, question: str, answer: str, created_at: str) -> dict:
    """Bám sát ingest_service._build_payload; FAQ -> pageNumber/doc null, giữ link HF."""
    return {
        "sourceId": FAQ_SOURCE_ID,
        "sourceType": FAQ_SOURCE_TYPE,
        "articleId": None,
        "documentId": None,
        "sourceUrl": HF_URL,
        "filePath": None,
        "chunkIndex": chunk_index,
        "pageNumber": None,
        "chunkText": f"Hỏi: {question}\n\nĐáp: {answer}",
        "title": question[:FAQ_TITLE_MAXLEN],
        "categoryId": None,
        "categoryName": "FAQ (AI-generated)",
        "slug": None,
        "tagIds": [],
        "eventIds": [],
        "periodIds": [],
        "createdAt": created_at,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Nạp dataset FAQ lịch sử (HuggingFace) vào Qdrant.")
    parser.add_argument("--jsonl-path", default=str(DEFAULT_JSONL),
                        help="đường dẫn JSONL cục bộ (tự tải nếu chưa có).")
    parser.add_argument("--limit", type=int, default=None,
                        help="giới hạn số cặp Q&A (sau dedup) để nạp. Bỏ trống = tất cả.")
    parser.add_argument("--min-answer-chars", type=int, default=40,
                        help="bỏ cặp có câu trả lời ngắn hơn ngần này (mặc định 40).")
    parser.add_argument("--no-dedup", action="store_true",
                        help="KHÔNG khử trùng lặp câu hỏi (mặc định có dedup).")
    parser.add_argument("--embed-batch", type=int, default=50,
                        help="số câu mỗi lần gọi embedding API (Gemini tối đa 100).")
    parser.add_argument("--batch-sleep", type=float, default=1.2,
                        help="giây chờ giữa 2 lần gọi embedding để tránh 429.")
    parser.add_argument("--collection", default=None,
                        help="ghi đè tên collection (mặc định lấy từ config).")
    parser.add_argument("--env-file", default=None, help="chỉ định file .env (mặc định tự dò).")
    parser.add_argument("--resume", action="store_true",
                        help="bỏ qua point FAQ đã có (dùng khi bị gián đoạn). Mặc định: xóa & nạp lại.")
    parser.add_argument("--dry-run", action="store_true",
                        help="tải + parse + dedup + đếm, KHÔNG gọi embedding/Qdrant.")
    args = parser.parse_args()

    jsonl_path = Path(args.jsonl_path)
    dedup = not args.no_dedup

    print("== Kế hoạch nạp FAQ ==")
    print(f"JSONL      : {jsonl_path}")
    print(f"dedup      : {'có' if dedup else 'không'}")
    print(f"min-answer : {args.min_answer_chars} ký tự")
    print(f"limit      : {args.limit if args.limit is not None else 'tất cả'} cặp")

    if not jsonl_path.is_file():
        print("\n-- JSONL chưa có cục bộ --")
        download_jsonl(jsonl_path)

    if args.dry_run:
        print("\n-- DRY RUN: đếm cặp Q&A hợp lệ (không gọi API) --")
        n = 0
        sample = []
        for q, a in iter_qa(jsonl_path, args.min_answer_chars, dedup, args.limit):
            if len(sample) < 3:
                sample.append((q, a))
            n += 1
        print(f"Sẽ nạp ~{n} cặp ({(n + args.embed_batch - 1)//args.embed_batch} lần gọi embedding).")
        for i, (q, a) in enumerate(sample, 1):
            print(f"\n  [{i}] Hỏi: {q[:100]}")
            print(f"      Đáp: {a[:100]}...")
        print("\nBỏ --dry-run để nạp thật.")
        return 0

    # --- chỉ tới đây mới cần env + deps + kết nối ---
    env_file = resolve_env_file(args.env_file)
    if env_file and load_dotenv_into_environ(env_file):
        print(f"env        : {env_file}")
    else:
        print("env        : (không tìm thấy .env — dựa vào biến môi trường sẵn có)")

    import os

    sys.path.insert(0, str(RAG_SERVICE_DIR))
    try:
        from app.config import settings
        from app.vectorstore.qdrant_client import ensure_collection, get_client
        from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR khi import app/ (thiếu .env hay deps?): {exc}", file=sys.stderr)
        return 1

    api_keys = [settings.google_api_key]
    for i in range(2, 10):
        extra_key = os.environ.get(f"GOOGLE_API_KEY_{i}", "").strip()
        if extra_key:
            api_keys.append(extra_key)
        else:
            break
    embed_fn_list = [_make_embed_fn(k) for k in api_keys]
    embed_with_retry = make_embed_with_retry(embed_fn_list)
    print(f"API keys   : {len(api_keys)} key(s) sẵn sàng (key rotation khi hết RPD)")

    collection = args.collection or settings.qdrant_collection
    print(f"collection : {collection}  (embedding_dim={settings.embedding_dim}, model={settings.embedding_model})")

    ensure_collection(collection)
    if args.resume:
        print("   (resume mode: giữ point FAQ cũ, chỉ embed point còn thiếu)")
    else:
        print(f"   xóa point FAQ cũ (sourceId={FAQ_SOURCE_ID}) trước khi nạp lại")
        delete_by_source_id(collection, FAQ_SOURCE_ID)

    created_at = datetime.now(timezone.utc).isoformat()
    chunk_index = 0
    done = 0
    skipped = 0
    batch: list[tuple[str, str]] = []
    t_start = time.time()

    def flush() -> tuple[int, int]:
        """Embed CÂU HỎI, upsert (q,a). Trả (số mới, số bỏ qua vì đã có)."""
        nonlocal chunk_index
        if not batch:
            return 0, 0
        items = list(zip(range(chunk_index, chunk_index + len(batch)), batch))
        chunk_index += len(batch)
        batch.clear()

        if args.resume:
            all_ids = [point_id(FAQ_SOURCE_ID, idx) for idx, _ in items]
            existing = {str(p.id) for p in get_client().retrieve(
                collection_name=collection, ids=all_ids,
                with_payload=False, with_vectors=False,
            )}
            todo = [(idx, qa) for idx, qa in items if point_id(FAQ_SOURCE_ID, idx) not in existing]
            n_skip = len(items) - len(todo)
        else:
            todo = items
            n_skip = 0

        if not todo:
            return 0, n_skip

        # embed CÂU HỎI (asymmetric FAQ): user hỏi gần giống -> match
        questions = [qa[0] for _, qa in todo]
        vectors = embed_with_retry(questions)
        ids = [point_id(FAQ_SOURCE_ID, idx) for idx, _ in todo]
        payloads = [build_payload(idx, qa[0], qa[1], created_at) for idx, qa in todo]
        upsert(collection, ids, vectors, payloads)
        return len(todo), n_skip

    try:
        for q, a in iter_qa(jsonl_path, args.min_answer_chars, dedup, args.limit):
            batch.append((q, a))
            if len(batch) >= args.embed_batch:
                n_new, n_skip = flush()
                done += n_new
                skipped += n_skip
                label = f"   ... đã nạp {done} cặp"
                if skipped:
                    label += f" (bỏ qua {skipped} đã có)"
                print(label, end="\r", flush=True)
                if n_new > 0:
                    time.sleep(args.batch_sleep)
        n_new, n_skip = flush()
        done += n_new
        skipped += n_skip
    except Exception as exc:  # noqa: BLE001
        print(f"\n   ERROR khi nạp FAQ: {exc}", file=sys.stderr)
        hint = "--resume" if not args.resume else "lại"
        print(f"   (chạy lại với {hint} để tiếp tục từ point còn thiếu)", file=sys.stderr)
        return 1

    elapsed = time.time() - t_start
    summary = f"\n== XONG: {done} cặp FAQ vào collection '{collection}' trong {elapsed:.0f}s =="
    if skipped:
        summary += f"  ({skipped} đã có, bỏ qua)"
    print(summary)
    print('Thử ngay: POST http://localhost:8001/rag/chat  body {"question": "..."}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
