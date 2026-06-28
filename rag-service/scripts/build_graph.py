#!/usr/bin/env python3
"""
Build GraphRAG: pull chunk từ Qdrant theo doc → Gemma trích entity/relation → ghi Neo4j.

Pipeline:
  Qdrant (chunk đã có) → graph_extract_service (Gemma) → graph_client (Neo4j MERGE)

Cách dùng (chạy từ rag-service/):
  .venv/bin/python scripts/build_graph.py --doc-id 1                # pilot Tập 01
  .venv/bin/python scripts/build_graph.py --doc-id 1 --limit 20     # test nhanh 20 chunk
  .venv/bin/python scripts/build_graph.py --doc-id 1 --resume       # tiếp tục sau khi hết quota
  .venv/bin/python scripts/build_graph.py --stats                   # xem graph hiện có gì

Resume: mỗi chunk xử lý xong được đánh dấu (:Chunk {processed:true}) trong Neo4j.
Chạy lại với --resume sẽ bỏ qua các chunk đã xử lý.

Key rotation: tự dùng GOOGLE_API_KEY + GOOGLE_API_KEY_2..9 khi hết RPD (giống load_dataset.py).
"""
from __future__ import annotations

import argparse
import os
import queue
import sys
import threading
import time
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent


def load_env():
    for cand in [REPO_ROOT / ".env", RAG_SERVICE_DIR / ".env"]:
        if cand.is_file():
            for line in cand.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


def _parse_retry_delay(exc: Exception) -> float | None:
    import re
    match = re.search(r"retry in (\d+(?:\.\d+)?)s", str(exc))
    return float(match.group(1)) + 3 if match else None


