# Pilot Evaluation Methodology

## Corpus Description

TBD after the 15 Vietnamese history PDFs are placed in `data/raw_pdfs/` and `scripts/01_inventory_pdfs.py` plus `scripts/02_extract_pdf_pages.py` are run.

This dataset is a small pilot evaluation corpus, not a large benchmark. All corpus statistics must be computed from the local PDFs.

## PDF Extraction Method

Text is extracted page by page with PyMuPDF. Each PDF receives a stable document ID (`D001`, `D002`, ...), and each page receives a stable page ID such as `D001_P0001`. The pipeline writes:

- `data/extracted/documents.csv`
- `data/extracted/pages.csv`
- `data/extracted/extraction_report.csv`

The pipeline logs extraction failures and preserves page metadata. It does not silently skip failed PDFs.

## OCR Policy

OCR is page-level, not document-level. Selectable text is kept when it appears clean. OCR is considered when a page has empty text, very short text, broken characters, missing Vietnamese diacritics, or an extraction failure.

The OCR report is written to `data/extracted/ocr_report.csv`. Tesseract and PaddleOCR are optional backends. Low-confidence OCR is flagged for manual review.

## Chunking Strategy

The default strategy is page-aware chunking with approximately 500 words per chunk and configurable overlap for long pages. Chunks preserve:

- source document ID
- source page ID
- page start and page end
- extraction method
- detected years
- basic entity candidates

Chunks are written to `data/extracted/chunks.csv`.

## Question Set Design

The pipeline generates unverified candidate questions from chunks using dates, entity-like strings, event terms, and policy terms. Candidate questions are written to `data/benchmark/question_generation_candidates.csv`.

The final pilot set should contain 30-50 manually reviewed questions, including multiple question types and at least 5 no-answer questions if feasible.

## Manual Labeling Process

Final labels must be manually verified in `data/benchmark/qrels.csv`. Automatically generated candidate rows must remain `verified=false` until checked by a human labeler.

Relevant evidence uses `relevance=1`. Inspected but irrelevant evidence uses `relevance=0`. No-answer questions use `relevance=NONE` after confirming no sufficient evidence exists.

## Baselines

The planned baselines are:

- BM25 lexical retrieval.
- BGE-M3 dense retrieval.
- multilingual-E5 dense retrieval.
- Hybrid BM25 + BGE-M3.
- Optional Hybrid BM25 + multilingual-E5.
- Optional Page-aware Hybrid Temporal Entity RAG-lite.

No method should be claimed to outperform another until `results/metrics.csv` is computed from verified qrels.

## Metrics

The evaluation computes:

- Recall@5
- Recall@10
- MRR@10
- Evidence Hit Rate@5
- Citation Accuracy@5
- No-answer Accuracy, if verified no-answer questions exist

## Limitations

This is a small pilot dataset built from 15 local PDFs. Results should be reported as pilot evidence only. They should not be generalized to all Vietnamese historical retrieval tasks without a larger corpus and independently validated question set.
