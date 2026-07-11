#!/usr/bin/env python3
"""
Harness đo SSE vs WebSocket cho rag-service THẬT (end-to-end, token từ Gemma).

Đo TOÀN BỘ ở phía client — đúng như user cảm nhận, khớp thông lệ benchmark
LLM-serving (TTFT/ITL client-side). Chỉ đếm event `chat.delta` là token (nội
dung câu trả lời), bỏ qua các event điều khiển (created/citations/completed).

Chạy:
  # server rag-service phải đang chạy (uvicorn app.main:app --port 8000)
  python benchmarks/stream_bench.py --transport both --runs 30 --warmup 5 \
      --out benchmarks/results-rag-stream.csv

  # mô phỏng mạng yếu ở CLIENT (xem README: đây là emulation client-side,
  # KHÔNG phải netem/toxiproxy tầng mạng thật):
  python benchmarks/stream_bench.py --transport both --runs 30 \
      --net-delay 30 --jitter 20 --loss 0.01 \
      --out benchmarks/results-rag-stream-weak.csv

Nguồn câu hỏi: mặc định dùng vài câu lịch sử đã ingest (retrieval tốt → token
thật). Ghi đè bằng --questions-file (mỗi dòng 1 câu).

Output CSV: run_id,transport,mode,token_index,recv_ms,conn_setup_ms,bytes
→ nạp vào benchmarks/stream_metrics.py để tính TTFT/ITL/tps/percentile/bytes.
Cột khớp hệt harness testbed Viettel nên dùng chung được script metrics.
"""
import argparse
import asyncio
import json
import os
import random
import time

import httpx
import websockets


DEFAULT_QUESTIONS = [
    "Nhà Trần được thành lập năm nào?",
    "Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?",
    "Vua Lê Lợi khởi nghĩa Lam Sơn chống lại quân nào?",
    "Nhà Nguyễn là triều đại phong kiến cuối cùng của Việt Nam, đúng không?",
    "Quang Trung Nguyễn Huệ đại phá quân Thanh vào dịp nào?",
]


def _parse_data_payload(raw: str):
    """Trả (payload_dict, bytes_on_wire). bytes = độ dài UTF-8 của phần data
    thô (proxy on-wire, không tính framing của transport bên dưới)."""
    try:
        return json.loads(raw), len(raw.encode("utf-8"))
    except Exception:
        return None, len(raw.encode("utf-8"))


async def _apply_client_net_sim(net_delay: float, jitter: float, loss: float) -> bool:
    """Mô phỏng mạng yếu ở phía client. Trả True nếu token bị 'rớt' (drop).

    LƯU Ý: đây là emulation tầng ứng dụng — sleep để giả độ trễ/jitter, random
    để giả mất gói. Không thay thế netem/tc/toxiproxy (mạng thật). Cả SSE và WS
    chịu cùng xử lý này nên so sánh TƯƠNG ĐỐI vẫn công bằng; con số TUYỆT ĐỐI
    dưới 'mạng yếu' nên đọc là emulation (xem README)."""
    if loss > 0 and random.random() < loss:
        return True  # token bị rớt: không ghi nhận → phản ánh content loss
    if net_delay > 0 or jitter > 0:
        extra = net_delay + (random.uniform(0, jitter) if jitter > 0 else 0)
        await asyncio.sleep(extra / 1000.0)
    return False


async def run_sse(base_url, req_json, net):
    """Một run SSE. Trả (rows, conn_setup_ms). rows = [(token_index, recv_ms, bytes)]."""
    url = base_url.rstrip("/") + "/rag/chat/stream"
    rows = []
    t0 = time.perf_counter()
    conn_setup_ms = None
    async with httpx.AsyncClient(timeout=180) as cli:
        async with cli.stream("POST", url, json=req_json) as resp:
            conn_setup_ms = (time.perf_counter() - t0) * 1000.0
            event = None
            idx = 0
            async for line in resp.aiter_lines():
                if line.startswith("event:"):
                    event = line[len("event:"):].strip()
                elif line.startswith("data:"):
                    raw = line[len("data:"):].strip()
                    if event == "chat.delta":
                        dropped = await _apply_client_net_sim(*net)
                        if dropped:
                            continue
                        recv_ms = (time.perf_counter() - t0) * 1000.0
                        _, nbytes = _parse_data_payload(raw)
                        rows.append((idx, recv_ms, nbytes))
                        idx += 1
    return rows, conn_setup_ms


async def run_ws(base_url, req_json, net):
    """Một run WebSocket. Trả (rows, conn_setup_ms)."""
    ws_url = base_url.rstrip("/").replace("http://", "ws://").replace("https://", "wss://") + "/rag/chat/ws"
    rows = []
    t0 = time.perf_counter()
    async with websockets.connect(ws_url, max_size=None) as ws:
        conn_setup_ms = (time.perf_counter() - t0) * 1000.0
        await ws.send(json.dumps(req_json))
        idx = 0
        async for message in ws:
            try:
                frame = json.loads(message)
            except Exception:
                continue
            if frame.get("event") == "chat.delta":
                dropped = await _apply_client_net_sim(*net)
                if dropped:
                    continue
                recv_ms = (time.perf_counter() - t0) * 1000.0
                raw = json.dumps(frame.get("data", {}), ensure_ascii=False)
                nbytes = len(raw.encode("utf-8"))
                rows.append((idx, recv_ms, nbytes))
                idx += 1
            elif frame.get("event") in ("chat.error",):
                break
    return rows, conn_setup_ms


