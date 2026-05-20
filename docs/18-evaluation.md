# 18. Evaluation

## Mục tiêu

Evaluation giúp chứng minh chatbot không chỉ trả lời trôi chảy mà còn trả lời đúng, có nguồn và biết từ chối khi dữ liệu không đủ.

## Metrics

| Metric | Ý nghĩa |
|---|---|
| Retrieval accuracy | TopK chunks có chứa thông tin liên quan không. |
| Answer correctness | Câu trả lời có đúng với nguồn không. |
| Citation accuracy | Citation có trỏ đúng nguồn được dùng không. |
| Graph relationship accuracy | Quan hệ Neo4j trả về có đúng không. |
| Latency | Thời gian trả lời. |
| Hallucination rate | Tỷ lệ câu trả lời bịa/không có nguồn. |
| Cost per query | Chi phí embedding/LLM cho mỗi câu hỏi. |

## Bộ test đề xuất

Tạo 20-50 câu hỏi chia nhóm:

| Nhóm câu hỏi | Ví dụ |
|---|---|
| Fact | "Đinh Bộ Lĩnh lên ngôi năm nào?" |
| Vì sao | "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?" |
| So sánh | "So sánh nhà Đinh và nhà Tiền Lê về bối cảnh hình thành." |
| Quan hệ/gia phả | "Con của Đinh Bộ Lĩnh gồm những ai?" |
| Ngoài tài liệu | "Nhân vật X không có trong dữ liệu là ai?" |
| Dựa trên article | "Theo bài viết trên website, ý nghĩa của sự kiện này là gì?" |
| Dựa trên PDF | "Theo tài liệu PDF, trang nào nói về Hoa Lư?" |
| Dựa trên Wiki/URL | "Nguồn Wiki mô tả Đinh Tiên Hoàng như thế nào?" |

## Mẫu bảng đánh giá

| ID | Question | Expected source | Expected answer summary | Retrieval OK | Answer OK | Citation OK | Note |
|---|---|---|---|---|---|---|---|
| Q01 | Đinh Bộ Lĩnh lên ngôi năm nào? | Article 12 | Năm 968 | Yes | Yes | Yes |  |
| Q02 | Con của Đinh Bộ Lĩnh là ai? | Neo4j graph | Đinh Liễn... | Yes | Yes | Yes | Cần graph citation. |
| Q03 | Hỏi ngoài dữ liệu | None | Từ chối/không đủ dữ liệu | Yes | Yes | Yes | Không hallucinate. |

## Cách chấm đơn giản

Với đồ án môn học, có thể chấm thủ công theo thang:

| Điểm | Ý nghĩa |
|---|---|
| 0 | Sai hoặc bịa. |
| 1 | Có liên quan nhưng thiếu/sai một phần. |
| 2 | Đúng cơ bản, citation chấp nhận được. |
| 3 | Đúng rõ, citation chính xác, diễn đạt tốt. |

Chấm riêng:

- Retrieval.
- Answer.
- Citation.
- Graph nếu có.

## Kiểm tra hallucination

Chuẩn bị câu hỏi không có trong dữ liệu:

- Nhân vật không tồn tại trong datasource.
- Sự kiện không nằm trong tài liệu.
- Câu hỏi yêu cầu kết luận quá mức.

Kỳ vọng chatbot trả lời:

```text
Hiện tại dữ liệu trong hệ thống chưa đủ để trả lời chắc chắn câu hỏi này.
```

Nếu chatbot vẫn bịa câu trả lời có vẻ chắc chắn, tính là hallucination.

## Kiểm tra citation

Citation đúng khi:

- Source type đúng.
- Article/document/URL/graph đúng.
- Với PDF, page number đúng hoặc gần đúng.
- Với graph, relationship đúng và có evidence.

Citation sai khi:

- Trỏ sang nguồn không liên quan.
- Có answer nhưng không có citation.
- Citation chỉ ghi chung chung "RAG" hoặc "database".

## Kiểm tra latency

Ghi nhận thời gian:

- Retrieval time.
- Graph query time.
- LLM generation time.
- Total response time.

Với demo nhỏ, mục tiêu hợp lý:

- Câu đơn giản: dưới 5-10 giây.
- Câu graph đơn giản: dưới 3-5 giây.
- Câu kết hợp vector + graph + LLM: có thể lâu hơn nhưng nên ổn định.

## Hướng cải thiện sau evaluation

- Nếu retrieval sai: cải thiện chunking, metadata filter, topK.
- Nếu answer sai dù retrieval đúng: cải thiện prompt.
- Nếu citation sai: kiểm tra metadata chunk và citation service.
- Nếu graph sai: kiểm tra dữ liệu Neo4j và relationship evidence.
- Nếu latency cao: giảm topK, dùng model nhỏ hơn, cache kết quả.

