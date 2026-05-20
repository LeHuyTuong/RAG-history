# 19. Demo Script

## Mục tiêu demo

Kịch bản demo nên cho thấy hệ thống không chỉ là chatbot, mà là một website lịch sử có CMS, nguồn dữ liệu rõ ràng, RAG có citation và Graph RAG cho quan hệ lịch sử.

## Kịch bản 1: Giới thiệu vấn đề

Nói ngắn gọn:

- Website lịch sử thường chỉ có bài viết tĩnh.
- Chatbot nếu không có nguồn dễ trả lời sai.
- Hệ thống này kết hợp CMS + RAG + Graph RAG.
- RAG không training model, chỉ dùng retrieval từ dữ liệu hệ thống và LLM để sinh câu trả lời.

## Kịch bản 2: Demo website bài viết lịch sử

Thao tác:

1. Mở trang chủ.
2. Xem danh sách bài viết.
3. Lọc theo category, ví dụ "Nhà Đinh".
4. Mở chi tiết bài viết.

Điểm cần nói:

- Bài viết do admin quản lý.
- Nội dung bài viết có thể được ingest vào RAG.
- User có thể đọc trực tiếp hoặc hỏi chatbot.

## Kịch bản 3: Demo admin tạo category

Thao tác:

1. Đăng nhập admin.
2. Vào quản lý category.
3. Tạo category "Nhà Đinh".

Điểm cần nói:

- Category giúp tổ chức bài viết.
- Category cũng đi vào metadata khi ingest RAG.

## Kịch bản 4: Demo admin tạo bài viết

Thao tác:

1. Vào admin article.
2. Tạo bài "Đinh Bộ Lĩnh và loạn 12 sứ quân".
3. Gắn category "Nhà Đinh".
4. Publish bài viết.

Điểm cần nói:

- Khi publish, bài viết có thể tạo datasource loại `ARTICLE`.
- Sau đó hệ thống ingest bài viết vào vector DB.

## Kịch bản 5: Demo admin upload PDF

Thao tác:

1. Vào admin documents.
2. Upload file PDF lịch sử.
3. Xem metadata file.

Điểm cần nói:

- Backend lưu file và metadata.
- RAG service extract text, chunk và embedding.
- Citation từ PDF có thể có file name và page number.

## Kịch bản 6: Demo admin thêm nguồn Wiki/URL

Thao tác:

1. Vào admin datasource.
2. Thêm URL/Wiki về một nhân vật lịch sử.
3. Lưu datasource.

Điểm cần nói:

- URL là một loại datasource.
- Hệ thống chỉ ingest nguồn admin cho phép.
- Không crawler lan rộng để giữ đồ án đơn giản.

## Kịch bản 7: Demo ingest dữ liệu vào RAG

Thao tác:

1. Bấm ingest/re-ingest bài viết hoặc PDF.
2. Quan sát status:
   - `PENDING`
   - `PROCESSING`
   - `COMPLETED`
   - `FAILED`
3. Nếu failed, mở error message.

Điểm cần nói:

- Ingestion gồm extract, chunk, embedding, lưu Qdrant.
- Config như chunk size/topK/model không hard-code.
- Admin có thể thay đổi settings trong `system_settings`.

## Kịch bản 8: Demo hỏi chatbot câu fact

Câu hỏi:

```text
Đinh Bộ Lĩnh lên ngôi năm nào?
```

Kỳ vọng:

- Chatbot trả lời ngắn, đúng.
- Có citation từ article/PDF/URL.

## Kịch bản 9: Demo hỏi câu vì sao

Câu hỏi:

```text
Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?
```

Kỳ vọng:

- Chatbot dùng vector retrieval.
- Trả lời có giải thích.
- Citation trỏ về các chunks liên quan.

## Kịch bản 10: Demo hỏi câu về cây gia phả

Câu hỏi:

```text
Con của Đinh Bộ Lĩnh gồm những ai?
```

Kỳ vọng:

- Chatbot dùng Neo4j.
- Trả về quan hệ gia phả.
- Có graph citation.

## Kịch bản 11: Demo citation/source

Thao tác:

1. Mở phần source dưới câu trả lời.
2. Click vào article hoặc URL nếu có.
3. Với PDF, hiển thị file name/page number.
4. Với graph, hiển thị relationship.

Điểm cần nói:

- Citation giúp kiểm chứng câu trả lời.
- Đây là điểm khác biệt so với chatbot hỏi đáp không nguồn.

## Kịch bản 12: Demo chat history

Thao tác:

1. Refresh trang chat.
2. Mở lại session.
3. Xem messages cũ.

Điểm cần nói:

- Chat history lưu ở MySQL.
- Frontend không lưu toàn bộ chat trong localStorage.
- Message sort theo `createdAt ASC`.

## Kịch bản 13: Nêu hạn chế

Hạn chế nên nói thẳng:

- Dữ liệu lịch sử còn phụ thuộc nguồn admin nhập.
- Nếu tài liệu thiếu, chatbot phải từ chối thay vì đoán.
- URL crawling chỉ ở mức đơn giản.
- Graph data cần nhập/kiểm chứng thủ công.
- Chưa có evaluation tự động đầy đủ.

## Kịch bản 14: Hướng phát triển

Hướng phát triển:

- Thêm bộ test RAG tự động.
- Thêm quản lý tag nâng cao.
- Thêm visualization family tree.
- Thêm lọc retrieval theo category/time period.
- Thêm background job queue cho ingestion.
- Thêm cache cho câu hỏi phổ biến.
- Thêm phân quyền admin/editor.

## Checklist trước khi demo

- Backend chạy được.
- Frontend gọi đúng backend.
- RAG service health OK.
- Qdrant có chunks.
- Neo4j có dữ liệu person/relationship demo.
- MySQL có article/category/document/datasource.
- Ít nhất một câu hỏi fact có citation.
- Ít nhất một câu hỏi vì sao có citation.
- Ít nhất một câu hỏi family tree dùng graph.
- Có câu hỏi ngoài dữ liệu để chứng minh chatbot không bịa.

