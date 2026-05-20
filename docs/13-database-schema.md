# 13. Database Schema

## Mục tiêu

MySQL lưu dữ liệu website, CMS, tài liệu, datasource, chat history và settings. Vector embedding lưu ở Qdrant. Quan hệ lịch sử lưu ở Neo4j.

## Tổng quan bảng

```text
users
categories
articles
documents
data_sources
ingestion_jobs
chat_sessions
chat_messages
system_settings
```

## `users`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `username` | VARCHAR(100) | Unique. |
| `email` | VARCHAR(255) | Unique nếu cần. |
| `password_hash` | VARCHAR(255) | Không lưu plain password. |
| `role` | VARCHAR(50) | `ADMIN`, `USER`. |
| `created_at` | DATETIME | Ngày tạo. |

## `categories`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `name` | VARCHAR(255) | Tên category. |
| `slug` | VARCHAR(255) | Unique. |
| `description` | TEXT | Mô tả. |
| `parent_id` | BIGINT NULL | Category cha nếu có. |
| `created_at` | DATETIME | Ngày tạo. |
| `updated_at` | DATETIME | Ngày cập nhật. |

## `articles`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `title` | VARCHAR(500) | Tiêu đề. |
| `slug` | VARCHAR(500) | Unique. |
| `summary` | TEXT | Tóm tắt. |
| `content` | LONGTEXT | Nội dung bài viết. |
| `category_id` | BIGINT FK | Tham chiếu `categories.id`. |
| `status` | VARCHAR(50) | `DRAFT`, `PUBLISHED`, `ARCHIVED`. |
| `thumbnail_url` | VARCHAR(1000) | Ảnh đại diện nếu có. |
| `created_by` | BIGINT FK | Tham chiếu `users.id`. |
| `published_at` | DATETIME NULL | Ngày publish. |
| `created_at` | DATETIME | Ngày tạo. |
| `updated_at` | DATETIME | Ngày cập nhật. |

## `documents`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `file_name` | VARCHAR(500) | Tên file lưu trong storage. |
| `original_file_name` | VARCHAR(500) | Tên file user upload. |
| `file_type` | VARCHAR(50) | `PDF`, `DOCX`, `TXT`, `MARKDOWN`. |
| `storage_path` | VARCHAR(1000) | Đường dẫn storage. |
| `status` | VARCHAR(50) | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`. |
| `uploaded_by` | BIGINT FK | Tham chiếu `users.id`. |
| `created_at` | DATETIME | Ngày tạo. |
| `updated_at` | DATETIME | Ngày cập nhật. |

## `data_sources`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `source_type` | VARCHAR(50) | `ARTICLE`, `DOCUMENT`, `URL`, `MANUAL_INPUT`. |
| `title` | VARCHAR(500) | Tên nguồn. |
| `source_url` | VARCHAR(1000) NULL | URL nếu có. |
| `raw_content` | LONGTEXT NULL | Nội dung nhập tay hoặc fetch được. |
| `article_id` | BIGINT NULL | Tham chiếu article nếu có. |
| `document_id` | BIGINT NULL | Tham chiếu document nếu có. |
| `status` | VARCHAR(50) | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`. |
| `last_ingested_at` | DATETIME NULL | Lần ingest gần nhất. |
| `created_by` | BIGINT FK | Admin tạo nguồn. |
| `created_at` | DATETIME | Ngày tạo. |
| `updated_at` | DATETIME | Ngày cập nhật. |

## `ingestion_jobs`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `source_id` | BIGINT | Tham chiếu `data_sources.id`. |
| `source_type` | VARCHAR(50) | Copy source type để dễ query. |
| `status` | VARCHAR(50) | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`. |
| `error_message` | TEXT NULL | Lỗi nếu failed. |
| `started_at` | DATETIME NULL | Bắt đầu xử lý. |
| `finished_at` | DATETIME NULL | Kết thúc xử lý. |

## `chat_sessions`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `title` | VARCHAR(500) | Tên session. |
| `document_id` | BIGINT NULL | Scope theo document nếu có. |
| `user_id` | BIGINT NULL | User nếu có login. |
| `created_at` | DATETIME | Ngày tạo. |
| `updated_at` | DATETIME | Ngày cập nhật. |

## `chat_messages`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `session_id` | BIGINT FK | Tham chiếu `chat_sessions.id`. |
| `role` | VARCHAR(50) | `USER`, `ASSISTANT`, `SYSTEM`. |
| `content` | LONGTEXT | Nội dung message. |
| `citations_json` | JSON NULL | Citation/source của assistant message. |
| `created_at` | DATETIME | Ngày tạo. |

Message phải sort theo `created_at ASC` khi trả về frontend.

## `system_settings`

| Column | Type gợi ý | Ghi chú |
|---|---|---|
| `id` | BIGINT PK | Auto increment. |
| `setting_key` | VARCHAR(255) | Unique. |
| `setting_value` | LONGTEXT | Giá trị setting. |
| `description` | TEXT NULL | Mô tả. |
| `updated_at` | DATETIME | Ngày cập nhật. |

Ví dụ settings:

| Key | Value |
|---|---|
| `rag.chunk_size` | `800` |
| `rag.chunk_overlap` | `120` |
| `rag.top_k` | `5` |
| `rag.embedding_model` | `text-embedding-3-small` |
| `rag.llm_model` | `gpt-4.1-mini` |
| `rag.temperature` | `0.2` |
| `rag.system_prompt` | `Bạn là trợ lý lịch sử Việt Nam...` |
| `rag.enable_graph` | `true` |

## Index gợi ý

| Bảng | Index |
|---|---|
| `users` | unique `username`, unique `email`. |
| `categories` | unique `slug`, index `parent_id`. |
| `articles` | unique `slug`, index `category_id`, index `status`, index `published_at`. |
| `documents` | index `status`, index `uploaded_by`. |
| `data_sources` | index `source_type`, index `status`, index `article_id`, index `document_id`. |
| `ingestion_jobs` | index `source_id`, index `status`. |
| `chat_sessions` | index `user_id`, index `document_id`. |
| `chat_messages` | index `session_id`, index `created_at`. |
| `system_settings` | unique `setting_key`. |

## Ranh giới dữ liệu

| Nơi lưu | Dữ liệu |
|---|---|
| MySQL | Content, metadata, settings, chat history, ingestion jobs. |
| Qdrant | Embedding vectors, chunk text, chunk metadata. |
| Neo4j | Person, dynasty, place, event, relationships. |

Không lưu API key trong MySQL nếu không cần. Secrets nên để trong `.env` hoặc secret manager tùy môi trường.

