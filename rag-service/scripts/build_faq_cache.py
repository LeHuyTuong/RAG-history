#!/usr/bin/env python3
"""
Build FAQ JSON cache từ dataset JSONL: ghi ra faq_cache.json (~1-2MB, ~1144 cặp Q→A)
để faq_cache_service dùng lookup (exact + fuzzy) mà không cần embed / Qdrant / LLM.

Tái dùng iter_qa(), normalize_question() từ load_faq_dataset.py để đảm bảo dedup giống hệt
tầng FAQ đã nạp vào Qdrant. Output là list [{"q": "...", "a": "..."}, ...].

Cách chạy:
  .venv/bin/python scripts/build_faq_cache.py
  .venv/bin/python scripts/build_faq_cache.py --limit 100 --out data/faq_cache_test.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from load_faq_dataset import (  # noqa: E402
    DEFAULT_JSONL,
    download_jsonl,
    iter_qa,
    normalize_question,
)

DEFAULT_OUT = RAG_SERVICE_DIR / "data" / "faq_cache.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Tạo FAQ cache JSON cho faq_cache_service.")
    parser.add_argument("--jsonl-path", default=str(DEFAULT_JSONL),
                        help="đường dẫn JSONL cục bộ (tự tải nếu chưa có).")
    parser.add_argument("--out", default=str(DEFAULT_OUT),
                        help=f"đường dẫn output JSON (mặc định: {DEFAULT_OUT}).")
    parser.add_argument("--min-answer-chars", type=int, default=40,
                        help="bỏ cặp có câu trả lời ngắn hơn ngần này (mặc định 40).")
    parser.add_argument("--limit", type=int, default=None,
                        help="giới hạn số cặp Q&A (sau dedup). Bỏ trống = tất cả.")
    parser.add_argument("--no-dedup", action="store_true",
                        help="KHÔNG khử trùng lặp câu hỏi (mặc định có dedup).")
    args = parser.parse_args()

    jsonl_path = Path(args.jsonl_path)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    dedup = not args.no_dedup

    print(f"JSONL       : {jsonl_path}")
    print(f"Output      : {out_path}")
    print(f"min-answer  : {args.min_answer_chars} chars")
    print(f"dedup       : {'có' if dedup else 'không'}")
    print(f"limit       : {args.limit if args.limit else 'tất cả'} cặp")

    if not jsonl_path.is_file():
        print("\nJSONL chưa có cục bộ — đang tải...")
        download_jsonl(jsonl_path)

    entries: list[dict[str, str]] = []
    seen: dict[str, None] = {}
    n_total = 0
    n_skipped_short = 0
    n_dupes = 0

    for q, a in iter_qa(jsonl_path, args.min_answer_chars, dedup, args.limit):
        if not dedup:
            key = normalize_question(q)
            if key in seen:
                n_dupes += 1
                continue
            seen[key] = None
        entries.append({"q": q, "a": a})
        n_total += 1

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = out_path.stat().st_size / 1024
    print(f"\nDone: {n_total} cặp Q→A → {out_path} ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
