from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.question_generation import CANDIDATE_COLUMNS, prepare_manual_templates
from src.evaluation.qrels import verified_qrels
from src.utils.io import load_config, read_csv, resolve_path, write_csv
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare manually editable questions.csv and qrels.csv templates.")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--max-questions", type=int, default=50)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    benchmark_dir = resolve_path(config, "benchmark_dir")
    candidates = read_csv(benchmark_dir / "question_generation_candidates.csv", CANDIDATE_COLUMNS)
    if candidates.empty:
        raise SystemExit("No candidates found. Run scripts/06_generate_question_candidates.py first.")

    existing_questions = read_csv(benchmark_dir / "questions.csv")
    existing_qrels = read_csv(benchmark_dir / "qrels.csv")
    if not args.overwrite and (not existing_questions.empty or not existing_qrels.empty):
        verified = len(verified_qrels(existing_qrels)) if not existing_qrels.empty else 0
        raise SystemExit(
            "questions.csv or qrels.csv already contains rows. "
            f"Refusing to overwrite {verified} verified qrels. Use --overwrite only if intentional."
        )

    questions, qrels = prepare_manual_templates(candidates, max_questions=args.max_questions)
    write_csv(questions, benchmark_dir / "questions.csv")
    write_csv(qrels, benchmark_dir / "qrels.csv")
    logger.info("Wrote manual templates: %s questions, %s qrel rows. All labels are verified=false.", len(questions), len(qrels))


if __name__ == "__main__":
    main()
