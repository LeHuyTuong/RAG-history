# Manual Audit Instructions

Audit `data/benchmark/manual_audit_sample.csv` before relying on the preliminary evaluation.

1. Open each row and read the question plus expected answer.
2. Open the silver evidence chunk/page in the original PDF or `chunks.csv`.
3. Mark `audit_decision=accept` only if the chunk directly supports the answer.
4. Mark `audit_decision=edit_question` if the question is useful but vague or noisy.
5. Mark `audit_decision=reject` if the answer is unsupported, too generic, or caused by OCR/extraction noise.
6. For no-answer rows, search the corpus before accepting `relevance=NONE`.
7. Add a concise `human_note` explaining the decision.

After audit, copy accepted rows into final `questions.csv` and `qrels.csv`, then set `verified=true` only for rows you manually checked.
