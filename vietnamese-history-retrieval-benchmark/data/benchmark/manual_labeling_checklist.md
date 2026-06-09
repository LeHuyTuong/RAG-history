# Manual Labeling Checklist

Use `data/benchmark/labeling_workbook.csv` as the review surface. It is not ground truth.

## Choose 30-50 Final Questions

- Start from rows where `evidence_text` is readable and specific.
- Prefer questions spread across many PDFs.
- Avoid keeping many near-duplicate questions about the same year, person, or page.
- Set `keep_for_benchmark=true` only after you decide a row belongs in the final pilot set.
- Keep at least several question types represented. Include no-answer questions only after manually checking the corpus.

## Rewrite Vague Questions

- Replace generic wording such as "Tài liệu mô tả sự kiện gì..." with a concrete entity, year, event, policy, or period from the evidence.
- The final question should be answerable from the cited chunk/page, not from general historical knowledge.
- If `suggested_rewritten_question` is still vague, write your own final version.

## Verify Evidence

- Read `evidence_text` and `evidence_text_short`.
- Open the original PDF page when the page has OCR warnings, very short text, missing text, or suspicious characters.
- Confirm that `doc_id`, `page_id`, `page_number`, and `chunk_id` point to evidence that directly supports the question.
- If the chunk only mentions the right word but does not answer the question, keep `relevance=0`.

## Set Relevance

- Use `relevance=1` only when the chunk/page contains sufficient evidence.
- Use `relevance=0` when inspected evidence is not sufficient.
- Set `verified=true` only after manual inspection.
- Fill `labeler` with your name or initials for every verified row.

## No-Answer Questions

- Replace placeholder no-answer questions with real questions that should not have supporting evidence in the 15 PDFs.
- Search the extracted chunks and inspect likely PDFs before deciding.
- For verified no-answer rows, use `relevance=NONE`, leave evidence IDs blank, and set `verified=true`.
- Do not use `NONE` simply because the automatic candidate lacks evidence.

## Avoid Auto-Ground-Truth Leakage

- Candidate questions and template qrels are automatically generated suggestions.
- Do not treat `proposed_answer` as final; it is only a short extract from the candidate evidence when obvious.
- Do not evaluate retrieval until final `questions.csv` and `qrels.csv` contain manually verified labels.
