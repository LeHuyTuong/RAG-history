#!/usr/bin/env python3
"""Đọc CSV từ stream_bench.py → tính TTFT / inter-token latency (ITL) /
tokens-per-giây / connection-setup / bytes-per-token, percentile p50/p95/p99
qua nhiều run → in bảng Markdown SSE | WebSocket.

Không cần numpy — percentile tự viết bằng linear interpolation (giống công
thức mặc định của numpy.percentile) để script không có dependency ngoài.

    python benchmarks/stream_metrics.py results-rag-stream.csv
    # so mạng healthy vs weak (content loss):
    python benchmarks/stream_metrics.py results-rag-stream.csv results-rag-stream-weak.csv
"""
import csv
import math
import sys
from collections import defaultdict


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


def load_runs(path):
    """(transport, mode, run_id) -> list (token_index, recv_ms, bytes), + conn_setup_ms."""
    tokens = defaultdict(list)
    conn_setup = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row["transport"], row["mode"], int(row["run_id"]))
            raw_bytes = row.get("bytes")
            b = float(raw_bytes) if raw_bytes not in (None, "") else None
            tokens[key].append((int(row["token_index"]), float(row["recv_ms"]), b))
            conn_setup[key] = float(row["conn_setup_ms"])
    return tokens, conn_setup


def compute_run_metrics(tokens, conn_setup):
    out = {}
    for key, rows in tokens.items():
        rows = sorted(rows)
        recv = [r for _, r, _ in rows]
        byte_vals = [b for _, _, b in rows if b is not None]
        n = len(recv)
        if n == 0:
            continue
        ttft = recv[0]
        itl = (recv[-1] - recv[0]) / (n - 1) if n > 1 else float("nan")
        tps = n / (recv[-1] / 1000) if recv[-1] > 0 else float("nan")
        bytes_per_token = (sum(byte_vals) / len(byte_vals)) if byte_vals else float("nan")
        out[key] = {
            "ttft": ttft,
            "itl": itl,
            "tps": tps,
            "conn_setup": conn_setup[key],
            "bytes_per_token": bytes_per_token,
            "token_count": float(n),
        }
    return out


def aggregate(run_metrics):
    agg = defaultdict(lambda: defaultdict(list))
    for (transport, mode, _run_id), m in run_metrics.items():
        for metric, value in m.items():
            if not math.isnan(value):
                agg[(transport, mode)][metric].append(value)
    return agg


def print_table(agg, mode, transports=("sse", "ws")):
    labels = {"ttft": "TTFT (ms)", "itl": "Inter-token latency (ms/token)",
              "tps": "Output throughput (tokens/s)", "conn_setup": "Connection setup (ms)",
              "bytes_per_token": "Bytes/token (on-wire, client-observed)",
              "token_count": "Tokens received by client (count)"}
    header = ["Metric"] + [t.upper() for t in transports]
    print(f"\n### mode={mode}\n")
    print("| " + " | ".join(header) + " |")
    print("|" + "---|" * len(header))
    for metric in ("conn_setup", "ttft", "itl", "tps", "bytes_per_token", "token_count"):
        cells = []
        for t in transports:
            values = agg.get((t, mode), {}).get(metric, [])
            if not values:
                cells.append("—")
            else:
                p50 = percentile(values, 50)
                p95 = percentile(values, 95)
                cells.append(f"p50={p50:.2f} / p95={p95:.2f}")
        print(f"| {labels[metric]} | " + " | ".join(cells) + " |")


def print_content_loss(healthy_agg, weak_agg, transports=("sse", "ws")):
    """So % nội dung AI bị mất (token client không nhận được) giữa mạng healthy
    và weak, riêng từng transport — để dữ liệu tự trả lời, không giả định SSE
    hay WS chịu mất gói tốt hơn."""
    modes = sorted({mode for (_t, mode) in healthy_agg.keys()} | {mode for (_t, mode) in weak_agg.keys()})
    print("\n### Content loss under weak network (tokens received: healthy vs weak, per transport)\n")
    header = ["Mode"] + [f"{t.upper()} healthy p50" for t in transports] + \
             [f"{t.upper()} weak p50" for t in transports] + [f"{t.upper()} content lost" for t in transports]
    print("| " + " | ".join(header) + " |")
    print("|" + "---|" * len(header))
    for mode in modes:
        row = [mode]
        losses = []
        for t in transports:
            h = healthy_agg.get((t, mode), {}).get("token_count", [])
            row.append(f"{percentile(h, 50):.1f}" if h else "—")
        for t in transports:
            w = weak_agg.get((t, mode), {}).get("token_count", [])
            row.append(f"{percentile(w, 50):.1f}" if w else "—")
        for t in transports:
            h = healthy_agg.get((t, mode), {}).get("token_count", [])
            w = weak_agg.get((t, mode), {}).get("token_count", [])
            if h and w:
                h50, w50 = percentile(h, 50), percentile(w, 50)
                pct = (h50 - w50) / h50 * 100 if h50 else float("nan")
                losses.append(f"{pct:+.1f}%")
            else:
                losses.append("—")
        row.extend(losses)
        print("| " + " | ".join(row) + " |")


def main():
    if len(sys.argv) < 2:
        print("usage: stream_metrics.py <results.csv> [weak-network-counterpart.csv]")
        raise SystemExit(1)
    tokens, conn_setup = load_runs(sys.argv[1])
    run_metrics = compute_run_metrics(tokens, conn_setup)
    agg = aggregate(run_metrics)

    modes = sorted({mode for (_t, mode) in agg.keys()})
    for mode in modes:
        print_table(agg, mode)

    if len(sys.argv) >= 3:
        weak_tokens, weak_conn_setup = load_runs(sys.argv[2])
        weak_run_metrics = compute_run_metrics(weak_tokens, weak_conn_setup)
        weak_agg = aggregate(weak_run_metrics)
        print_content_loss(agg, weak_agg)


if __name__ == "__main__":
    main()
