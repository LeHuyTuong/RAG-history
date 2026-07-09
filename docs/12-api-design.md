# 12. API Design


## Nguyên tắc chung

- Backend Spring Boot expose REST API cho frontend.
- Frontend không gọi trực tiếp FastAPI RAG service.
- API dùng JSON. Upload file chưa có Spring Boot controller trong code hiện tại.
- Endpoint admin yêu cầu `ROLE_ADMIN`.
- Endpoint không nằm trong whitelist của `SecurityConfig` yêu cầu JWT Bearer token.
- Response thực tế dùng wrapper `ApiResponse<T>` với field `statusCode`, `message`, `data`, `error`, `details`.
- DELETE trong code hiện tại trả `200` kèm wrapper, không phải `204 No Content`.

## Response wrapper gợi ý

Success thực tế:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

Created:

```json
{
  "statusCode": 201,
  "message": "Đăng ký thành công",
  "data": {}
}
```

Error:

```json
{
  "statusCode": 404,
  "message": "Resource not found with id: 1",
  "error": "Not Found"
}
```

Validation error thực tế:

```json
{
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ",
  "error": "Bad Request",
  "details": [
    "email: Email không đúng định dạng"
  ]
}
```

## Authentication API

Auth cơ chế hiện tại:

- Spring Security chạy stateless JWT qua `oauth2ResourceServer`.
- Access token gửi bằng header:

```http
Authorization: Bearer <accessToken>
```

