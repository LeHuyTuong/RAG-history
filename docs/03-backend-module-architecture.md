# 03. Backend Module Architecture

## Mục tiêu chia module

Backend Spring Boot nên chia theo module/domain để codebase dễ đọc và dễ mở rộng:

- Không dồn toàn bộ controller/service/repository vào một package chung.
- Mỗi domain tự quản lý entity, repository, service, controller và dto của mình.
- Module khác cần dữ liệu thì gọi public function của service, không gọi repository trực tiếp.
- Controller mỏng, không chứa business logic.

## Cấu trúc đề xuất

```text
backend/
├── src/main/java/com/example/historyrag/
│   ├── HistoryRagApplication.java
│   ├── common/
│   │   ├── config/
│   │   ├── exception/
│   │   ├── response/
│   │   ├── security/
│   │   └── util/
│   ├── module/
│   │   ├── auth/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   └── repository/
│   │   ├── user/
│   │   ├── article/
│   │   ├── category/
│   │   ├── document/
│   │   ├── datasource/
│   │   ├── chat/
│   │   ├── rag/
│   │   ├── graph/
│   │   └── admin/
│   └── infrastructure/
│       ├── storage/
│       ├── file/
│       ├── webclient/
│       └── scheduler/
```

Mỗi module domain nên có cấu trúc tương tự:

```text
module/article/
├── controller/
├── service/
├── dto/
├── entity/
└── repository/
```

## Common package

`common/` chứa phần dùng chung:

- `config/`: cấu hình Spring Security, WebClient, CORS, upload, pagination.
- `exception/`: custom exception, global exception handler.
- `response/`: response wrapper, error response, pagination response.
- `security/`: JWT filter, principal, password encoder.
- `util/`: slug util, date util, file name util.

Không đặt business logic domain trong `common/`.

## Infrastructure package

`infrastructure/` chứa adapter kỹ thuật:

- `storage/`: lưu file local hoặc cloud storage.
- `file/`: validate file, detect MIME type.
- `webclient/`: cấu hình HTTP client gọi FastAPI.
- `scheduler/`: job định kỳ nếu cần re-ingest hoặc cleanup.

Không đặt controller domain trong `infrastructure/`.

## Module auth

Trách nhiệm:

- Login admin/user.
- Register nếu đồ án cần user thường.
- Refresh token nếu có.
- JWT authentication.

Ví dụ API:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Auth module có thể gọi `UserService` để kiểm tra user, không gọi `UserRepository` trực tiếp nếu repository nằm trong module `user`.

## Module user

Trách nhiệm:

- Quản lý user/admin.
- Lưu role: `ADMIN`, `USER`.
- Cung cấp public service function cho module khác khi cần lấy user.

Ví dụ service:

- `getUserById(id)`
- `getUserByUsername(username)`
- `createAdmin(...)`

## Module article

Trách nhiệm:

- Quản lý bài viết lịch sử.
- CRUD bài viết.
- Publish/unpublish.
- Tạo slug.
- Gắn category/tag nếu cần.
- Khi bài viết published hoặc updated, có thể tạo hoặc cập nhật datasource loại `ARTICLE` để ingest sang RAG.

Article module không tự gọi `CategoryRepository`. Khi cần kiểm tra category, gọi `CategoryService`.

## Module category

Trách nhiệm:

- Quản lý danh mục bài viết.
- Hỗ trợ parent category nếu cần.
- Cung cấp category cho article.

Ví dụ category:

- Nhà Đinh.
- Nhà Lý.
- Kháng chiến chống Pháp.
- Đổi mới 1986.

## Module document

Trách nhiệm:

- Upload PDF/DOCX/TXT/Markdown.
- Validate file.
- Lưu file qua storage infrastructure.
- Lưu metadata vào MySQL.
- Quản lý trạng thái ingest.
- Gọi `RagClientService.ingestDocument(...)` để gửi sang RAG service.

Document module lưu metadata, không tự extract/chunk/embedding.

## Module datasource

Trách nhiệm:

- Quản lý nguồn dữ liệu ngoài và nguồn nội bộ cho RAG:
  - URL Wiki.
  - URL bài viết.
  - Manual input.
  - Article.
  - Document.
- Lưu raw content hoặc cleaned content nếu có.
- Lưu trạng thái ingest.
- Tạo ingestion job.

Datasource module là nơi gom metadata nguồn dữ liệu để RAG có thể trace citation.

## Module chat

Trách nhiệm:

- Quản lý chat session.
- Lưu user message.
- Gọi `RagClientService.ask(...)`.
- Lưu assistant message kèm citations.
- Trả danh sách message sort theo `createdAt ASC`.

Chat module không truy cập trực tiếp document/article repository. Nếu cần document context, gọi `DocumentService`.

## Module rag

Trách nhiệm:

- Chứa client/service gọi FastAPI RAG service.
- Mapping request/response DTO giữa Spring Boot và FastAPI.
- Đọc RAG base URL từ config, không hard-code.

RAG module không xử lý embedding trong Java.

## Module graph

Trách nhiệm:

- Expose API graph/family tree cho frontend.
- Với đồ án nhỏ, ưu tiên Spring Boot gọi FastAPI graph API qua REST.
- Nếu muốn đơn giản hơn cho đọc dữ liệu family tree, Spring Boot có thể query Neo4j trực tiếp, nhưng vẫn phải gom logic trong `GraphService`.

Khuyến nghị cho đồ án này:

- FastAPI xử lý Neo4j và graph query.
- Spring Boot `GraphClientService` gọi FastAPI.
- Frontend chỉ gọi Spring Boot `/api/graph/...`.

## Module admin

Trách nhiệm:

- API tổng hợp cho admin dashboard.
- Thống kê số bài viết, tài liệu, datasource, job failed.
- Gọi service của các module khác.

Admin module không nên chứa business logic trực tiếp quá nhiều. Nếu cần thao tác article thì gọi `ArticleService`; cần document thì gọi `DocumentService`.

## DTO naming gợi ý

| Loại DTO | Ví dụ | Vai trò |
|---|---|---|
| Request | `CreateArticleRequest` | Dữ liệu client gửi lên. |
| Response | `ArticleResponse` | Dữ liệu trả về client. |
| Summary | `ArticleSummaryResponse` | Dữ liệu rút gọn cho list. |
| Internal | `RagChatRequest` | Dữ liệu gọi service nội bộ hoặc external API. |

## Kết luận

Chia module theo domain giúp backend rõ ràng mà vẫn vừa sức đồ án. Mỗi module tự quản lý phần của mình; giao tiếp qua service public hoặc client service, không đi tắt qua repository của module khác.

