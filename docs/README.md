# Tài liệu kiến trúc History RAG

Thư mục `docs/` mô tả kiến trúc cho hệ thống website lịch sử Việt Nam tích hợp blog CMS, chatbot RAG và Graph RAG. Bộ tài liệu này phục vụ đồ án môn học nhỏ, ưu tiên dễ hiểu, dễ chia việc cho sinh viên/fresher, không thiết kế theo hướng enterprise quá nặng.

Nguyên tắc xuyên suốt:

- Frontend React chỉ gọi Spring Boot Backend.
- Spring Boot là backend chính, chia theo module/domain.
- FastAPI RAG Service xử lý ingestion, retrieval, prompt và gọi LLM.
- Qdrant lưu vector embedding của chunks.
- Neo4j lưu quan hệ lịch sử có cấu trúc như gia phả, triều đại, nhân vật, sự kiện.
- MySQL lưu dữ liệu website, CMS, tài liệu, chat history và settings.
- RAG không training model, chỉ dùng retrieval + LLM generation.
- Câu trả lời chatbot phải có citation/source rõ ràng.
- Không hard-code URL, API key, prompt, model, chunk size, topK hoặc folder path trong code.

## Danh sách tài liệu

| File | Mục đích |
|---|---|
| `01-overview.md` | Tổng quan bài toán, mục tiêu và phạm vi đồ án. |
| `02-system-architecture.md` | Kiến trúc tổng thể React, Spring Boot, FastAPI, Qdrant, Neo4j, MySQL và LLM. |
| `03-backend-module-architecture.md` | Thiết kế module/domain cho backend Spring Boot. |
| `04-module-communication-rules.md` | Quy tắc giao tiếp giữa module, service, repository và controller. |
| `05-frontend-structure.md` | Cấu trúc frontend React và nguyên tắc gọi API. |
| `06-admin-cms-design.md` | Thiết kế admin CMS quản lý bài viết, tài liệu, datasource và cấu hình RAG. |
| `07-content-data-source-design.md` | Thiết kế các nguồn dữ liệu cho RAG: article, document, URL/Wiki, manual input. |
| `08-rag-service-structure.md` | Cấu trúc FastAPI RAG service. |
| `09-rag-pipeline.md` | Pipeline ingestion, chunking, embedding, retrieval, graph retrieval, generation và evaluation. |
| `10-graph-rag-neo4j.md` | Vai trò Neo4j trong Graph RAG và khi nào dùng vector/graph/cả hai. |
| `11-family-tree-design.md` | Thiết kế node, relationship và metadata cho cây gia phả. |
| `12-api-design.md` | Thiết kế REST API backend và RAG service API, có request/response mẫu. |
| `13-database-schema.md` | Đề xuất schema MySQL cho CMS, tài liệu, datasource, chat và settings. |
| `14-citation-source-tracking.md` | Chuẩn citation/source tracking cho PDF, article, URL/Wiki và graph. |
| `15-request-flow.md` | Luồng xử lý user chat, admin upload PDF và admin tạo bài viết. |
| `16-local-development.md` | Hướng dẫn chạy local từng thành phần. |
| `17-deployment-docker-compose.md` | Thiết kế Docker Compose cho môi trường demo/deploy nhỏ. |
| `18-evaluation.md` | Cách đánh giá retrieval, answer, citation, graph và hallucination. |
| `19-demo-script.md` | Kịch bản demo đồ án. |
| `20-logical-erd.md` | ⚠️ *(Cũ — đã thay bằng `22`)* Logical ERD Design B. |
| `21-db-rag-connection.md` | Hợp đồng kết nối DB ↔ RAG: pipeline ingest/query, payload Qdrant, sync Neo4j, vòng đời. |
| `22-logical-erd-v2.md` | **Logical ERD v2** (dựng từ conceptual ERD mới): ánh xạ conceptual→logical, 4 điểm chạm RAG, chi tiết bảng cầu, index. Thay cho `20`. |
| `23-physical-data-model.md` | **Physical data model** (17 bảng): quy ước MySQL 8/InnoDB/utf8mb4, ánh xạ kiểu dữ liệu, chiến lược FK ON DELETE, polymorphic `rag_chunk`. DDL chạy được ở `V1__init.sql`. |
| `24-coding-standards.md` | **Coding standards** cheat-sheet: Java/Spring Boot naming (class/method/biến/layer/package) + REST API design (URL, method, status code, JSON, lỗi). Kèm ví dụ DO/DON'T. |

## Ghi chú triển khai

Tài liệu này chỉ là thiết kế. Không có code ứng dụng được tạo trong bước này. Khi bắt đầu code, nên bám sát cấu trúc module và các rule trong `03-backend-module-architecture.md` và `04-module-communication-rules.md` trước tiên.

