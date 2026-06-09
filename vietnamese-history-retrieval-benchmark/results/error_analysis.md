# Error Analysis

This analysis is based on silver_qrels from an LLM-assisted labeling process. It is suitable for pilot debugging, not final claims.

## Error Counts

| error_type          |   count |
|:--------------------|--------:|
| no_error            |      55 |
| semantic_mismatch   |      36 |
| missed_exact_date   |      13 |
| missed_named_entity |       8 |
| no_answer_failed    |       6 |
| chunking_error      |       1 |
| wrong_page          |       1 |

## Error Counts By Method

| method    | error_type          |   count |
|:----------|:--------------------|--------:|
| bm25      | missed_exact_date   |       3 |
| bm25      | missed_named_entity |       1 |
| bm25      | no_answer_failed    |       2 |
| bm25      | no_error            |      26 |
| bm25      | semantic_mismatch   |       8 |
| e5        | chunking_error      |       1 |
| e5        | missed_exact_date   |       6 |
| e5        | missed_named_entity |       5 |
| e5        | no_answer_failed    |       2 |
| e5        | no_error            |       6 |
| e5        | semantic_mismatch   |      19 |
| e5        | wrong_page          |       1 |
| hybrid_e5 | missed_exact_date   |       4 |
| hybrid_e5 | missed_named_entity |       2 |
| hybrid_e5 | no_answer_failed    |       2 |
| hybrid_e5 | no_error            |      23 |
| hybrid_e5 | semantic_mismatch   |       9 |

## Observations

- Missed date/year questions usually occur when OCR/extraction noise, noisy years, or page/chunk context weakens lexical matching.
- Missed named-entity questions often involve imperfect entity extraction from Vietnamese PDF text.
- Semantic mismatch is common for dense retrieval when the generated question is broader than the silver evidence sentence.
- OCR/extraction noise remains a corpus limitation because D003 and D007 have no usable extracted text without OCR.
- Chunking errors should be manually audited where the expected page appears but the silver chunk does not directly answer the question.
- In this run, BM25 is stronger than E5 on the silver labels; Hybrid BM25+E5 recovers some lexical evidence but does not exceed BM25 on primary metrics.

## Example Error Cases

- `SQ0001` / `bm25` / `fact_date`: missed_exact_date | Năm 800, tài liệu mô tả sự kiện hoặc diễn biến nào liên quan đến Văn Lang?
- `SQ0002` / `bm25` / `fact_date`: missed_exact_date | Năm 350, tài liệu mô tả sự kiện hoặc diễn biến nào liên quan đến Văn Lang?
- `SQ0006` / `bm25` / `fact_date`: missed_exact_date | Năm 1802, tài liệu mô tả sự kiện hoặc diễn biến nào liên quan đến Đại Nam?
- `SQ0013` / `bm25` / `person_entity`: missed_named_entity | Tài liệu mô tả vai trò hoặc hành động của Phú Thọ trong triều đình như thế nào?
- `SQ0015` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến Mỹ trong giai đoạn có mốc 800?
- `SQ0016` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến kháng chiến trong giai đoạn có mốc 960?
- `SQ0017` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến Trung Quốc trong giai đoạn có mốc 488?
- `SQ0018` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến độc lập trong giai đoạn có mốc 1644?
- `SQ0019` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến triều đình trong giai đoạn có mốc 323?
- `SQ0020` / `bm25` / `event`: semantic_mismatch | Tài liệu trình bày sự kiện nào liên quan đến triều đình trong giai đoạn có mốc 358?
- `SQ0028` / `bm25` / `cause_effect`: semantic_mismatch | Tài liệu nêu nguyên nhân hoặc hệ quả nào liên quan đến Hải Phòng?
- `SQ0029` / `bm25` / `cause_effect`: semantic_mismatch | Tài liệu nêu nguyên nhân hoặc hệ quả nào liên quan đến Bắc Kỳ?
