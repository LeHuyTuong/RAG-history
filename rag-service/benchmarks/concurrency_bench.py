#!/usr/bin/env python3
"""
Benchmark CONCURRENCY: mở N kết nối stream ĐỒNG THỜI ở mỗi mức tải, đo SSE vs
WebSocket lúc "đông" — trả lời "nhiều kết nối cùng lúc thì hệ thống còn chịu
được không, TTFT/ITL có vọt lên không, có timeout/lỗi không".

Khác stream_bench.py (tuần tự, đo latency 1 stream), script này ramp mức
concurrency 1 → 10 → 50 → ... và tại mỗi mức bắn đồng thời N stream.

Chạy (khuyến nghị mock mode cho quota-free + input giống hệt 2 transport):
  STREAM_SOURCE=mock STREAM_MOCK_TOKENS=60 STREAM_MOCK_DELAY_MS=20 \
      uvicorn app.main:app --port 8000

  python benchmarks/concurrency_bench.py --transport both \
      --levels 1,10,50,100,200 --timeout 30 \
      --out benchmarks/results-concurrency.csv

Metric mỗi (transport, level):
  - success rate (% kết nối stream xong trọn vẹn)
  - TTFT p50/p95, ITL p50/p95 (chỉ tính trên kết nối OK)
  - aggregate throughput (tổng token nhận / thời gian tường của cả mức)
  - số timeout / lỗi

LƯU Ý (đọc trước khi trích số): chạy trên 1 máy thì client + server tranh CPU;
ở concurrency cao, số đo phản ánh giới hạn của MÁY đang chạy, không phải một
"server production". Client tự mở N kết nối cũng tốn tài nguyên client. Để đo
sạch cần tách client/server ra 2 máy. Đây là emulation trên 1 node.

Output CSV: transport,level,conn_id,status,ttft_ms,itl_ms,total_ms,tokens
"""
import argparse
import asyncio
import csv
import math
import time

from stream_bench import run_sse, run_ws, DEFAULT_QUESTIONS


def percentile(values, p):
    if not values:
        return float("nan")
    s = sorted(values)
    k = (len(s) - 1) * (p / 100)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return s[int(k)]
    return s[f] + (s[c] - s[f]) * (k - f)


async def one_conn(transport, base_url, question, timeout_s):
    """Một kết nối stream. Trả dict metric + status (ok/timeout/empty/error)."""
    runner = run_sse if transport == "sse" else run_ws
    try:
        rows, _conn_setup = await asyncio.wait_for(
            runner(base_url, {"question": question}, (0, 0, 0)), timeout=timeout_s
        )
    except asyncio.TimeoutError:
        return {"status": "timeout", "ttft": None, "itl": None, "total": None, "tokens": 0}
    except Exception as exc:  # noqa: BLE001
        return {"status": f"error:{type(exc).__name__}", "ttft": None, "itl": None, "total": None, "tokens": 0}

    if not rows:
        return {"status": "empty", "ttft": None, "itl": None, "total": None, "tokens": 0}
    recv = sorted(r[1] for r in rows)
    n = len(recv)
    ttft = recv[0]
    itl = (recv[-1] - recv[0]) / (n - 1) if n > 1 else float("nan")
    return {"status": "ok", "ttft": ttft, "itl": itl, "total": recv[-1], "tokens": n}


async def run_level(transport, base_url, level, questions, timeout_s):
    tasks = [
        one_conn(transport, base_url, questions[i % len(questions)], timeout_s)
        for i in range(level)
    ]
    t0 = time.perf_counter()
    results = await asyncio.gather(*tasks)
    wall_s = time.perf_counter() - t0
    return results, wall_s