class RpmLimiter:
    """Giới hạn tốc độ request TOÀN CỤC (chung cho SSE lẫn WS) — cần thiết cho
    provider có rate-limit cấp TỔ CHỨC (vd Groq free tier: 30 RPM tính chung mọi
    model/kết nối, không phải theo từng transport). Đảm bảo khoảng cách tối
    thiểu giữa 2 lần BẮT ĐẦU request liên tiếp = 60/rpm giây, nên không bao giờ
    vượt rpm request trong bất kỳ cửa sổ 60s nào."""

    def __init__(self, rpm: float | None):
        self.min_interval = (60.0 / rpm) if rpm else 0.0
        self._last_start = 0.0

    async def wait(self):
        if self.min_interval <= 0:
            return
        now = time.perf_counter()
        elapsed = now - self._last_start
        if elapsed < self.min_interval:
            await asyncio.sleep(self.min_interval - elapsed)
        self._last_start = time.perf_counter()


async def bench_transport(transport, base_url, questions, runs, warmup, mode, net, writer, run_offset, limiter: "RpmLimiter"):
    runner = run_sse if transport == "sse" else run_ws
    print(f"  [{transport}] warmup={warmup} runs={runs} mode={mode} net={net}")
    for i in range(warmup):
        q = questions[i % len(questions)]
        await limiter.wait()
        try:
            await runner(base_url, {"question": q}, (0, 0, 0))  # warmup: không sim net
        except Exception as exc:  # noqa: BLE001
            print(f"  [{transport}] warmup {i} lỗi: {exc}")
    for i in range(runs):
        run_id = run_offset + i
        q = questions[i % len(questions)]
        await limiter.wait()
        try:
            rows, conn_setup = await runner(base_url, {"question": q}, net)
        except Exception as exc:  # noqa: BLE001
            print(f"  [{transport}] run {run_id} lỗi: {exc}")
            continue
        for token_index, recv_ms, nbytes in rows:
            writer.writerow([run_id, transport, mode, token_index, f"{recv_ms:.3f}", f"{conn_setup:.3f}", nbytes])
        if (i + 1) % 10 == 0:
            print(f"  [{transport}] {i + 1}/{runs} runs (last: {len(rows)} tokens)")


async def main_async(args):
    import csv

    if args.questions_file:
        with open(args.questions_file, encoding="utf-8") as f:
            questions = [ln.strip() for ln in f if ln.strip()]
    else:
        questions = DEFAULT_QUESTIONS

    net = (args.net_delay, args.jitter, args.loss)
    transports = ["sse", "ws"] if args.transport == "both" else [args.transport]
    limiter = RpmLimiter(args.rpm_limit)
    if args.rpm_limit:
        print(f"Rate limit: tối đa {args.rpm_limit} request/phút (chung SSE+WS) — "
              f"khoảng cách tối thiểu {60.0/args.rpm_limit:.2f}s/request")

    write_header = not os.path.exists(args.out)
    with open(args.out, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(["run_id", "transport", "mode", "token_index", "recv_ms", "conn_setup_ms", "bytes"])
        for transport in transports:
            await bench_transport(
                transport, args.base_url, questions, args.runs, args.warmup,
                args.mode, net, writer, run_offset=0, limiter=limiter,
            )

    print(f"\nXong. CSV: {args.out}")
    print(f"Phân tích:  python benchmarks/stream_metrics.py {args.out}")


def main():
    p = argparse.ArgumentParser(description="Benchmark SSE vs WebSocket cho rag-service")
    p.add_argument("--base-url", default="http://localhost:8000")
    p.add_argument("--transport", choices=["sse", "ws", "both"], default="both")
    p.add_argument("--runs", type=int, default=30)
    p.add_argument("--warmup", type=int, default=5)
    p.add_argument("--mode", default="real", help="nhãn tự do cho cột mode (vd real, weak)")
    p.add_argument("--questions-file", help="file câu hỏi, mỗi dòng 1 câu (mặc định: bộ câu lịch sử)")
    p.add_argument("--net-delay", type=float, default=0, help="độ trễ mạng giả (ms/token, client-side)")
    p.add_argument("--jitter", type=float, default=0, help="jitter mạng giả (ms, client-side)")
    p.add_argument("--loss", type=float, default=0, help="tỉ lệ mất token giả 0..1 (client-side)")
    p.add_argument("--rpm-limit", type=float, default=None,
                    help="giới hạn request/phút TOÀN CỤC (chung SSE+WS) — dùng cho provider rate-limit "
                         "cấp tổ chức như Groq (free tier 30 RPM); nên đặt thấp hơn limit thật để chừa margin")
    p.add_argument("--out", default="benchmarks/results-rag-stream.csv")
    args = p.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
