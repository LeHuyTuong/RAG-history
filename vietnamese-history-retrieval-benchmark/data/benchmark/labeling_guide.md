# Manual Labeling Guide

This pilot benchmark uses generated question candidates only as suggestions. Do not treat candidate questions or candidate evidence rows as ground truth until a human labeler verifies them.

## Target Size

- Minimum: 30 final questions.
- Preferred: 40-50 final questions.
- Include at least 5 no-answer questions if possible.
- Spread questions across multiple PDFs. Avoid selecting most questions from one document.

## Files To Edit

- `data/benchmark/questions.csv`: final question list.
- `data/benchmark/qrels.csv`: manually verified evidence labels.
- `data/benchmark/question_generation_candidates.csv`: suggestions only.
- `data/extracted/chunks.csv`: source chunks to inspect.
- `data/extracted/pages.csv`: page text and quality flags.
- `data/extracted/ocr_report.csv`: OCR decisions and warnings.

## Question Selection Rules

Choose questions that can be answered from explicit evidence in the PDFs, except for no-answer questions. Prefer questions that require retrieval of a page or chunk, not questions answerable from common knowledge alone.

Use the allowed `question_type` values:

- `fact_date`
- `person_entity`
- `event`
- `timeline`
- `cause_effect`
- `policy_concept`
- `multi_hop`
- `citation_grounded`
- `no_answer`

Use `difficulty` consistently:

- `easy`: one clear evidence chunk/page.
- `medium`: evidence is clear but wording may vary.
- `hard`: multi-sentence, multi-page, or multi-hop evidence.

## Qrels Rules

Each answerable question should have at least one verified relevant evidence row:

- `relevance=1`: the chunk/page contains sufficient evidence for the question.
- `relevance=0`: inspected but not relevant.
- `verified=true`: a human checked the row.

For no-answer questions:

- Add one qrels row with `relevance=NONE`.
- Leave `chunk_id`, `doc_id`, `page_id`, and `page_number` blank.
- Set `verified=true` only after checking that no sufficient evidence exists in the 15 PDFs.

Do not set `verified=true` for automatically generated rows unless you have manually checked the source text.

## Evidence Standard

A relevant chunk/page should directly support the answer or citation. If the retrieved chunk mentions the right person/year but does not answer the question, label it `0`.

For citation-grounded questions, page correctness matters. Confirm that `page_number` points to the page where the evidence is visible in the extracted text or the original PDF.

## OCR And Quality Flags

When a candidate comes from a page marked `ocr_needed`, `low_ocr_confidence`, `manual_review`, or `extraction_failed`, inspect the original PDF page before verifying the qrel.

If OCR noise changes names, dates, or event terms, write that in `evidence_note`. This helps later error analysis.

## Recommended Workflow

1. Open `question_generation_candidates.csv`.
2. Select a balanced set of 30-50 candidates and rewrite unclear questions.
3. Add or edit rows in `questions.csv`.
4. Inspect `chunks.csv`, `pages.csv`, and original PDFs for each question.
5. Fill `qrels.csv`.
6. Set `verified=true` only for checked labels.
7. Run retrieval and evaluation scripts.

The final benchmark remains a pilot set. Do not describe it as a large public benchmark.