- Refresh token được trả trong response body và được set thêm cookie `refresh_token`.
- Cookie refresh token: `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`.
- Public whitelist: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/actuator/health`, `/uploads/**`, Swagger/OpenAPI.
- Các endpoint còn lại yêu cầu authenticated JWT.
- Admin endpoint dùng `@PreAuthorize("hasRole('ADMIN')")`.

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký member. | `RegisterRequest` | `RegisterResponse` | `201`, `400`, `409`, `500` |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập, tạo access token và refresh token. | `LoginRequest` | `LoginResponse` | `200`, `400`, `401`, `500` |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh access token bằng cookie `refresh_token` hoặc body. | `RefreshRequest` optional | `LoginResponse` | `200`, `400`, `401`, `500` |
| `POST` | `/api/v1/auth/logout` | Public | Revoke refresh token nếu có cookie, clear cookie. | None | `null` | `200`, `500` |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại từ JWT subject và claim `accountType`. | None | `AuthUserResponse` | `200`, `401`, `404`, `500` |

Ví dụ login:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Ví dụ protected request:

```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer <accessToken>
```

## User profile APIs

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/users/me` | Authenticated | Lấy member hiện tại. | None | `UserResponse` | `200`, `401`, `404`, `500` |
| `GET` | `/api/v1/users/{id}` | Authenticated | Lấy member theo id. | None | `UserResponse` | `200`, `400`, `401`, `404`, `500` |
| `GET` | `/api/v1/users/email/{email}` | Authenticated | Lấy member theo email. | None | `UserResponse` | `200`, `401`, `404`, `500` |
| `GET` | `/api/v1/users` | Authenticated | Lấy toàn bộ member. | None | List `UserResponse` | `200`, `401`, `500` |
| `PUT` | `/api/v1/users/{id}` | Authenticated | Cập nhật username/fullName. | `UpdateUserRequest` | `UserResponse` | `200`, `400`, `401`, `404`, `409`, `500` |
| `DELETE` | `/api/v1/users/{id}` | Authenticated | Xóa member. | None | `null` | `200`, `400`, `401`, `404`, `500` |


## Admin dashboard APIs

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/dashboard` | `ROLE_ADMIN` | Lấy số liệu dashboard admin. | None | `DashboardResponse` | `200`, `401`, `403`, `500` |

## System setting APIs

Các endpoint GET được frontend dùng để áp logo, ảnh nền và model AI hiển thị. Không lưu secret/API key trong `system_settings`.

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/settings` | Public GET | Lấy toàn bộ cấu hình runtime. | None | List `SystemSettingResponse` | `200`, `500` |
| `GET` | `/api/v1/admin/settings/{key}` | Public GET | Lấy cấu hình theo key. | None | `SystemSettingResponse` | `200`, `404`, `500` |
| `PUT` | `/api/v1/admin/settings/{key}` | `ROLE_ADMIN` | Tạo hoặc cập nhật cấu hình. | `SystemSettingRequest` | `SystemSettingResponse` | `200`, `400`, `401`, `403`, `500` |

Request:

```json
{
  "key": "ui.logo_url",
  "value": "/images/logo.png",
  "description": "URL logo hiển thị trên giao diện"
}
```

Các key admin settings đang quản lý:

| Key | Purpose |
|---|---|
| `rag.llm_model` | Model sinh câu trả lời AI |
| `ui.logo_url` | URL logo dùng chung cho user/admin; để trống dùng icon mặc định |
| `ui.background_url` | URL ảnh nền dùng chung cho user/admin; để trống dùng nền mặc định |

## Admin tag APIs

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/tags` | `ROLE_ADMIN` | Lấy danh sách tag phân trang. | Query: `page`, `size`, `sort` | Page `TagResponse` | `200`, `401`, `403`, `500` |
| `POST` | `/api/v1/admin/tags` | `ROLE_ADMIN` | Tạo tag. | `TagRequest` | `TagResponse` | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT` | `/api/v1/admin/tags/{id}` | `ROLE_ADMIN` | Cập nhật tag. | `TagRequest` | `TagResponse` | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE` | `/api/v1/admin/tags/{id}` | `ROLE_ADMIN` | Xóa tag. | None | `null` | `200`, `400`, `401`, `403`, `404`, `500` |

Request:

```json
{
  "name": "Nhà Đinh",
  "slug": "nha-dinh",
  "description": "Các nội dung về nhà Đinh"
}
```

## Admin period APIs

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/periods` | `ROLE_ADMIN` | Lấy danh sách thời kỳ, có lọc keyword. | Query: `keyword`, `page`, `size`, `sort` | Page `PeriodResponse` | `200`, `401`, `403`, `500` |
| `POST` | `/api/v1/admin/periods` | `ROLE_ADMIN` | Tạo thời kỳ. | `PeriodRequest` | `PeriodResponse` | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT` | `/api/v1/admin/periods/{id}` | `ROLE_ADMIN` | Cập nhật thời kỳ. | `PeriodRequest` | `PeriodResponse` | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE` | `/api/v1/admin/periods/{id}` | `ROLE_ADMIN` | Xóa thời kỳ. | None | `null` | `200`, `400`, `401`, `403`, `404`, `500` |

Request:

```json
{
  "name": "Nhà Lý",
  "slug": "nha-ly",
  "startYear": 1009,
  "endYear": 1225,
  "description": "Triều đại nhà Lý"
}
```

## Admin engagement APIs

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/engagements/pending` | `ROLE_ADMIN` | Lấy comment đang chờ duyệt. | Query: `page`, `size`, `sort` | Page `EngagementResponse` | `200`, `401`, `403`, `500` |
| `PUT` | `/api/v1/admin/engagements/{id}/moderate` | `ROLE_ADMIN` | Duyệt/ẩn comment. | `EngagementModerationRequest` | `EngagementResponse` | `200`, `400`, `401`, `403`, `404`, `500` |

Request:

```json
{
  "status": "VISIBLE"
}
```

`status` hợp lệ: `PENDING`, `VISIBLE`, `HIDDEN`.

## RAG service APIs

Các API này chỉ để Spring Boot gọi, frontend không gọi trực tiếp.

FastAPI base path: `/rag`.

| Method | URL | Quyền | Purpose | Request body | Response body | Status codes |
|---|---|---|---|---|---|---|
| `GET` | `/rag/health` | Internal | Health check RAG service. | None | `{ "status": "ok", "service": "rag-history" }` | `200` |
| `POST` | `/rag/ingest` | Internal | Ingest một source vào vector store. | `RagIngestRequest` | `RagIngestResponse` | `200`, `400`, `500` |
| `DELETE` | `/rag/delete?sourceId={id}` | Internal | Xóa vector theo `sourceId`. | None | `{ "status": "deleted", "sourceId": 1 }` | `200`, `500` |
| `POST` | `/rag/chat` | Internal | Hỏi RAG chatbot, response JSON. | `RagChatRequest` | `RagChatResponse` | `200`, `500` |
| `POST` | `/rag/chat/stream` | Internal | Hỏi RAG chatbot, response Server-Sent Events. | `RagChatRequest` | SSE events | `200`, `500` |

## Spring Boot RAG gateway APIs

Frontend gọi Spring Boot, không gọi FastAPI trực tiếp.

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/v1/rag/chat/stream` | Gateway SSE cho chatbot RAG. | `RagChatRequest`. | `text/event-stream`. |

RAG ingest request:

```json
{
  "sourceId": 101,
  "sourceType": "DOCUMENT",
  "title": "Lịch sử Việt Nam",
  "articleId": null,
  "documentId": 10,
  "filePath": "/uploads/lich-su-viet-nam.pdf",
  "sourceUrl": null,
  "rawContent": null,
  "metadata": {
    "categoryId": null,
    "categoryName": null,
    "slug": null,
    "tagIds": [],
    "eventIds": [],
    "periodIds": []
  },
  "settings": {
    "chunkSize": 800,
    "chunkOverlap": 120
  }
}
```

RAG chat request:

```json
{
  "question": "Cha của Đinh Liễn là ai?",
  "topK": 5,
  "useGraph": false,
  "sourceIds": [],
  "tagIds": [],
  "temperature": 0.2,
  "model": "gpt-oss-120b"
}
```

SSE events từ `/rag/chat/stream`:

| Event | Data |
|---|---|
| `chat.created` | `{ "message": "stream started" }` |
| `chat.delta` | `{ "text": "..." }` |
| `chat.citations` | `{ "citations": [...] }` |
| `chat.completed` | `{ "usedVector": true, "usedGraph": false }` |

## Data models

### ApiResponse<T>

| Field | Type | Description |
|---|---|---|
| `statusCode` | integer | HTTP-like status code in body. |
| `message` | string | Human-readable message. |
| `data` | T/null | Response payload on success. Omitted when null because `NON_NULL`. |
| `error` | string/null | Error label. |
| `details` | array string/null | Validation details. |

### Page<T>

Spring Data `Page<T>` serialized by Jackson. Common fields:

| Field | Type | Description |
|---|---|---|
| `content` | array T | Dữ liệu trang hiện tại. |
| `totalElements` | integer | Tổng số bản ghi. |
| `totalPages` | integer | Tổng số trang. |
| `size` | integer | Kích thước trang. |
| `number` | integer | Số trang hiện tại, bắt đầu từ `0`. |
| `first` | boolean | Có phải trang đầu không. |
| `last` | boolean | Có phải trang cuối không. |
| `numberOfElements` | integer | Số phần tử trong trang hiện tại. |
| `empty` | boolean | Trang rỗng hay không. |

### LoginRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string | Yes | `@NotBlank`, `@Email` |
| `password` | string | Yes | `@NotBlank` |

### RegisterRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | No | `@Size(max=50)` |
| `name` | string | Yes | `@NotBlank`, `@Size(min=2,max=255)` |
| `email` | string | Yes | `@NotBlank`, `@Email` |
| `password` | string | Yes | `@NotBlank`, `@Size(min=8,max=100)` |

### RefreshRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `refreshToken` | string | No | Có thể thay bằng cookie `refresh_token`. |

### LoginResponse

| Field | Type |
|---|---|
| `accessToken` | string |
| `refreshToken` | string |

### RegisterResponse

| Field | Type |
|---|---|
| `id` | long |
| `username` | string |
| `email` | string |
| `fullName` | string |
| `status` | enum `ACTIVE`, `INACTIVE`, `DELETED`, `BANNED` |
| `createdAt` | instant |

### AuthUserResponse

| Field | Type |
|---|---|
| `id` | long |
| `username` | string |
| `email` | string |
| `fullName` | string |
| `status` | enum `ACTIVE`, `INACTIVE`, `DELETED`, `BANNED` |
| `accountType` | string, `ADMIN` hoặc `MEMBER` |
| `role` | string, `ROLE_ADMIN` hoặc `ROLE_USER` |
| `createdAt` | instant |

### UpdateUserRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | No | `@Size(min=3,max=50)` |
| `fullName` | string | No | `@Size(min=3,max=50)` |

### UserResponse

| Field | Type |
|---|---|
| `id` | long |
| `username` | string |
| `email` | string |
| `fullName` | string |
| `status` | enum `ACTIVE`, `INACTIVE`, `DELETED`, `BANNED` |
| `createdAt` | instant |
| `updatedAt` | instant |

### DashboardResponse

| Field | Type |
|---|---|
| `totalAdmins` | long |
| `totalMembers` | long |
| `totalPosts` | long |
| `publishedPosts` | long |
| `draftPosts` | long |
| `archivedPosts` | long |
| `totalEvents` | long |
| `totalPersons` | long |
| `totalLocations` | long |
| `totalSources` | long |
| `totalTags` | long |
| `totalPeriods` | long |
| `totalEngagements` | long |
| `totalComments` | long |
| `pendingComments` | long |
| `visibleComments` | long |
| `hiddenComments` | long |
| `activities` | array `DashboardActivityResponse` |

### DashboardActivityResponse

| Field | Type |
|---|---|
| `id` | string |
| `icon` | string |
| `color` | string |
| `background` | string |
| `text` | string |
| `time` | string |

### TagRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | `@NotBlank`, `@Size(max=50)` |
| `slug` | string | Yes | `@NotBlank`, `@Size(max=100)`, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `description` | string | No | `@Size(max=500)` |

### TagResponse

| Field | Type |
|---|---|
| `id` | long |
| `name` | string |
| `slug` | string |
| `description` | string |
| `createdAt` | instant |
| `updatedAt` | instant |

### PeriodRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | `@NotBlank`, `@Size(max=50)` |
| `slug` | string | Yes | `@NotBlank`, `@Size(max=50)`, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `startYear` | integer | No | None |
| `endYear` | integer | No | None |
| `description` | string | No | `@Size(max=100)` |

### PeriodResponse

| Field | Type |
|---|---|
| `id` | long |
| `name` | string |
| `slug` | string |
| `startYear` | integer |
| `endYear` | integer |
| `description` | string |
| `createdAt` | instant |
| `updatedAt` | instant |

### EngagementModerationRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `status` | enum `PENDING`, `VISIBLE`, `HIDDEN` | Yes | `@NotNull` |

### EngagementResponse

| Field | Type |
|---|---|
| `id` | long |
| `commentContent` | string |
| `commentStatus` | enum `PENDING`, `VISIBLE`, `HIDDEN` |
| `createdAt` | instant |

### RagIngestRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `sourceId` | integer | Yes | Pydantic required |
| `sourceType` | string | Yes | `"DOCUMENT"` / `"ARTICLE"` / `"URL"` / `"MANUAL_INPUT"` by comment only |
| `title` | string | Yes | Pydantic required |
| `articleId` | integer | No | None |
| `documentId` | integer | No | None |
| `filePath` | string | No | One of `filePath`, `sourceUrl`, `rawContent` expected by service comment |
| `sourceUrl` | string | No | One of `filePath`, `sourceUrl`, `rawContent` expected by service comment |
| `rawContent` | string | No | One of `filePath`, `sourceUrl`, `rawContent` expected by service comment |
| `metadata` | `IngestMetadata` | No | Default empty object |
| `settings` | `IngestSettings` | No | Default empty object |

### IngestMetadata

| Field | Type |
|---|---|
| `categoryId` | integer/null |
| `categoryName` | string/null |
| `slug` | string/null |
| `tagIds` | array integer |
| `eventIds` | array integer |
| `periodIds` | array integer |

### IngestSettings

| Field | Type |
|---|---|
| `chunkSize` | integer/null |
| `chunkOverlap` | integer/null |

### RagIngestResponse

| Field | Type |
|---|---|
| `sourceId` | integer |
| `status` | string, comment: `COMPLETED`, `EMPTY`, `FAILED` |
| `collection` | string |
| `embeddingModel` | string |
| `chunks` | array `IngestedChunk` |

### IngestedChunk

| Field | Type |
|---|---|
| `chunkIndex` | integer |
| `qdrantPointId` | string |
| `contentHash` | string |

### RagChatRequest

| Field | Type | Required | Constraints |
|---|---|---|---|
| `question` | string | Yes | Pydantic required |
| `topK` | integer | No | `null` dùng default config |
| `useGraph` | boolean | No | Default `false`; graph chưa implement trong MVP |
| `sourceIds` | array integer | No | Default `[]` |
| `tagIds` | array integer | No | Default `[]` |
| `temperature` | number | No | Default `0.2` |
| `model` | string | No | Model AI override lấy từ admin settings `rag.llm_model` |

### Citation

| Field | Type |
|---|---|
| `sourceType` | string |
| `sourceId` | integer/null |
| `articleId` | integer/null |
| `documentId` | integer/null |
| `title` | string/null |
| `slug` | string/null |
| `pageNumber` | integer/null |
| `chunkIndex` | integer/null |
| `score` | number/null |

### RagChatResponse

| Field | Type |
|---|---|
| `answer` | string |
| `citations` | array `Citation` |
| `usedVector` | boolean |
| `usedGraph` | boolean |

## Error codes

Code hiện tại không có enum `errorCode`; `ApiResponse.error` là nhãn text. Bảng dưới đây mô tả error labels/status thực tế từ `GlobalExceptionHandler` và `SecurityConfig`.

| error | HTTP status | Khi xảy ra |
|---|---:|---|
| `Unauthorized` | `401` | JWT thiếu/sai/hết hạn; `InvalidTokenException`; `BadCredentialsException`. |
| `Forbidden` | `403` | Authenticated nhưng thiếu quyền, ví dụ không có `ROLE_ADMIN`. |
| `Bad Request` | `400` | Validation lỗi, request body sai/missing, type mismatch, `InvalidRequestException`. |
| `Not Found` | `404` | `ResourceNotFoundException` hoặc no handler nếu Spring được cấu hình throw no handler. |
| `Conflict` | `409` | `DuplicateResourceException`, `ConflictException`, duplicate unique field như email/slug/name. |
| `Method Not Allowed` | `405` | HTTP method không được hỗ trợ cho endpoint. |
| `Internal Server Error` | `500` | Exception không được handle cụ thể. |

## Validation rules

| DTO | Field | Required | Rule |
|---|---|---|---|
| `LoginRequest` | `email` | Yes | Not blank, email format |
| `LoginRequest` | `password` | Yes | Not blank |
| `RegisterRequest` | `username` | No | Max 50 |
| `RegisterRequest` | `name` | Yes | Not blank, min 2, max 255 |
| `RegisterRequest` | `email` | Yes | Not blank, email format |
| `RegisterRequest` | `password` | Yes | Not blank, min 8, max 100 |
| `UpdateUserRequest` | `username` | No | Min 3, max 50 |
| `UpdateUserRequest` | `fullName` | No | Min 3, max 50 |
| `TagRequest` | `name` | Yes | Not blank, max 50 |
| `TagRequest` | `slug` | Yes | Not blank, max 100, lowercase hyphen slug pattern |
| `TagRequest` | `description` | No | Max 500 |
| `PeriodRequest` | `name` | Yes | Not blank, max 50 |
| `PeriodRequest` | `slug` | Yes | Not blank, max 50, lowercase hyphen slug pattern |
| `PeriodRequest` | `startYear` | No | No annotation |
| `PeriodRequest` | `endYear` | No | No annotation |
| `PeriodRequest` | `description` | No | Max 100 |
| `EngagementModerationRequest` | `status` | Yes | Not null; enum `PENDING`, `VISIBLE`, `HIDDEN` |

