"""
Batch test script — chạy các câu hỏi từ file JSON và báo cáo scores.

Usage (từ repo root, sau khi docker compose up rag-service):
    docker compose exec rag-service python3 tests/test_rag_batch.py \
        --file tests/data/questions_tap01_khoi_thuy_den_the_ky_X.json \
        --topk 5 --delay 4

Options:
    --file    path đến file JSON chứa câu hỏi (mặc định: tap01)
    --topk    số lượng chunks retrieve (mặc định: 5)
    --delay   giây chờ giữa các request để tránh rate limit (mặc định: 4)
    --limit   giới hạn số câu hỏi chạy (mặc định: tất cả)
    --source  filter theo sourceId (tuỳ chọn)
"""
import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

BASE_URL = "http://localhost:8001"
NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ"


def ask(question: str, topk: int, source_ids: list[int] | None = None) -> dict:
    body = json.dumps({
        "question": question,
        "topK": topk,
        "sourceIds": source_ids or [],
    }, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/rag/chat",
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    response = urllib.request.urlopen(req, timeout=120)
    return json.loads(response.read().decode("utf-8"))


def run(questions: list[dict], topk: int, delay: float, source_ids: list[int] | None) -> None:
    results = {"ok": 0, "no_data": 0, "error": 0}
    score_all = []

    for i, item in enumerate(questions, 1):
        q = item["question"]
        topic = item.get("topic", "")
        print(f"\n[{i:02d}/{len(questions)}] [{topic}] {q}")

        t0 = time.time()
        try:
            data = ask(q, topk, source_ids)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:200]
            print(f"  ❌ HTTP {e.code}: {body}")
            results["error"] += 1
            time.sleep(delay)
            continue
        except Exception as e:
            print(f"  ❌ {e}")
            results["error"] += 1
            time.sleep(delay)
            continue

        elapsed = round(time.time() - t0, 1)
        scores = [round(c.get("score") or 0, 4) for c in data.get("citations", [])]
        answer = data.get("answer", "")
        score_all.extend(scores)

        is_no_data = NO_DATA_MSG in answer
        icon = "⚠️ " if is_no_data else "✅"
        if is_no_data:
            results["no_data"] += 1
        else:
            results["ok"] += 1

        min_s = min(scores) if scores else 0
        max_s = max(scores) if scores else 0
        print(f"  {icon} {elapsed}s | {len(scores)} citations | score [{min_s:.4f} – {max_s:.4f}]")
        print(f"  A: {answer[:180]}")

        time.sleep(delay)

    # Summary
    print("\n" + "=" * 60)
    print(f"SUMMARY: {len(questions)} questions")
    print(f"  ✅ Answered:    {results['ok']}")
    print(f"  ⚠️  No data:     {results['no_data']}")
    print(f"  ❌ Error:       {results['error']}")
    if score_all:
        avg = round(sum(score_all) / len(score_all), 4)
        print(f"  Score avg:     {avg}")
        print(f"  Score range:   {min(score_all):.4f} – {max(score_all):.4f}")
        above_07 = sum(1 for s in score_all if s >= 0.70)
        above_065 = sum(1 for s in score_all if s >= 0.65)
        print(f"  ≥ 0.70 scores: {above_07}/{len(score_all)}")
        print(f"  ≥ 0.65 scores: {above_065}/{len(score_all)}")


def main():
    parser = argparse.ArgumentParser()
    default_file = Path(__file__).parent / "data" / "questions_tap01_khoi_thuy_den_the_ky_X.json"
    parser.add_argument("--file", default=str(default_file))
    parser.add_argument("--topk", type=int, default=5)
    parser.add_argument("--delay", type=float, default=4.0)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--source", type=int, default=None, help="Filter by sourceId")
    args = parser.parse_args()

    data = json.loads(Path(args.file).read_text(encoding="utf-8"))
    questions = data["questions"]
    if args.limit:
        questions = questions[: args.limit]

    source_ids = [args.source] if args.source else None

    print(f"File:     {args.file}")
    print(f"Source:   {data['source']['title']}")
    print(f"Questions: {len(questions)}")
    print(f"topK={args.topk} | delay={args.delay}s | sourceFilter={source_ids}")
    print("=" * 60)

    run(questions, args.topk, args.delay, source_ids)


if __name__ == "__main__":
    main()
