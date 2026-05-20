# 01. Overview

## Bài toán

Website lịch sử Việt Nam cần phục vụ hai nhu cầu chính:

- Người dùng đọc bài viết lịch sử theo mô hình blog/CMS: danh mục, bài viết, tag, bài liên quan.
- Người dùng hỏi chatbot về các nội dung lịch sử đã được hệ thống quản lý: bài viết, PDF, nội dung nhập tay, URL/Wiki và dữ liệu quan hệ trong graph.

Nếu chatbot chỉ gọi LLM trực tiếp, câu trả lời có thể sai, thiếu nguồn, hoặc tự bịa chi tiết. Với chủ đề lịch sử, vấn đề này rất quan trọng vì người dùng cần biết câu trả lời dựa trên tài liệu nào.

RAG giúp chatbot trả lời dựa trên dữ liệu đã được ingest vào hệ thống:

- Bài viết trên website.
- Tài liệu PDF/DOCX/TXT/Markdown do admin upload.
- Nội dung admin nhập thủ công.
- URL/Wiki hoặc nguồn tham khảo bên ngoài.
- Dữ liệu graph như cây gia phả, quan hệ nhân vật, triều đại, sự kiện.

Neo4j bổ sung khả năng truy vấn quan hệ có cấu trúc. Ví dụ: cha/con của nhân vật, ai phục vụ dưới quyền ai, nhân vật thuộc triều đại nào, sự kiện xảy ra ở đâu.

## Mục tiêu

- User có thể đọc bài lịch sử bằng giao diện React.
- User có thể hỏi chatbot bằng tiếng Việt có dấu.
- Chatbot trả lời dựa trên tài liệu đã ingest, không trả lời kiểu đoán mò.
- Chatbot trả về citation/source rõ ràng.
- Admin có thể quản lý bài viết, category, tài liệu và nguồn dữ liệu.
- Admin có thể ingest hoặc re-ingest dữ liệu vào RAG.
- Admin có thể thay đổi cấu hình RAG qua UI nếu cần.
- Codebase backend dễ hiểu, chia theo module/domain.

## Phạm vi

Hệ thống phù hợp đồ án môn học nhỏ, không cần các thành phần enterprise phức tạp như:

- Microservice đầy đủ với service discovery, event bus, distributed tracing.
- Training/fine-tuning model.
- Workflow engine phức tạp.
- Permission nhiều tầng như enterprise CMS.

Phạm vi nên tập trung vào:

- Blog CMS lịch sử.
- Upload và quản lý tài liệu.
- Ingestion sang RAG.
- Chatbot có citation/source.
- Graph RAG cơ bản bằng Neo4j.
- REST API rõ ràng.
- Docker Compose để demo.

## Kiến trúc công nghệ

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | ReactJS | Giao diện người dùng, admin CMS, chat UI. |
| Backend chính | Java Spring Boot | REST API, business logic, auth, CMS, chat history, gọi RAG service. |
| RAG service | Python FastAPI | Extract, chunk, embedding, retrieval, prompt building, gọi LLM. |
| Vector DB | Qdrant | Lưu embedding chunks và metadata. |
| Graph DB | Neo4j | Lưu quan hệ lịch sử có cấu trúc. |
| SQL DB | MySQL | Lưu dữ liệu website, admin, documents, datasource, chat, settings. |
| LLM | GPT/Gemini/Local model | Sinh câu trả lời từ context được retrieve. |

## Nguyên tắc quan trọng

- RAG không training model.
- Frontend không gọi trực tiếp FastAPI RAG service.
- Spring Boot là gateway chính cho frontend.
- Backend không hard-code prompt, model, API key, topK, chunk size, URL service.
- Cấu hình lấy từ `application.yml`, `.env`, hoặc bảng `system_settings`.
- Citation/source phải được lưu và trả về cùng câu trả lời.

