"""
Batch test script — chạy các câu hỏi từ file JSON và báo cáo scores.

Usage (từ repo root):
    rag-service/.venv/bin/python rag-service/tests/test_rag_batch.py \
        --file rag-service/tests/data/questions_tap01_khoi_thuy_den_the_ky_X.json \
        --topk 5 --delay 70

Options:
    --file    path đến file JSON chứa câu hỏi (mặc định: tap01)
    --topk    số lượng chunks retrieve (mặc định: 5)
    --delay   giây chờ giữa các request để tránh rate limit (mặc định: 70)
    --limit   giới hạn số câu hỏi chạy (mặc định: tất cả)
    --source  filter theo sourceId (tuỳ chọn)
    --out     lưu kết quả ra file JSON (mặc định: tự động đặt tên)
    --report  chỉ in báo cáo từ file kết quả đã có, không chạy lại
"""
import argparse
import json
import time
import urllib.request
from datetime import datetime, timezone
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


def run(questions: list[dict], topk: int, delay: float, source_ids: list[int] | None,
        out_path: Path) -> list[dict]:
    records: list[dict] = []

    for i, item in enumerate(questions, 1):
        q = item["question"]
        topic = item.get("topic", "")
        qid = item.get("id", i)
        print(f"\n[{i:02d}/{len(questions)}] [{topic}] {q}")

        t0 = time.time()
        try:
            data = ask(q, topk, source_ids)
            elapsed = round(time.time() - t0, 1)
            scores = [round(c.get("score") or 0, 4) for c in data.get("citations", [])]
            answer = data.get("answer", "")
            is_no_data = NO_DATA_MSG in answer

            icon = "⚠️ " if is_no_data else "✅"
            min_s = min(scores) if scores else 0
            max_s = max(scores) if scores else 0
            avg_s = round(sum(scores) / len(scores), 4) if scores else 0
            print(f"  {icon} {elapsed}s | {len(scores)} citations | score [{min_s:.4f} – {max_s:.4f}]")
            print(f"  A: {answer[:180]}")

            records.append({
                "id": qid, "topic": topic, "question": q,
                "status": "no_data" if is_no_data else "ok",
                "elapsed": elapsed,
                "citations": len(scores),
                "score_min": min_s, "score_max": max_s, "score_avg": avg_s,
                "scores": scores,
                "answer_preview": answer[:300],
            })
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:200]
            print(f"  ❌ HTTP {e.code}: {body}")
            records.append({
                "id": qid, "topic": topic, "question": q,
                "status": "error", "error": f"HTTP {e.code}: {body}",
                "elapsed": round(time.time() - t0, 1),
                "citations": 0, "score_min": 0, "score_max": 0, "score_avg": 0, "scores": [],
            })
        except Exception as e:
            print(f"  ❌ {e}")
            records.append({
                "id": qid, "topic": topic, "question": q,
                "status": "error", "error": str(e),
                "elapsed": round(time.time() - t0, 1),
                "citations": 0, "score_min": 0, "score_max": 0, "score_avg": 0, "scores": [],
            })

        # Lưu sau mỗi câu để không mất data nếu bị interrupt
        _save(records, out_path)
        time.sleep(delay)

    return records


