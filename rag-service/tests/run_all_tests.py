#!/usr/bin/env python3
"""
Master batch test — chạy toàn bộ 15 tập và báo cáo tổng hợp.

Usage (từ rag-service/):
    .venv/bin/python tests/run_all_tests.py
    .venv/bin/python tests/run_all_tests.py --ai-score      # LLM đánh giá từng câu
    .venv/bin/python tests/run_all_tests.py --delay 5 --topk 5
    .venv/bin/python tests/run_all_tests.py --report tests/results/run_all_<stamp>.json

AI Score (--ai-score):
    Sau khi nhận câu trả lời từ RAG, gọi Gemma để chấm điểm 1-5:
      5 = Trả lời đúng, đủ, có keywords liên quan
      3 = Trả lời được nhưng thiếu sót hoặc chung chung
      1 = Không trả lời được / sai hoàn toàn
"""
from __future__ import annotations

import argparse
import json
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent
DATA_DIR = TESTS_DIR / "data"
RESULTS_DIR = TESTS_DIR / "results"
RAG_SERVICE_DIR = TESTS_DIR.parent

BASE_URL = "http://localhost:8001"
NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ"

TAP_FILES = sorted(DATA_DIR.glob("questions_tap*.json"))

_HOST = BASE_URL.split("//")[-1].split(":")[0]
_PORT = int(BASE_URL.rsplit(":", 1)[-1].split("/")[0])


# ── service health check ──────────────────────────────────────────────────────

def service_is_up() -> bool:
    try:
        s = socket.create_connection((_HOST, _PORT), timeout=3)
        s.close()
        return True
    except OSError:
        return False


