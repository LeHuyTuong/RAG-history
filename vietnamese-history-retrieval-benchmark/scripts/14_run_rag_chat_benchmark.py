from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


CHAT_RESULT_COLUMNS = [
    "qid",
    "question",
    "actual_answer",
    "citations",
    "citation_count",
    "used_vector",
    "used_graph",
    "latency_ms",
    "status",
    "error",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Call local rag-service /rag/chat for benchmark questions.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--questions", default=None, help="Defaults to data/benchmark/silver_questions.csv when present.")
    parser.add_argument("--rag-url", default="http://localhost:8001")
    parser.add_argument("--output", default=None, help="Defaults to results/rag_chat_results.csv.")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--timeout", type=float, default=60.0)
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    results_dir = resolve_path(config, "results_dir")
    questions_path = _resolve_questions_path(args.questions, benchmark_dir)
    output_path = Path(args.output) if args.output else results_dir / "rag_chat_results.csv"
    if not output_path.is_absolute():
        output_path = ROOT / output_path

    questions = read_csv(questions_path)
    if questions.empty:
        raise SystemExit(f"No questions found: {questions_path}")
    if args.limit:
        questions = questions.head(args.limit)

    rows = []
    endpoint = args.rag_url.rstrip("/") + "/rag/chat"
    for question in questions.to_dict("records"):
        qid = str(question["qid"])
        query = str(question["question"])
        logger.info("Calling RAG qid=%s", qid)
        rows.append(_call_chat(endpoint, qid, query, args.top_k, args.temperature, args.timeout))

    output = pd.DataFrame(rows, columns=CHAT_RESULT_COLUMNS)
    write_csv(output, output_path)
    logger.info("Wrote %s chat rows to %s", len(output), output_path)


def _resolve_questions_path(raw_path: str | None, benchmark_dir: Path) -> Path:
    if raw_path:
        path = Path(raw_path)
        return path if path.is_absolute() else ROOT / path
    silver_path = benchmark_dir / "silver_questions.csv"
    if silver_path.exists():
        return silver_path
    return benchmark_dir / "questions.csv"


def _call_chat(
    endpoint: str,
    qid: str,
    question: str,
    top_k: int,
    temperature: float,
    timeout: float,
) -> dict:
    started = time.perf_counter()
    payload = {
        "question": question,
        "topK": top_k,
        "temperature": temperature,
    }
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        citations = data.get("citations", [])
        status = "ok"
        error = ""
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        data = {}
        citations = []
        status = "error"
        error = str(exc)

    latency_ms = int((time.perf_counter() - started) * 1000)
    return {
        "qid": qid,
        "question": question,
        "actual_answer": str(data.get("answer", "")),
        "citations": json.dumps(citations, ensure_ascii=False),
        "citation_count": len(citations),
        "used_vector": str(bool(data.get("usedVector", False))).lower(),
        "used_graph": str(bool(data.get("usedGraph", False))).lower(),
        "latency_ms": latency_ms,
        "status": status,
        "error": error,
    }


if __name__ == "__main__":
    main()