def _is_hard_daily_quota(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and (
        "PerDay" in msg or "per-day" in msg or "requests-per-day" in msg
        or "free_tier_requests" in msg
    )


def make_extract_with_retry(extract_fn_list: list, retries: int = 8, backoff: float = 30.0):
    """Wrap danh sách extract_fn với key rotation (key_index giữ giữa các call)."""
    state = {"key_index": 0}

    def extract_with_retry(text: str) -> dict:
        for attempt in range(1, retries + 1):
            fn = extract_fn_list[state["key_index"]]
            try:
                return fn(text)
            except Exception as exc:  # noqa: BLE001
                if _is_hard_daily_quota(exc):
                    state["key_index"] += 1
                    if state["key_index"] < len(extract_fn_list):
                        print(f"\n  ! Key {state['key_index']} hết RPD → chuyển key {state['key_index'] + 1}",
                              file=sys.stderr)
                        continue
                    print("\n  ✗ TẤT CẢ KEY HẾT QUOTA NGÀY. Chờ reset rồi chạy lại với --resume.",
                          file=sys.stderr)
                    raise
                if attempt == retries:
                    raise
                wait = _parse_retry_delay(exc) or backoff
                print(f"    ! 429/lỗi (lần {attempt}/{retries}) → chờ {wait:.0f}s", file=sys.stderr)
                time.sleep(wait)

    return extract_with_retry


def main() -> int:
    parser = argparse.ArgumentParser(description="Build GraphRAG từ chunk trong Qdrant.")
    parser.add_argument("--doc-id", type=int, help="documentId cần trích (VD: 1 cho Tập 01).")
    parser.add_argument("--limit", type=int, default=None, help="giới hạn số chunk (test nhanh).")
    parser.add_argument("--min-chars", type=int, default=300, help="bỏ chunk ngắn hơn.")
    parser.add_argument("--sleep", type=float, default=2.0, help="giây chờ giữa các chunk (mỗi worker).")
    parser.add_argument("--workers", type=int, default=0,
                        help="số luồng song song (mặc định = số API key). 1 = tuần tự.")
    parser.add_argument("--resume", action="store_true", help="bỏ qua chunk đã xử lý.")
    parser.add_argument("--stats", action="store_true", help="chỉ in thống kê graph rồi thoát.")
    args = parser.parse_args()

    load_env()
    sys.path.insert(0, str(RAG_SERVICE_DIR))
    from app.config import settings
    from app.graph.graph_client import (
        ensure_schema, get_driver, chunk_already_processed, write_graph,
    )
    from app.services.graph_extract_service import build_extract_fn

    # --stats: in thống kê
    if args.stats:
        with get_driver().session(database=settings.neo4j_database) as s:
            n = s.run("MATCH (e:Entity) RETURN count(e) AS c").single()["c"]
            r = s.run("MATCH ()-[r:REL]->() RETURN count(r) AS c").single()["c"]
            ch = s.run("MATCH (c:Chunk {processed:true}) RETURN count(c) AS c").single()["c"]
            print(f"Graph hiện có: {n} entities, {r} relations, {ch} chunk đã xử lý")
            print("\nTop 10 entity nhiều quan hệ nhất:")
            rows = s.run(
                "MATCH (e:Entity)-[r:REL]-() RETURN e.name AS name, e.type AS type, "
                "count(r) AS deg ORDER BY deg DESC LIMIT 10"
            )
            for row in rows:
                print(f"  {row['name']:<25} [{row['type']}] — {row['deg']} quan hệ")
        return 0

    if not args.doc_id:
        print("ERROR: cần --doc-id (hoặc --stats).", file=sys.stderr)
        return 1

    # Kết nối Neo4j + schema
    try:
        get_driver().verify_connectivity()
    except Exception as exc:
        print(f"ERROR: không kết nối được Neo4j ({settings.neo4j_uri}): {str(exc)[:150]}", file=sys.stderr)
        print("Kiểm tra NEO4J_URI/USER/PASSWORD trong .env.", file=sys.stderr)
        return 1
    ensure_schema()
    print(f"Neo4j      : {settings.neo4j_uri} ✓")

    # API keys + extract fn list
    api_keys = [settings.google_api_key]
    for i in range(2, 10):
        k = os.environ.get(f"GOOGLE_API_KEY_{i}", "").strip()
        if k:
            api_keys.append(k)
        else:
            break
    extract_fns = [build_extract_fn(k) for k in api_keys]
    n_workers = args.workers or len(api_keys)
    print(f"API keys   : {len(api_keys)} key(s) | workers={n_workers} | model={settings.llm_model}")

    # Pull chunk từ Qdrant (documentId chưa index → scroll + lọc Python)
    from qdrant_client import QdrantClient
    qc = QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])

    chunks = []
    offset = None
    while True:
        batch, offset = qc.scroll(
            settings.qdrant_collection, offset=offset, limit=250,
            with_payload=True, with_vectors=False,
        )
        for p in batch:
            pl = p.payload
            if pl.get("documentId") == args.doc_id and len(pl.get("chunkText", "")) >= args.min_chars:
                chunks.append((str(p.id), pl.get("pageNumber"), pl.get("chunkText", "")))
        if offset is None:
            break
    chunks.sort(key=lambda c: (c[1] or 0))
    if args.limit:
        chunks = chunks[:args.limit]

    print(f"Doc {args.doc_id}: {len(chunks)} chunk (>= {args.min_chars} ký tự)\n" + "=" * 60)

    # Hàng đợi chunk + bộ đếm dùng chung (thread-safe)
    work_q: queue.Queue = queue.Queue()
    for idx, c in enumerate(chunks, 1):
        work_q.put((idx, c))

    stats = {"done": 0, "skipped": 0, "ent": 0, "rel": 0, "empty": 0}
    lock = threading.Lock()
    total = len(chunks)
    t0 = time.time()

    def worker(worker_id: int):
        """1 worker = 1 API key cố định. Hết RPD thì worker này dừng, worker khác chạy tiếp."""
        extract_fn = extract_fns[worker_id % len(extract_fns)]
        while True:
            try:
                i, (pid, page, text) = work_q.get_nowait()
            except queue.Empty:
                return

            if args.resume and chunk_already_processed(pid):
                with lock:
                    stats["skipped"] += 1
                work_q.task_done()
                continue

            # Trích với retry mềm cho 429/RPM; hết RPD cứng thì worker dừng
            result = None
            for attempt in range(1, 9):
                try:
                    result = extract_fn(text)
                    break
                except Exception as exc:  # noqa: BLE001
                    if _is_hard_daily_quota(exc):
                        print(f"\n  ! Worker {worker_id + 1} (key {worker_id + 1}) hết RPD → dừng worker này",
                              file=sys.stderr)
                        work_q.put((i, (pid, page, text)))  # trả chunk lại cho worker khác
                        work_q.task_done()
                        return
                    if attempt == 8:
                        break
                    wait = _parse_retry_delay(exc) or 30.0
                    time.sleep(wait)

            if result is None or result.get("_empty") or result.get("_parse_error"):
                write_graph(pid, args.doc_id, page, [], [])
                with lock:
                    stats["empty"] += 1
                    n = stats["done"] + stats["empty"]
                print(f"[{n}/{total}] trang {page}: ⚠️  rỗng/parse lỗi", flush=True)
            else:
                ents, rels = result["entities"], result["relations"]
                write_graph(pid, args.doc_id, page, ents, rels)
                with lock:
                    stats["done"] += 1
                    stats["ent"] += len(ents)
                    stats["rel"] += len(rels)
                    n = stats["done"] + stats["empty"]
                print(f"[{n}/{total}] trang {page}: {len(ents)} entities, {len(rels)} relations", flush=True)

            work_q.task_done()
            time.sleep(args.sleep)

    threads = [threading.Thread(target=worker, args=(j,), daemon=True) for j in range(n_workers)]
    for th in threads:
        th.start()
    try:
        for th in threads:
            th.join()
    except KeyboardInterrupt:
        print("\nNgắt — chạy lại với --resume để tiếp tục.", file=sys.stderr)

    done = stats["done"]
    skipped = stats["skipped"]
    ent_total = stats["ent"]
    rel_total = stats["rel"]
    empty = stats["empty"]
    elapsed = time.time() - t0
    print("=" * 60)
    print(f"XONG: {done} chunk trích, {skipped} bỏ qua, {empty} rỗng")
    print(f"     {ent_total} entities, {rel_total} relations | {elapsed:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