def wait_for_service(poll: int = 15, timeout: int = 600) -> bool:
    """Đợi service trở lại. Trả True nếu up, False nếu hết timeout."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if service_is_up():
            print("  ✅ Service đã sẵn sàng.")
            return True
        remaining = int(deadline - time.time())
        print(f"  ⏳ Service chưa lên, thử lại sau {poll}s (còn {remaining}s timeout)...")
        time.sleep(poll)
    return False


# ── RAG call ──────────────────────────────────────────────────────────────────

def ask_rag(question: str, topk: int, source_ids: list[int] | None = None,
            retries: int = 3) -> dict:
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
    for attempt in range(1, retries + 1):
        try:
            resp = urllib.request.urlopen(req, timeout=240)
            return json.loads(resp.read().decode("utf-8"))
        except (ConnectionRefusedError, urllib.error.URLError) as exc:
            is_conn_refused = isinstance(exc, ConnectionRefusedError) or (
                isinstance(exc, urllib.error.URLError) and
                isinstance(exc.reason, (ConnectionRefusedError, OSError)) and
                "Connection refused" in str(exc)
            )
            if is_conn_refused and attempt < retries:
                print(f"\n  ⚠️  Connection refused (lần {attempt}/{retries}). Đợi service...")
                if not wait_for_service():
                    raise RuntimeError("Service không khởi động lại được trong 10 phút.") from exc
            else:
                raise


# ── AI scoring ────────────────────────────────────────────────────────────────

_llm_client = None

def _get_llm():
    global _llm_client
    if _llm_client is None:
        sys.path.insert(0, str(RAG_SERVICE_DIR))
        from app.config import settings
        from google import genai
        _llm_client = (genai.Client(api_key=settings.google_api_key), settings.llm_model)
    return _llm_client


def ai_score(question: str, answer: str, keywords: list[str]) -> tuple[int, str]:
    """
    Gọi Gemma chấm điểm 1-5 cho câu trả lời RAG.
    Trả về (score, reason).
    """
    if not answer or NO_DATA_MSG in answer:
        return 0, "no_data"

    kw_str = ", ".join(keywords) if keywords else "(không có)"
    prompt = (
        f"Câu hỏi lịch sử Việt Nam: {question}\n\n"
        f"Từ khóa kỳ vọng: {kw_str}\n\n"
        f"Câu trả lời của hệ thống RAG:\n{answer[:600]}\n\n"
        "Hãy chấm điểm câu trả lời theo thang 1-5:\n"
        "  5 = Trả lời đúng, đủ ý, có đề cập các từ khóa quan trọng\n"
        "  4 = Trả lời đúng nhưng thiếu một vài chi tiết\n"
        "  3 = Trả lời chung chung, đúng một phần\n"
        "  2 = Trả lời lạc đề hoặc có thông tin sai\n"
        "  1 = Không trả lời được / hoàn toàn sai\n\n"
        "Chỉ trả lời theo định dạng: ĐIỂM: <số> | LÝ DO: <1 câu ngắn>"
    )
    try:
        client, model = _get_llm()
        from google.genai import types
        resp = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=2000),
        )
        # Gemma 4 là thinking model: lọc thought=True parts, chỉ lấy answer thực
        parts = resp.candidates[0].content.parts if resp.candidates else []
        text = "".join(
            p.text or "" for p in parts if not getattr(p, "thought", False)
        ).strip() or (resp.text or "").strip()
        # Parse "ĐIỂM: 4 | LÝ DO: ..."
        score = 0
        reason = text
        if "ĐIỂM:" in text:
            part = text.split("ĐIỂM:")[1].split("|")[0].strip()
            try:
                score = int(part[0])
            except Exception:
                score = 0
        if "LÝ DO:" in text:
            reason = text.split("LÝ DO:")[1].strip()
        return score, reason
    except Exception as exc:
        return -1, f"error: {exc}"


# ── keyword check (không cần LLM) ────────────────────────────────────────────

def keyword_score(answer: str, keywords: list[str]) -> tuple[int, int]:
    """Trả (số keyword có trong answer, tổng keyword)."""
    if not keywords:
        return 0, 0
    ans_lower = answer.lower()
    hits = sum(1 for kw in keywords if kw.lower() in ans_lower)
    return hits, len(keywords)


# ── per-tap run ───────────────────────────────────────────────────────────────

def run_tap(
    tap_file: Path,
    topk: int,
    delay: float,
    use_ai_score: bool,
    all_records: list[dict],
    out_path: Path,
    done_keys: set[tuple],
) -> list[dict]:
    meta = json.loads(tap_file.read_text(encoding="utf-8"))
    questions = meta["questions"]
    source = meta.get("source", {})
    source_title = source.get("title", tap_file.stem)
    source_id = source.get("sourceId") or source.get("id")
    source_ids = [source_id] if source_id else None

    tap_stem = tap_file.stem
    skipped = sum(1 for q in questions if (tap_stem, q.get("id", 0)) in done_keys)

    print(f"\n{'='*65}")
    print(f"TẬP: {source_title}")
    print(f"     {len(questions)} câu | topK={topk} | ai_score={use_ai_score}"
          + (f" | resume: bỏ qua {skipped} câu đã làm" if skipped else ""))
    print(f"{'='*65}")

    records = []
    for i, item in enumerate(questions, 1):
        q = item["question"]
        topic = item.get("topic", "")
        qid = item.get("id", i)
        keywords = item.get("expected_keywords", [])

        if (tap_stem, qid) in done_keys:
            print(f"\n[{i:02d}/{len(questions)}] ⏭  (đã có) {q[:60]}")
            continue

        print(f"\n[{i:02d}/{len(questions)}] {q[:70]}")

        t0 = time.time()
        try:
            data = ask_rag(q, topk, source_ids)
            elapsed = round(time.time() - t0, 1)
            answer = data.get("answer", "")
            citations = data.get("citations", [])
            scores = [round(c.get("score") or 0, 4) for c in citations]
            is_no_data = NO_DATA_MSG in answer

            kw_hits, kw_total = keyword_score(answer, keywords)
            kw_rate = round(kw_hits / kw_total, 2) if kw_total else None

            ai_s, ai_reason = (0, "skipped")
            if use_ai_score and not is_no_data:
                ai_s, ai_reason = ai_score(q, answer, keywords)

            score_avg = round(sum(scores) / len(scores), 4) if scores else 0
            score_max = max(scores) if scores else 0

            status = "no_data" if is_no_data else "ok"
            icon = "⚠️ " if is_no_data else "✅"
            print(f"  {icon} {elapsed}s | citations={len(scores)} | "
                  f"score_avg={score_avg:.3f} | kw={kw_hits}/{kw_total}"
                  + (f" | AI={ai_s}/5" if use_ai_score else ""))
            print(f"  A: {answer[:160]}")

            rec = {
                "id": qid, "topic": topic, "question": q, "status": status,
                "elapsed": elapsed,
                "citations": len(scores),
                "score_min": min(scores) if scores else 0,
                "score_max": score_max,
                "score_avg": score_avg,
                "scores": scores,
                "kw_hits": kw_hits, "kw_total": kw_total, "kw_rate": kw_rate,
                "ai_score": ai_s, "ai_reason": ai_reason,
                "answer_preview": answer[:300],
                "source_title": source_title,
                "tap_file": tap_stem,
            }
        except Exception as exc:
            elapsed = round(time.time() - t0, 1)
            print(f"  ❌ {exc}")
            rec = {
                "id": qid, "topic": topic, "question": q, "status": "error",
                "elapsed": elapsed, "citations": 0,
                "score_min": 0, "score_max": 0, "score_avg": 0, "scores": [],
                "kw_hits": 0, "kw_total": len(keywords), "kw_rate": None,
                "ai_score": -1, "ai_reason": str(exc),
                "answer_preview": "",
                "source_title": source_title,
                "tap_file": tap_stem,
            }

        records.append(rec)
        # Nếu là retry (câu đã có trong file do error trước đó) → cập nhật tại chỗ
        existing_idx = next(
            (i for i, r in enumerate(all_records)
             if r["tap_file"] == tap_stem and r["id"] == qid),
            None,
        )
        if existing_idx is not None:
            all_records[existing_idx] = rec
        else:
            all_records.append(rec)
        out_path.write_text(json.dumps(all_records, ensure_ascii=False, indent=2), encoding="utf-8")

        time.sleep(delay)

    return records


# ── aggregate report ──────────────────────────────────────────────────────────

def print_aggregate(all_records: list[dict], use_ai_score: bool) -> None:
    total = len(all_records)
    ok = [r for r in all_records if r["status"] == "ok"]
    no_data = [r for r in all_records if r["status"] == "no_data"]
    errors = [r for r in all_records if r["status"] == "error"]

    all_scores = [s for r in ok + no_data for s in r["scores"]]
    kw_records = [r for r in ok if r["kw_total"] > 0]
    ai_records = [r for r in ok if r["ai_score"] > 0]

    print("\n" + "=" * 65)
    print("TỔNG HỢP TẤT CẢ 15 TẬP")
    print("=" * 65)
    print(f"Tổng câu hỏi   : {total}")
    print(f"  ✅ Có đáp     : {len(ok):>4}  ({len(ok)/total*100:.1f}%)")
    print(f"  ⚠️  Thiếu data : {len(no_data):>4}  ({len(no_data)/total*100:.1f}%)")
    print(f"  ❌ Lỗi        : {len(errors):>4}  ({len(errors)/total*100:.1f}%)")

    if all_scores:
        avg = round(sum(all_scores) / len(all_scores), 4)
        above_070 = sum(1 for s in all_scores if s >= 0.70)
        above_065 = sum(1 for s in all_scores if s >= 0.65)
        above_060 = sum(1 for s in all_scores if s >= 0.60)
        print(f"\nRETRIEVAL SCORE (cosine similarity):")
        print(f"  Trung bình  : {avg:.4f}")
        print(f"  Min – Max   : {min(all_scores):.4f} – {max(all_scores):.4f}")
        print(f"  ≥ 0.70      : {above_070}/{len(all_scores)} ({above_070/len(all_scores)*100:.1f}%)")
        print(f"  ≥ 0.65      : {above_065}/{len(all_scores)} ({above_065/len(all_scores)*100:.1f}%)")
        print(f"  ≥ 0.60      : {above_060}/{len(all_scores)} ({above_060/len(all_scores)*100:.1f}%)")

    if kw_records:
        kw_avg = round(sum(r["kw_rate"] for r in kw_records) / len(kw_records), 3)
        print(f"\nKEYWORD HIT RATE: {kw_avg:.1%} trung bình ({len(kw_records)} câu có keywords)")

    if use_ai_score and ai_records:
        ai_avg = round(sum(r["ai_score"] for r in ai_records) / len(ai_records), 2)
        dist = {i: sum(1 for r in ai_records if r["ai_score"] == i) for i in range(1, 6)}
        print(f"\nAI SCORE (Gemma chấm 1-5): trung bình {ai_avg:.2f}/5")
        for s in range(5, 0, -1):
            bar = "█" * dist[s]
            print(f"  {s}/5: {dist[s]:3d} câu  {bar}")

    # Per-tap breakdown
    print(f"\nPER TẬP:")
    taps: dict[str, dict] = {}
    for r in all_records:
        t = r["tap_file"]
        if t not in taps:
            taps[t] = {"ok": 0, "no_data": 0, "error": 0, "scores": [], "ai": [], "kw": []}
        taps[t][r["status"]] += 1
        taps[t]["scores"].extend(r["scores"])
        if r["ai_score"] > 0:
            taps[t]["ai"].append(r["ai_score"])
        if r["kw_rate"] is not None:
            taps[t]["kw"].append(r["kw_rate"])

    for t, s in sorted(taps.items()):
        n = s["ok"] + s["no_data"] + s["error"]
        ok_rate = s["ok"] / n * 100 if n else 0
        avg_score = round(sum(s["scores"]) / len(s["scores"]), 3) if s["scores"] else 0
        ai_avg_t = round(sum(s["ai"]) / len(s["ai"]), 1) if s["ai"] else "-"
        kw_avg_t = f"{sum(s['kw'])/len(s['kw']):.0%}" if s["kw"] else "-"
        label = t.replace("questions_", "").replace("_", " ")
        ai_col = f" | AI={ai_avg_t}/5" if use_ai_score else ""
        print(f"  {label:<38} ok={ok_rate:.0f}%  score={avg_score:.3f}  kw={kw_avg_t}{ai_col}")

    print("=" * 65)


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Chạy toàn bộ 640 câu hỏi qua RAG và báo cáo tổng hợp."
    )
    parser.add_argument("--topk", type=int, default=5)
    parser.add_argument("--delay", type=float, default=3.0,
                        help="giây chờ giữa các câu (mặc định 3s).")
    parser.add_argument("--ai-score", action="store_true",
                        help="Dùng Gemma chấm điểm 1-5 cho mỗi câu trả lời.")
    parser.add_argument("--taps", default=None,
                        help="Chỉ chạy các tập chỉ định, VD: '01,03,07'. Bỏ trống = tất cả.")
    parser.add_argument("--limit", type=int, default=None,
                        help="Giới hạn số câu mỗi tập (để test nhanh).")
    parser.add_argument("--out", default=None, help="File JSON lưu kết quả tổng.")
    parser.add_argument("--report", default=None, metavar="RESULT_FILE",
                        help="Chỉ in báo cáo từ file kết quả đã có.")
    parser.add_argument("--resume", default=None, metavar="RESULT_FILE",
                        help="Tiếp tục từ file kết quả bị gián đoạn, bỏ qua câu đã làm.")
    args = parser.parse_args()

    if args.report:
        all_records = json.loads(Path(args.report).read_text(encoding="utf-8"))
        use_ai = any(r.get("ai_score", -1) >= 0 for r in all_records)
        print_aggregate(all_records, use_ai)
        return

    # Lọc tập theo --taps
    tap_files = TAP_FILES
    if args.taps:
        wanted = {f"tap{t.strip().zfill(2)}" for t in args.taps.split(",")}
        tap_files = [f for f in TAP_FILES if any(w in f.stem for w in wanted)]
    if not tap_files:
        print("ERROR: không tìm thấy file câu hỏi.", file=sys.stderr)
        sys.exit(1)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
    out_path = Path(args.out) if args.out else RESULTS_DIR / f"run_all_{stamp}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    total_q = sum(
        len(json.loads(f.read_text(encoding="utf-8"))["questions"][:args.limit or 9999])
        for f in tap_files
    )
    est = total_q * (args.delay + (5 if args.ai_score else 0))
    print(f"== Batch Test Toàn Bộ ==")
    print(f"Số tập     : {len(tap_files)}")
    print(f"Tổng câu   : {total_q}")
    print(f"topK       : {args.topk}")
    print(f"delay      : {args.delay}s")
    print(f"AI score   : {'bật' if args.ai_score else 'tắt'}")
    print(f"Ước tính   : ~{est/60:.0f} phút")
    print(f"Kết quả    : {out_path}")

    # Load env nếu cần (cho AI score)
    if args.ai_score:
        for env_candidate in [RAG_SERVICE_DIR.parent / ".env", RAG_SERVICE_DIR / ".env"]:
            if env_candidate.is_file():
                for line in env_candidate.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, _, v = line.partition("=")
                        import os
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
                break
        sys.path.insert(0, str(RAG_SERVICE_DIR))

    print(f"\nKiểm tra service {BASE_URL}... ", end="", flush=True)
    if not service_is_up():
        print("KHÔNG KẾT NỐI ĐƯỢC.")
        print("Hãy khởi động RAG service trước rồi chạy lại.", file=sys.stderr)
        sys.exit(1)
    print("OK")

    # Resume: load file cũ nếu có
    all_records: list[dict] = []
    done_keys: set[tuple] = set()
    if args.resume:
        resume_path = Path(args.resume)
        if resume_path.is_file():
            all_records = json.loads(resume_path.read_text(encoding="utf-8"))
            done_keys = {(r["tap_file"], r["id"]) for r in all_records if r["status"] != "error"}
            out_path = resume_path
            print(f"Resume: đã có {len(all_records)} câu, bỏ qua {len(done_keys)} câu đã làm.")
        else:
            print(f"ERROR: --resume file không tồn tại: {resume_path}", file=sys.stderr)
            print("Dùng --out để bắt đầu run mới, hoặc kiểm tra lại tên file.", file=sys.stderr)
            sys.exit(1)

    t_start = time.time()

    for tap_file in tap_files:
        meta = json.loads(tap_file.read_text(encoding="utf-8"))
        questions = meta["questions"]
        if args.limit:
            questions = questions[:args.limit]

        tap_path = DATA_DIR / tap_file.name
        run_tap(tap_path, args.topk, args.delay, args.ai_score,
                all_records, out_path, done_keys)

    elapsed_total = time.time() - t_start
    print(f"\n\nTổng thời gian: {elapsed_total/60:.1f} phút")
    print_aggregate(all_records, args.ai_score)
    print(f"\nKết quả: {out_path}")
    print(f"Xem lại: python tests/run_all_tests.py --report {out_path}")


if __name__ == "__main__":
    main()
