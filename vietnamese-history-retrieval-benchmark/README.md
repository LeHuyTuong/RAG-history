# Vietnamese History Retrieval Benchmark Pilot

This repository builds a reproducible pilot evaluation for Vietnamese historical document retrieval from 15 local PDFs.

The research question is:

> Does hybrid retrieval improve evidence retrieval for Vietnamese historical documents compared with lexical-only and dense-only baselines?

No results are included by default. Scores must be computed locally from your PDFs and manually verified qrels.

## Structure

```text
data/raw_pdfs/        Put the 15 PDFs here.
data/extracted/       Page text, OCR reports, chunks, and extraction reports.
data/benchmark/       Candidate questions, final questions, qrels, and labeling guide.
indexes/              BM25 and FAISS indexes.
results/              Retrieval outputs, metrics, comparison, and error analysis.
reports/              Methodology and paper-ready experiment templates.
scripts/              Numbered runnable pipeline scripts.
src/                  Reusable processing, retrieval, and evaluation modules.
```

## Install

Use Python 3.10+.

```bash
pip install -r requirements.txt
```

Optional packages:

- `underthesea` or `pyvi` for Vietnamese tokenization.
- `FlagEmbedding` for native BGE-M3 encoding.
- `pytesseract` plus the Tesseract binary and Vietnamese language data for OCR.
- `paddleocr` for PaddleOCR.

## Add PDFs

Place exactly 15 PDFs in:

```text
data/raw_pdfs/
```

If you have a ZIP archive, extract the PDFs into `data/raw_pdfs/` first. The raw PDFs and ZIP files are ignored by git so the benchmark code stays lightweight.

Document IDs are assigned by sorted filename order:

```text
D001, D002, ..., D015
```

Keep filenames stable once labeling starts, otherwise document IDs may change.

## Run Pipeline

From this directory:

```bash
python scripts/01_inventory_pdfs.py
python scripts/02_extract_pdf_pages.py
python scripts/03_detect_ocr_need.py
python scripts/04_ocr_scanned_pages.py
python scripts/05_chunk_pages.py
python scripts/06_generate_question_candidates.py
python scripts/07_prepare_manual_qrels_template.py
```

Inspect:

```text
data/extracted/extraction_report.csv
data/extracted/ocr_report.csv
data/extracted/pages.csv
data/extracted/chunks.csv
```

## Manual Labeling

Read:

```text
data/benchmark/labeling_guide.md
```

Then manually finalize:

```text
data/benchmark/questions.csv
data/benchmark/qrels.csv
```

Rules:

- Candidate questions are suggestions only.
- Automatically generated qrels must remain `verified=false` until checked.
- Use `relevance=1` only for manually verified evidence.
- Use `relevance=NONE` for verified no-answer questions.
- Recommended size: 30-50 final questions.
- Include at least 5 no-answer questions if feasible.

## Build Indexes

After manual labeling is ready and chunks exist:

```bash
python scripts/08_build_bm25_index.py
python scripts/09_build_dense_indexes.py
```

Dense index building may download model weights from Hugging Face on first run.

## Run Retrieval

```bash
python scripts/10_run_retrieval.py --method all
```

By default, `all` runs:

- BM25
- BGE-M3
- multilingual-E5
- Hybrid BM25 + BGE-M3

Optional methods:

```bash
python scripts/10_run_retrieval.py --method all --include-hybrid-e5
python scripts/10_run_retrieval.py --method all --include-temporal-rag-lite
```

Retrieval results are written to:

```text
results/retrieval_results.csv
```

## Evaluate

```bash
python scripts/11_evaluate_retrieval.py
python scripts/12_generate_reports.py
```

Generated outputs:

```text
results/metrics.csv
results/per_query_analysis.csv
results/error_analysis.md
results/method_comparison.md
reports/result_tables_for_latex.md
```

If qrels are not manually verified, metrics remain empty/TBD.

## Metrics

The evaluator reports:

- Recall@5
- Recall@10
- MRR@10
- Evidence Hit Rate@5
- Citation Accuracy@5
- No-answer Accuracy, if verified no-answer questions exist

No method should be described as better until `results/metrics.csv` has computed scores.

## Update The Paper

Use:

```text
reports/paper_experiment_section.md
reports/result_tables_for_latex.md
results/method_comparison.md
```

Replace all TBD values only with computed values from `results/metrics.csv`. If Hybrid BM25 + BGE-M3 wins, describe it as outperforming other methods on this pilot set only.

## Configuration

Edit `config.yaml` for:

- PDF and output paths.
- Chunk size and overlap.
- Retrieval top-k values.
- Hybrid score weights.
- Dense model names.
- OCR backend and thresholds.
- No-answer score threshold.

The default hybrid formula is:

```text
final_score = 0.5 * normalized_dense_score + 0.5 * normalized_bm25_score
```

Set `hybrid_fusion: rrf` to use Reciprocal Rank Fusion.
