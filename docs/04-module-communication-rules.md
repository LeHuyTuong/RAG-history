# 04. Module Communication Rules

## Mục tiêu

Các rule dưới đây giúp backend Spring Boot tránh bị rối khi số module tăng lên. Đây là rule bắt buộc trong dự án.

## Rule bắt buộc

### Rule 1: Repository chỉ được dùng trong service cùng module

Ví dụ:

- `ArticleRepository` chỉ được inject trong `ArticleService`.
- `DocumentRepository` chỉ được inject trong `DocumentService`.
- `CategoryRepository` chỉ được inject trong `CategoryService`.

Không inject repository của module khác.

### Rule 2: Service A muốn lấy dữ liệu module B thì gọi Service B

Ví dụ đúng:

- `ArticleService` cần category thì gọi `CategoryService.findById(categoryId)`.
- `ChatService` cần thông tin document thì gọi `DocumentService.getDocumentById(documentId)`.
- `AdminDashboardService` cần số lượng bài viết thì gọi `ArticleService.countArticles()`.

### Rule 3: Không inject repository của module khác

Ví dụ sai:

- `ArticleService` inject `CategoryRepository`.
- `ChatService` inject `DocumentRepository`.
- `DatasourceService` inject `ArticleRepository`.

Lý do sai:

- Module bị phụ thuộc chéo.
- Khó kiểm soát business rule.
- Dễ bypass validation của module sở hữu dữ liệu.

### Rule 4: Không hard-code config

Không hard-code trong class Java hoặc Python:

- RAG service URL.
- API key.
- LLM model.
- Embedding model.
- Chunk size.
- Chunk overlap.
- TopK.
- Prompt.
- Folder upload.
- Qdrant URL.
- Neo4j URI.

Nguồn config hợp lệ:

- `application.yml`.
- `.env`.
- Bảng `system_settings` nếu admin được phép thay đổi runtime.

### Rule 5: Không để RAG logic nằm trong controller

Controller chỉ nhận request, validate cơ bản và gọi service.

Ví dụ sai:

- `ChatController` tự gọi WebClient sang FastAPI.
- `DocumentController` tự gọi API ingest.
- `ArticleController` tự build prompt.

Ví dụ đúng:

- `ChatController` gọi `ChatService.sendMessage(...)`.
- `ChatService` gọi `RagClientService.ask(...)`.
- `DocumentController` gọi `DocumentService.upload(...)`.
- `DocumentService` gọi `RagClientService.ingestDocument(...)`.

### Rule 6: Không để frontend gọi trực tiếp RAG service

Frontend chỉ gọi Spring Boot Backend.

Lý do:

- Bảo vệ API key và URL nội bộ.
- Backend có thể kiểm tra quyền.
- Backend lưu chat history.
- Backend chuẩn hóa response/citation.
- Backend kiểm soát rate limit nếu cần.

## Ví dụ đúng

### ArticleService tạo bài viết

```text
ArticleController
  |
  v
ArticleService
  |
  | gọi public function
  v
CategoryService.findById(categoryId)
  |
  v
ArticleRepository.save(article)
```

Luồng đúng:

- `ArticleService` không gọi `CategoryRepository`.
- Category validation nằm trong `CategoryService`.
- Article save nằm trong `ArticleRepository`.

### DocumentService ingest tài liệu

```text
DocumentController
  |
  v
DocumentService
  |
  | save file
  | save document metadata
  v
RagClientService.ingestDocument(documentId)
  |
  v
FastAPI /rag/ingest
```

Luồng đúng:

- `DocumentController` không gọi FastAPI.
- `DocumentService` quản lý file và metadata.
- `RagClientService` là adapter gọi RAG.

### ChatService hỏi chatbot

```text
ChatController
  |
  v
ChatService
  |
  | save user message
  v
RagClientService.ask(question, documentId, sessionId)
  |
  v
FastAPI /rag/chat
  |
  v
answer + citations
  |
  v
ChatService saves assistant message
```

Luồng đúng:

- `ChatService` lưu cả user message và assistant message.
- Citation được lưu trong `chat_messages.citations_json`.
- Message trả về frontend được sort theo `createdAt ASC`.

## Ví dụ sai cần tránh

| Sai | Vì sao sai | Cách sửa |
|---|---|---|
| `ArticleService` gọi `CategoryRepository` | Bypass module category. | Gọi `CategoryService.findById(...)`. |
| `ChatService` gọi `DocumentRepository` | Bypass document business rule. | Gọi `DocumentService.getDocumentById(...)`. |
| `Controller` gọi `WebClient` sang RAG | Controller chứa orchestration/business logic. | Đưa vào `RagClientService`. |
| `RagService` hard-code `http://localhost:8001` | Khó đổi môi trường. | Đọc từ `application.yml` hoặc `.env`. |
| Prompt RAG hard-code trong class Java | Admin không sửa được, khó test. | Lưu trong `system_settings` hoặc file prompt của RAG service. |

## Dependency hướng một chiều

Nên giữ dependency theo hướng:

```text
controller -> service -> repository
service A -> service B public API
service -> client service -> external REST API
```

Không nên có:

```text
controller -> repository
controller -> external API
service -> repository module khác
repository -> service
```

## Checklist khi review code backend

- Controller có business logic không?
- Service có inject repository của module khác không?
- Repository có bị gọi ngoài service cùng module không?
- Có URL/API key/prompt/model/chunk size/topK hard-code không?
- Frontend có gọi trực tiếp FastAPI RAG service không?
- Chat response có citation/source không?
- RAG có bị hiểu nhầm là training model không?