def _save(records: list[dict], path: Path) -> None:
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def print_report(records: list[dict], source_title: str = "") -> None:
    total = len(records)
    ok = [r for r in records if r["status"] == "ok"]
    no_data = [r for r in records if r["status"] == "no_data"]
    errors = [r for r in records if r["status"] == "error"]
    answered = ok + no_data  # đã nhận được response (kể cả "không đủ dữ liệu")

    all_scores = [s for r in answered for s in r["scores"]]

    print("\n" + "=" * 65)
    if source_title:
        print(f"NGUỒN: {source_title}")
    print(f"TỔNG: {total} câu hỏi đã chạy")
    print(f"  ✅ Có câu trả lời : {len(ok):>3}  ({len(ok)/total*100:.1f}%)")
    print(f"  ⚠️  Thiếu dữ liệu  : {len(no_data):>3}  ({len(no_data)/total*100:.1f}%)")
    print(f"  ❌ Lỗi kỹ thuật   : {len(errors):>3}  ({len(errors)/total*100:.1f}%)")

    if all_scores:
        avg = round(sum(all_scores) / len(all_scores), 4)
        above_070 = sum(1 for s in all_scores if s >= 0.70)
        above_065 = sum(1 for s in all_scores if s >= 0.65)
        above_060 = sum(1 for s in all_scores if s >= 0.60)
        print(f"\nSCORE (trên {len(answered)} câu nhận được response):")
        print(f"  Trung bình : {avg:.4f}")
        print(f"  Min – Max  : {min(all_scores):.4f} – {max(all_scores):.4f}")
        print(f"  ≥ 0.70     : {above_070}/{len(all_scores)} ({above_070/len(all_scores)*100:.1f}%)")
        print(f"  ≥ 0.65     : {above_065}/{len(all_scores)} ({above_065/len(all_scores)*100:.1f}%)")
        print(f"  ≥ 0.60     : {above_060}/{len(all_scores)} ({above_060/len(all_scores)*100:.1f}%)")

    # Breakdown theo topic
    topics: dict[str, dict] = {}
    for r in answered:
        t = r["topic"]
        if t not in topics:
            topics[t] = {"ok": 0, "no_data": 0, "scores": []}
        topics[t][r["status"]] += 1
        topics[t]["scores"].extend(r["scores"])

    if topics:
        print(f"\nTHEO CHỦ ĐỀ:")
        for t, stats in sorted(topics.items()):
            n = stats["ok"] + stats["no_data"]
            avg_t = round(sum(stats["scores"]) / len(stats["scores"]), 3) if stats["scores"] else 0
            ok_rate = stats["ok"] / n * 100 if n else 0
            print(f"  {t:<30} {stats['ok']}/{n} có đáp  score avg={avg_t:.3f}  ok={ok_rate:.0f}%")

    # Câu trả lời có score thấp nhất (nguy cơ hallucination)
    risky = [r for r in ok if r["score_max"] < 0.65]
    if risky:
        print(f"\n⚠️  {len(risky)} câu trả lời có score_max < 0.65 (coi chừng sai):")
        for r in risky:
            print(f"  [{r['topic']}] {r['question'][:60]}... max={r['score_max']:.4f}")

    print("=" * 65)


def main():
    parser = argparse.ArgumentParser()
    default_file = Path(__file__).parent / "data" / "questions_tap01_khoi_thuy_den_the_ky_X.json"
    parser.add_argument("--file", default=str(default_file))
    parser.add_argument("--topk", type=int, default=5)
    parser.add_argument("--delay", type=float, default=70.0)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--source", type=int, default=None)
    parser.add_argument("--out", default=None, help="file JSON lưu kết quả")
    parser.add_argument("--report", default=None, metavar="RESULT_FILE",
                        help="chỉ in báo cáo từ file kết quả đã có")
    args = parser.parse_args()

    # Chế độ report-only
    if args.report:
        records = json.loads(Path(args.report).read_text(encoding="utf-8"))
        print_report(records)
        return

    meta = json.loads(Path(args.file).read_text(encoding="utf-8"))
    questions = meta["questions"]
    if args.limit:
        questions = questions[: args.limit]

    source_ids = [args.source] if args.source else None
    source_title = meta["source"]["title"]

    # Tên file kết quả tự động
    if args.out:
        out_path = Path(args.out)
    else:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
        stem = Path(args.file).stem
        out_path = Path(__file__).parent / "results" / f"{stem}_{stamp}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"File:      {args.file}")
    print(f"Source:    {source_title}")
    print(f"Questions: {len(questions)}")
    print(f"topK={args.topk} | delay={args.delay}s | sourceFilter={source_ids}")
    print(f"Output:    {out_path}")
    print("=" * 65)

    records = run(questions, args.topk, args.delay, source_ids, out_path)
    print_report(records, source_title)
    print(f"\nKết quả đã lưu: {out_path}")
    print(f"Xem lại: python3 {Path(__file__).name} --report {out_path}")


if __name__ == "__main__":
    main()
