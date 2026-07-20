#!/usr/bin/env bash
# Chạy full benchmark Groq: healthy + weak-network, rate-limit an toàn dưới
# 30 RPM free tier của Groq (dùng 24 RPM để chừa margin).
set -euo pipefail
cd "$(dirname "$0")/.."

RPM=24
RUNS=20
WARMUP=3

echo "=== [1/2] Healthy network — $(date) ==="
.venv/bin/python benchmarks/stream_bench.py --transport both --runs "$RUNS" --warmup "$WARMUP" \
    --mode groq-healthy --rpm-limit "$RPM" \
    --out benchmarks/results-rag-groq-full-healthy.csv

echo ""
echo "=== [2/2] Weak network (client-side sim: delay=30ms jitter=20ms loss=0.01) — $(date) ==="
.venv/bin/python benchmarks/stream_bench.py --transport both --runs "$RUNS" --warmup "$WARMUP" \
    --mode groq-weak --rpm-limit "$RPM" \
    --net-delay 30 --jitter 20 --loss 0.01 \
    --out benchmarks/results-rag-groq-full-weak.csv

echo ""
echo "=== ALL GROQ FULL BENCH DONE: $(date) ==="
