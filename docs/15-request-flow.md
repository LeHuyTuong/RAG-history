# 15. Request Flow

## Flow user hỏi chatbot

```text
User
  |
  v
React Chat UI
  |
  v
POST /api/chat/sessions/{id}/messages
  |
  v
ChatController
  |
  v
ChatService
  |
  | save user message
  v
RagClientService
  |
  v
FastAPI /rag/chat
  |
  | question router
  | retrieve vector chunks
  | retrieve graph data if needed
  | build prompt
  | call LLM
  v
answer + citations
  |
  v
ChatService saves assistant message
  |
  v
Frontend renders newest message at bottom
```

### Trách nhiệm từng bước

| Bước | Thành phần | Trách nhiệm |
|---|---|---|
| 1 | React Chat UI | Gửi message lên backend, hiển thị loading. |
| 2 | `ChatController` | Nhận request và gọi `ChatService`. |
| 3 | `ChatService` | Lưu user message, gọi RAG, lưu assistant message. |
| 4 | `RagClientService` | Gọi FastAPI `/rag/chat`, không hard-code URL. |
| 5 | FastAPI | Retrieve vector/graph, build prompt, gọi LLM. |
| 6 | `ChatService` | Lưu answer và citations. |
| 7 | React | Append message mới, scroll xuống cuối. |

### Lưu ý

- `ChatController` không gọi WebClient trực tiếp.
- `ChatService` không gọi `DocumentRepository` trực tiếp.
- Citation phải được lưu trong `chat_messages.citations_json`.
- Messages trả về frontend sort theo `createdAt ASC`.

## Flow admin upload PDF

```text
Admin upload PDF
  |
  v
DocumentController
  |
  v
DocumentService
  |
  | save file
  | save document metadata
  v
RagClientService.ingestDocument()
  |
  v
FastAPI /rag/ingest
  |
  | extract text
  | chunk
  | embedding
  | save vector
  v
update ingestion status
```

### Trách nhiệm từng bước

| Bước | Thành phần | Trách nhiệm |
|---|---|---|
| 1 | `DocumentController` | Nhận `multipart/form-data`. |
| 2 | `DocumentService` | Validate file, lưu file, lưu metadata. |
| 3 | `DocumentService` | Tạo datasource/document ingest job. |
| 4 | `RagClientService` | Gửi request ingest sang FastAPI. |
| 5 | FastAPI | Extract text, chunk, embedding, upsert Qdrant. |
| 6 | Backend | Cập nhật status `COMPLETED` hoặc `FAILED`. |

### Trạng thái

```text
PENDING -> PROCESSING -> COMPLETED
                      -> FAILED
```

Nếu failed, lưu lỗi vào `ingestion_jobs.error_message`.

## Flow admin tạo bài viết

```text
Admin creates article
  |
  v
ArticleController
  |
  v
ArticleService
  |
  | validate category via CategoryService
  | save article
  v
If published, create datasource ARTICLE
  |
  v
DatasourceService
  |
  v
RagClientService.ingestArticle()
```

### Trách nhiệm từng bước

| Bước | Thành phần | Trách nhiệm |
|---|---|---|
| 1 | `ArticleController` | Nhận request tạo/sửa bài viết. |
| 2 | `ArticleService` | Validate dữ liệu article. |
| 3 | `ArticleService` | Gọi `CategoryService.findById(categoryId)`. |
| 4 | `ArticleService` | Lưu article bằng `ArticleRepository`. |
| 5 | `DatasourceService` | Tạo/cập nhật datasource loại `ARTICLE`. |
| 6 | `RagClientService` | Gửi article content sang RAG nếu published. |

### Rule bắt buộc

`ArticleService` không gọi `CategoryRepository`. Category validation phải đi qua `CategoryService`.

## Flow admin thêm URL/Wiki

```text
Admin adds URL
  |
  v
DatasourceController
  |
  v
DatasourceService
  |
  | save source metadata
  v
Admin clicks ingest
  |
  v
RagClientService.ingestDatasource()
  |
  v
FastAPI /rag/ingest
  |
  | fetch URL
  | clean HTML
  | chunk
  | embedding
  | save vector
  v
update datasource status
```

Với đồ án nhỏ, không cần crawler nhiều cấp. Chỉ fetch URL admin nhập.

## Flow lấy family tree

```text
React Family Tree UI
  |
  v
GET /api/graph/persons/{id}/family-tree
  |
  v
GraphController
  |
  v
GraphService
  |
  v
GraphClientService
  |
  v
FastAPI /rag/graph/family-tree
  |
  v
Neo4j
  |
  v
Family tree + graph citations
```

Frontend không gọi Neo4j hoặc FastAPI trực tiếp.

## Flow thay đổi RAG settings

```text
Admin updates settings
  |
  v
PUT /api/admin/settings/{key}
  |
  v
SettingsController
  |
  v
SettingsService
  |
  v
system_settings
```

Khi chat hoặc ingest:

```text
ChatService/DocumentService
  |
  v
SettingsService reads system_settings
  |
  v
RagClientService sends settings to FastAPI
```

Không hard-code `chunkSize`, `topK`, model hoặc prompt trong service class.

