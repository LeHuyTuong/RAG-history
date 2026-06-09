from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.utils.io import ensure_dir


def write_method_comparison(metrics: pd.DataFrame, per_query: pd.DataFrame, output_path: str | Path) -> None:
    output_path = Path(output_path)
    ensure_dir(output_path.parent)
    if metrics.empty:
        output_path.write_text(
            "# Method Comparison\n\n"
            "TBD. No computed metrics are available yet.\n\n"
            "Run `python scripts/11_evaluate_retrieval.py` after manually verified `qrels.csv` exists.\n",
            encoding="utf-8",
        )
        return

    display = metrics.copy()
    metric_cols = [
        "recall_at_5",
        "recall_at_10",
        "mrr_at_10",
        "evidence_hit_rate_at_5",
        "citation_accuracy_at_5",
        "no_answer_accuracy",
    ]
    for column in metric_cols:
        display[column] = pd.to_numeric(display[column], errors="coerce")

    best_lines = []
    for column in metric_cols:
        non_null = display.dropna(subset=[column])
        if non_null.empty:
            best_lines.append(f"- `{column}`: TBD")
            continue
        best_value = non_null[column].max()
        winners = non_null.loc[non_null[column] == best_value, "method"].tolist()
        best_lines.append(f"- `{column}`: {', '.join(winners)} ({best_value:.4f})")

    hybrid_note = ""
    hybrid_rows = display[display["method"].astype(str).str.contains("hybrid", case=False, na=False)]
    if not hybrid_rows.empty:
        hybrid_note = (
            "\nHybrid methods should be interpreted only for this pilot set. "
            "Do not claim general superiority without larger evaluation.\n"
        )

    error_summary = "TBD"
    if not per_query.empty and "error_type" in per_query.columns:
        counts = per_query["error_type"].value_counts().to_dict()
        error_summary = "\n".join(f"- {key}: {value}" for key, value in counts.items())

    output_path.write_text(
        "# Method Comparison\n\n"
        "Scores below are computed from `results/metrics.csv` using manually verified qrels.\n\n"
        + display.to_markdown(index=False)
        + "\n\n## Best Method By Metric\n\n"
        + "\n".join(best_lines)
        + hybrid_note
        + "\n## Qualitative Error Summary\n\n"
        + error_summary
        + "\n",
        encoding="utf-8",
    )


def write_error_analysis(per_query: pd.DataFrame, output_path: str | Path) -> None:
    output_path = Path(output_path)
    ensure_dir(output_path.parent)
    if per_query.empty:
        output_path.write_text(
            "# Error Analysis\n\nTBD. No per-query analysis is available yet.\n",
            encoding="utf-8",
        )
        return
    counts = per_query["error_type"].value_counts().reset_index()
    counts.columns = ["error_type", "count"]
    output_path.write_text(
        "# Error Analysis\n\n"
        "This summary is generated from `results/per_query_analysis.csv`.\n\n"
        + counts.to_markdown(index=False)
        + "\n\nReview failed queries manually before drawing conclusions.\n",
        encoding="utf-8",
    )


def latex_metrics_table(metrics: pd.DataFrame, output_path: str | Path) -> None:
    output_path = Path(output_path)
    ensure_dir(output_path.parent)
    if metrics.empty:
        output_path.write_text(
            "% TBD: run evaluation after manually verified qrels.csv is available.\n",
            encoding="utf-8",
        )
        return
    output_path.write_text(metrics.to_latex(index=False, float_format="%.4f"), encoding="utf-8")
