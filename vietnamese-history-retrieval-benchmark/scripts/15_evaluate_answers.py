from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.answer_evaluator import (
    ANSWER_EVALUATION_COLUMNS,
    ANSWER_METRIC_COLUMNS,
    evaluate_answers,
)
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline evaluator for answer correctness and faithfulness.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--questions", default=None, help="Defaults to data/benchmark/silver_questions.csv when present.")
    parser.add_argument("--qrels", default=None, help="Defaults to data/benchmark/silver_qrels.csv when present.")
    parser.add_argument("--chat-results", default=None, help="Defaults to results/rag_chat_results.csv.")
    parser.add_argument("--output", default=None, help="Defaults to results/answer_evaluation.csv.")
    parser.add_argument("--summary", default=None, help="Defaults to results/answer_metrics.csv.")
    parser.add_argument("--include-silver", action="store_true", help="Allow label_quality=silver qrels as preliminary ground truth.")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    results_dir = resolve_path(config, "results_dir")
    questions_path = _resolve_benchmark_path(args.questions, benchmark_dir, "silver_questions.csv", "questions.csv")
    qrels_path = _resolve_benchmark_path(args.qrels, benchmark_dir, "silver_qrels.csv", "qrels.csv")
    chat_results_path = _resolve_results_path(args.chat_results, results_dir, "rag_chat_results.csv")
    output_path = _resolve_results_path(args.output, results_dir, "answer_evaluation.csv")
    summary_path = _resolve_results_path(args.summary, results_dir, "answer_metrics.csv")

    questions = read_csv(questions_path)
    qrels = read_csv(qrels_path)
    chat_results = read_csv(chat_results_path)
    include_silver = args.include_silver or questions_path.name.startswith("silver_") or qrels_path.name.startswith("silver_")

    evaluation, metrics = evaluate_answers(
        questions=questions,
        qrels=qrels,
        chat_results=chat_results,
        include_silver=include_silver,
    )
    write_csv(evaluation.reindex(columns=ANSWER_EVALUATION_COLUMNS), output_path)
    write_csv(metrics.reindex(columns=ANSWER_METRIC_COLUMNS), summary_path)
    logger.info("Wrote answer evaluation to %s", output_path)
    logger.info("Wrote answer metrics to %s", summary_path)


def _resolve_benchmark_path(raw_path: str | None, benchmark_dir: Path, preferred: str, fallback: str) -> Path:
    if raw_path:
        path = Path(raw_path)
        return path if path.is_absolute() else ROOT / path
    preferred_path = benchmark_dir / preferred
    if preferred_path.exists():
        return preferred_path
    return benchmark_dir / fallback


def _resolve_results_path(raw_path: str | None, results_dir: Path, fallback: str) -> Path:
    if raw_path:
        path = Path(raw_path)
        return path if path.is_absolute() else ROOT / path
    return results_dir / fallback


if __name__ == "__main__":
    main()
