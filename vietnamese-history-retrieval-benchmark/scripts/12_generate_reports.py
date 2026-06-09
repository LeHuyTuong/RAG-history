from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.evaluation.reporting import latex_metrics_table, write_error_analysis, write_method_comparison
from src.utils.io import load_config, read_csv, resolve_path
from src.utils.logging import setup_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate method comparison and result table artifacts.")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    logger = setup_logging()
    config = load_config(args.config)
    results_dir = resolve_path(config, "results_dir")
    reports_dir = ROOT / "reports"
    metrics = read_csv(results_dir / "metrics.csv")
    per_query = read_csv(results_dir / "per_query_analysis.csv")

    write_method_comparison(metrics, per_query, results_dir / "method_comparison.md")
    write_error_analysis(per_query, results_dir / "error_analysis.md")
    latex_metrics_table(metrics, reports_dir / "result_tables_for_latex.md")
    logger.info("Generated comparison, error analysis, and LaTeX result table artifacts.")


if __name__ == "__main__":
    main()