def summarize(transport, level, results, wall_s):
    ok = [r for r in results if r["status"] == "ok"]
    timeouts = sum(1 for r in results if r["status"] == "timeout")
    errors = sum(1 for r in results if r["status"].startswith("error") or r["status"] == "empty")
    ttfts = [r["ttft"] for r in ok if r["ttft"] is not None]
    itls = [r["itl"] for r in ok if r["itl"] is not None and not math.isnan(r["itl"])]
    total_tokens = sum(r["tokens"] for r in ok)
    agg_tps = total_tokens / wall_s if wall_s > 0 else float("nan")
    return {
        "transport": transport,
        "level": level,
        "success_rate": 100.0 * len(ok) / level if level else 0.0,
        "timeouts": timeouts,
        "errors": errors,
        "ttft_p50": percentile(ttfts, 50),
        "ttft_p95": percentile(ttfts, 95),
        "itl_p50": percentile(itls, 50),
        "itl_p95": percentile(itls, 95),
        "agg_tps": agg_tps,
        "wall_s": wall_s,
    }


def print_summary_table(rows, transports):
    print("\n## Concurrency summary\n")
    for t in transports:
        trows = [r for r in rows if r["transport"] == t]
        if not trows:
            continue
        print(f"\n### transport={t}\n")
        print("| Concurrency | Success % | TTFT p50 / p95 (ms) | ITL p50 / p95 (ms) | Agg throughput (tok/s) | Timeouts | Errors |")
        print("|---|---|---|---|---|---|---|")
        for r in sorted(trows, key=lambda x: x["level"]):
            print(
                f"| {r['level']} | {r['success_rate']:.1f}% | "
                f"{r['ttft_p50']:.1f} / {r['ttft_p95']:.1f} | "
                f"{r['itl_p50']:.1f} / {r['itl_p95']:.1f} | "
                f"{r['agg_tps']:.1f} | {r['timeouts']} | {r['errors']} |"
            )


async def main_async(args):
    levels = [int(x) for x in args.levels.split(",") if x.strip()]
    transports = ["sse", "ws"] if args.transport == "both" else [args.transport]
    questions = DEFAULT_QUESTIONS

    # warmup nhẹ: vài kết nối đơn cho server nóng máy
    for t in transports:
        for _ in range(args.warmup):
            await one_conn(t, args.base_url, questions[0], args.timeout)

    summaries = []
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["transport", "level", "conn_id", "status", "ttft_ms", "itl_ms", "total_ms", "tokens"])
        for level in levels:
            for t in transports:
                print(f"[{t}] concurrency={level} ... bắn {level} kết nối đồng thời")
                results, wall_s = await run_level(t, args.base_url, level, questions, args.timeout)
                for i, r in enumerate(results):
                    writer.writerow([
                        t, level, i, r["status"],
                        f"{r['ttft']:.3f}" if r["ttft"] is not None else "",
                        f"{r['itl']:.3f}" if r["itl"] is not None and not math.isnan(r["itl"]) else "",
                        f"{r['total']:.3f}" if r["total"] is not None else "",
                        r["tokens"],
                    ])
                s = summarize(t, level, results, wall_s)
                summaries.append(s)
                print(f"    success={s['success_rate']:.1f}% ttft_p95={s['ttft_p95']:.0f}ms "
                      f"agg_tps={s['agg_tps']:.0f} timeouts={s['timeouts']} errors={s['errors']}")

    print_summary_table(summaries, transports)
    print(f"\nCSV thô: {args.out}")


def main():
    p = argparse.ArgumentParser(description="Concurrency benchmark SSE vs WebSocket (rag-service)")
    p.add_argument("--base-url", default="http://localhost:8000")
    p.add_argument("--transport", choices=["sse", "ws", "both"], default="both")
    p.add_argument("--levels", default="1,10,50,100,200", help="các mức concurrency, phân cách phẩy")
    p.add_argument("--timeout", type=float, default=30, help="timeout mỗi kết nối (giây)")
    p.add_argument("--warmup", type=int, default=3)
    p.add_argument("--out", default="benchmarks/results-concurrency.csv")
    args = p.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
