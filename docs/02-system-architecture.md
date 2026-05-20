# 02. System Architecture

## Sơ đồ tổng thể

```text
User
  |
  v
React Frontend
  |
  | REST API
  v
Spring Boot Backend
  |
  | REST API
  v
FastAPI RAG Service
  |
  |--------------------|--------------------|
  v                    v                    v
Vector DB              Neo4j                LLM API
Qdrant                 Graph DB             GPT/Gemini/Local Model
  |
  v
Chunks + Metadata

Spring Boot Backend
  |
  v
MySQL
Articles, Categories, Documents, Data Sources, Chat History, Settings
```

## Trách nhiệm từng thành phần

### React Frontend

- Hiển thị trang chủ, danh sách bài viết, chi tiết bài viết.
- Hiển thị trang chat.
- Hiển thị admin dashboard.
- Gọi REST API của Spring Boot.
- Không gọi trực tiếp FastAPI RAG service.
- Không giữ toàn bộ chat history trong `localStorage`.

### Spring Boot Backend

Spring Boot là backend chính và gateway của hệ thống:

- Quản lý auth/user.
- Quản lý article/category/tag nếu cần.
- Quản lý document upload và metadata.
- Quản lý datasource: URL/Wiki/manual input/article.
- Quản lý chat session và chat message.
- Gọi FastAPI RAG service qua REST API.
- Expose API graph/family tree cho frontend.
- Lưu settings trong MySQL.
- Đọc cấu hình từ `application.yml`, `.env`, hoặc `system_settings`.

Spring Boot không xử lý embedding trực tiếp. Phần embedding, retrieval, prompt và gọi LLM đặt ở FastAPI để dễ dùng Python ecosystem.

### FastAPI RAG Service

FastAPI chịu trách nhiệm cho các nghiệp vụ AI/RAG:

- Nhận yêu cầu ingest từ backend.
- Extract text từ PDF/DOCX/TXT/Markdown/URL.
- Chunk text và gắn metadata.
- Tạo embedding.
- Lưu vector vào Qdrant.
- Search topK chunks khi có câu hỏi.
- Query Neo4j khi câu hỏi cần dữ liệu quan hệ.
- Build prompt từ vector context và graph context.
- Gọi LLM.
- Trả answer + citations về backend.

### Qdrant

Qdrant lưu:

- Vector embedding của từng chunk.
- Metadata chunk: `sourceId`, `sourceType`, `title`, `pageNumber`, `chunkIndex`, `sourceUrl`, `articleId`, `documentId`, `categoryName`.

Qdrant trả về các chunk liên quan nhất khi user hỏi.

### Neo4j

Neo4j lưu các quan hệ lịch sử có cấu trúc:

- Cây gia phả.
- Vua - tướng.
- Nhân vật - triều đại.
- Nhân vật - sự kiện.
- Sự kiện - địa danh.

Neo4j phù hợp cho câu hỏi kiểu: "ai là cha của...", "con của...", "dưới trướng...", "quan hệ giữa A và B là gì".

### MySQL

MySQL là database chính của website:

- `users`
- `categories`
- `articles`
- `documents`
- `data_sources`
- `ingestion_jobs`
- `chat_sessions`
- `chat_messages`
- `system_settings`

MySQL không lưu embedding. Embedding lưu trong Qdrant.

## Giao tiếp service

| Từ | Đến | Giao thức | Mục đích |
|---|---|---|---|
| React | Spring Boot | REST API | Web, CMS, chat. |
| Spring Boot | FastAPI | REST API | Ingest, chat RAG, graph query. |
| Spring Boot | MySQL | JDBC/JPA | Lưu dữ liệu website và settings. |
| FastAPI | Qdrant | Qdrant client/API | Lưu và search vector chunks. |
| FastAPI | Neo4j | Neo4j driver | Query graph lịch sử. |
| FastAPI | LLM API | HTTPS/local API | Sinh câu trả lời. |

## Vì sao không để frontend gọi RAG trực tiếp?

- Dễ lộ API key hoặc internal URL.
- Khó kiểm soát auth/permission.
- Khó lưu chat history đồng bộ.
- Khó enforce citation/source.
- Backend mất vai trò orchestration.

Vì vậy frontend chỉ gọi Spring Boot. Spring Boot quyết định có gọi RAG hay không.

