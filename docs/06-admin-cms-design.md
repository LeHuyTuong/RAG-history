# 06. Admin CMS Design

## Mục tiêu

Admin CMS giúp người quản trị cập nhật nội dung lịch sử và kiểm soát dữ liệu đưa vào RAG. Vì đây là đồ án nhỏ, CMS chỉ cần đủ dùng, rõ trạng thái, dễ demo.

## Chức năng chính

Admin có thể:

- Quản lý bài viết lịch sử.
- Quản lý category.
- Upload tài liệu PDF/DOCX/TXT/Markdown.
- Thêm nguồn Wiki/URL.
- Nhập nội dung thủ công.
- Bấm ingest/re-ingest dữ liệu vào RAG.
- Xem trạng thái ingest.
- Xem lỗi ingest.
- Cấu hình RAG.

## Dashboard

Dashboard nên có các card thống kê:

| Chỉ số | Ý nghĩa |
|---|---|
| Tổng bài viết | Số bài trong hệ thống. |
| Bài đã publish | Số bài public cho user. |
| Tổng tài liệu | Số file admin đã upload. |
| Datasource pending | Nguồn chưa ingest. |
| Ingestion failed | Nguồn ingest lỗi cần xử lý. |
| Chat sessions | Số phiên chat đã tạo. |

## Quản lý bài viết

Trường dữ liệu gợi ý:

- `title`
- `slug`
- `summary`
- `content`
- `categoryId`
- `tags`
- `thumbnailUrl`
- `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `publishedAt`

Hành động:

- Tạo bài viết.
- Sửa bài viết.
- Xóa bài viết.
- Publish/unpublish.
- Ingest/re-ingest bài đã publish.

Khi bài viết được publish, hệ thống có thể tạo datasource loại `ARTICLE` và gửi sang RAG service để ingest.

## Quản lý category

Trường dữ liệu:

- `name`
- `slug`
- `description`
- `parentId`

Ví dụ category:

- Nhà Đinh.
- Nhà Lý.
- Kháng chiến chống Pháp.
- Đổi mới 1986.

Category dùng cho:

- Điều hướng bài viết.
- Filter bài viết.
- Metadata chunk khi ingest RAG.

## Quản lý tài liệu

Loại file nên hỗ trợ:

- PDF.
- DOCX.
- TXT.
- Markdown.

Trường metadata:

- `fileName`
- `originalFileName`
- `fileType`
- `storagePath`
- `status`
- `uploadedBy`
- `createdAt`

Hành động:

- Upload file.
- Xem danh sách file.
- Xem chi tiết metadata.
- Delete file.
- Ingest/re-ingest file.
- Xem lỗi ingest.

## Quản lý datasource

Datasource là nguồn dữ liệu đưa vào RAG. Admin có thể tạo:

- URL/Wiki.
- Manual input.
- Article.
- Document.

Trạng thái datasource:

| Status | Ý nghĩa |
|---|---|
| `PENDING` | Đã tạo nhưng chưa ingest. |
| `PROCESSING` | Đang ingest. |
| `COMPLETED` | Ingest thành công. |
| `FAILED` | Ingest lỗi. |

Với `FAILED`, UI nên hiển thị `errorMessage` từ `ingestion_jobs`.

## Cấu hình RAG

Admin có thể cấu hình:

- `chunkSize`
- `chunkOverlap`
- `topK`
- `embeddingModel`
- `llmModel`
- `temperature`
- `systemPrompt`
- `answerPrompt`
- `maxContextChunks`
- `enableGraphRetrieval`

Những cấu hình admin thay đổi qua UI nên lưu ở bảng `system_settings`.

Ví dụ key:

| Key | Ví dụ value | Ghi chú |
|---|---|---|
| `rag.chunk_size` | `800` | Số ký tự hoặc token tùy cách triển khai. |
| `rag.chunk_overlap` | `120` | Overlap giữa chunks. |
| `rag.top_k` | `5` | Số chunk lấy ra khi retrieval. |
| `rag.embedding_model` | `text-embedding-3-small` | Không hard-code trong code. |
| `rag.llm_model` | `gpt-4.1-mini` | Có thể đổi theo môi trường. |
| `rag.temperature` | `0.2` | Giảm hallucination. |
| `rag.system_prompt` | `...` | Có thể lấy từ DB hoặc prompt file. |
| `rag.enable_graph` | `true` | Bật/tắt graph retrieval. |

## Lưu ý không hard-code

Không hard-code trong backend/RAG service:

- Prompt.
- Model.
- Chunk size.
- TopK.
- RAG service URL.
- Qdrant URL.
- Neo4j URI.
- API key.
- Folder upload.

Nguồn cấu hình:

- `.env` cho secrets và endpoint theo môi trường.
- `application.yml` cho cấu hình backend.
- `system_settings` cho cấu hình admin đổi runtime.

## Quyền admin

Với đồ án nhỏ, role có thể đơn giản:

- `ADMIN`: quản lý CMS, tài liệu, datasource, settings.
- `USER`: đọc bài viết, chat.

Nếu không cần user thường đăng nhập, public user có thể chat không cần account, nhưng backend vẫn nên lưu session.

