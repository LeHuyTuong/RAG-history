from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.metrics import METRIC_COLUMNS, PER_QUERY_COLUMNS, evaluate_retrieval
from src.evaluation.qrels import verified_qrels
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate retrieval results against manually verified qrels.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--questions", default=None, help="Path to questions CSV. Defaults to data/benchmark/questions.csv.")
    parser.add_argument("--qrels", default=None, help="Path to qrels CSV. Defaults to data/benchmark/qrels.csv.")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    results_dir = resolve_path(config, "results_dir")
    questions_path = Path(args.questions) if args.questions else benchmark_dir / "questions.csv"
    qrels_path = Path(args.qrels) if args.qrels else benchmark_dir / "qrels.csv"
    if not questions_path.is_absolute():
        questions_path = ROOT / questions_path
    if not qrels_path.is_absolute():
        qrels_path = ROOT / qrels_path
    questions = read_csv(questions_path)
    qrels = read_csv(qrels_path)
    retrieval_results = read_csv(results_dir / "retrieval_results.csv")

    if questions.empty:
        raise SystemExit("No questions found in data/benchmark/questions.csv.")
    include_silver = "label_quality" in qrels.columns and qrels["label_quality"].astype(str).str.lower().eq("silver").any()
    if verified_qrels(qrels).empty:
        if include_silver:
            logger.warning("No human-verified qrels found. Evaluating silver_qrels as preliminary metrics.")
        else:
            logger.warning("No verified qrels found. Writing empty metrics with headers; results remain TBD.")
    metrics, per_query = evaluate_retrieval(
        questions=questions,
        qrels=qrels,
        retrieval_results=retrieval_results,
        no_answer_threshold=float(config.get("no_answer_threshold", 0.2)),
        include_silver=include_silver,
    )
    write_csv(metrics if not metrics.empty else metrics.reindex(columns=METRIC_COLUMNS), results_dir / "metrics.csv")
    write_csv(
        per_query if not per_query.empty else per_query.reindex(columns=PER_QUERY_COLUMNS),
        results_dir / "per_query_analysis.csv",
    )
    logger.info("Wrote metrics for %s methods.", len(metrics))


if __name__ == "__main__":
    main()
