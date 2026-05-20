# 07. Content Data Source Design

## Mục tiêu

RAG cần biết mỗi đoạn thông tin đến từ đâu để trả citation/source. Vì vậy mọi dữ liệu đưa vào RAG nên được chuẩn hóa thành datasource có metadata rõ ràng.

## Loại nguồn dữ liệu

Hệ thống có 4 loại nguồn chính:

| Source type | Mô tả |
|---|---|
| `ARTICLE` | Bài viết do admin tạo trên website. |
| `DOCUMENT` | PDF/DOCX/TXT/Markdown do admin upload. |
| `URL` | URL Wiki hoặc nguồn tham khảo bên ngoài. |
| `MANUAL_INPUT` | Nội dung admin nhập thủ công. |

## ARTICLE

Nguồn `ARTICLE` đến từ bài viết CMS.

Trường chính:

- `title`
- `slug`
- `summary`
- `content`
- `category`
- `tags`
- `author`
- `publishedAt`

Khi nào ingest:

- Khi bài viết được publish.
- Khi bài viết published được update.
- Khi admin bấm re-ingest.

Metadata citation:

- `sourceType = ARTICLE`
- `articleId`
- `title`
- `slug`
- `categoryId`
- `categoryName`
- `publishedAt`

## DOCUMENT

Nguồn `DOCUMENT` đến từ file upload.

Loại file:

- PDF.
- DOCX.
- TXT.
- Markdown.

Backend lưu:

- File vật lý hoặc object storage.
- Metadata trong MySQL.
- Trạng thái ingest.

RAG service xử lý:

- Extract text.
- Với PDF, cố gắng giữ `pageNumber`.
- Chunk text.
- Lưu vector + metadata.

Metadata citation:

- `sourceType = DOCUMENT`
- `documentId`
- `fileName`
- `originalFileName`
- `fileType`
- `pageNumber`
- `chunkIndex`

## URL

Nguồn `URL` dùng cho Wiki hoặc website tham khảo.

Backend lưu:

- `sourceUrl`
- `title`
- `rawContent` hoặc `cleanedContent` nếu đã fetch.
- `status`

RAG service xử lý:

- Fetch URL nếu backend chưa fetch.
- Clean HTML.
- Loại bỏ navigation/footer nếu có thể.
- Chunk và embedding.

Metadata citation:

- `sourceType = URL`
- `sourceUrl`
- `title`
- `chunkIndex`
- `lastIngestedAt`

Lưu ý: Với đồ án nhỏ, nên giới hạn crawl 1 URL/lần, không cần crawler nhiều cấp.

## MANUAL_INPUT

Nguồn `MANUAL_INPUT` dùng cho dữ kiện nhỏ:

- Ghi chú lịch sử.
- Mô tả nhân vật.
- Thông tin giáo viên cung cấp.
- Nội dung nhóm tự tổng hợp.

Trường chính:

- `title`
- `rawContent`
- `createdBy`
- `status`

Metadata citation:

- `sourceType = MANUAL_INPUT`
- `sourceId`
- `title`
- `createdBy`
- `chunkIndex`

## Metadata chung cho datasource

Mỗi nguồn cần metadata:

| Field | Ý nghĩa |
|---|---|
| `sourceId` | ID datasource trong SQL. |
| `sourceType` | `ARTICLE`, `DOCUMENT`, `URL`, `MANUAL_INPUT`. |
| `title` | Tên nguồn. |
| `originalFileName` | Tên file gốc nếu là document. |
| `sourceUrl` | URL nếu là nguồn bên ngoài. |
| `articleId` | ID bài viết nếu có. |
| `documentId` | ID tài liệu nếu có. |
| `categoryId` | ID category nếu có. |
| `createdBy` | User/admin tạo nguồn. |
| `status` | Trạng thái ingest. |
| `lastIngestedAt` | Lần ingest gần nhất. |

## Quan hệ với bảng `data_sources`

`data_sources` đóng vai trò bảng trung tâm trace nguồn:

```text
articles ----\
documents -----> data_sources -> ingestion_jobs -> RAG service -> Qdrant chunks
manual input -/
URL/Wiki -----/
```

Khi RAG trả citation, backend có thể dựa vào `sourceId` để link ngược về bài viết, tài liệu, URL hoặc manual input.

## Trạng thái ingest

| Status | Ý nghĩa |
|---|---|
| `PENDING` | Nguồn mới tạo, chưa gửi ingest. |
| `PROCESSING` | Đang xử lý. |
| `COMPLETED` | Ingest thành công. |
| `FAILED` | Ingest lỗi. |

Nên lưu lỗi chi tiết ở `ingestion_jobs.error_message`, không chỉ lưu status.

## Không hard-delete khi chưa cần

Với đồ án nhỏ có thể delete thật, nhưng tốt hơn nên cân nhắc soft delete cho:

- Article.
- Document.
- Datasource.

Nếu xóa datasource, cần quyết định có xóa chunks trong Qdrant không. Cách đơn giản:

- Khi xóa datasource, gọi RAG service xóa vector theo `sourceId`.
- Nếu chưa kịp làm chức năng xóa vector, ghi rõ hạn chế trong demo.

