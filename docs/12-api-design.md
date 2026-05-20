# 12. API Design

## Nguyên tắc chung

- Backend Spring Boot expose REST API cho frontend.
- Frontend không gọi trực tiếp FastAPI RAG service.
- API dùng JSON, riêng upload tài liệu dùng `multipart/form-data`.
- Endpoint admin nên yêu cầu role `ADMIN`.
- Response nên có format thống nhất.

## Response wrapper gợi ý

Success:

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Error:

```json
{
  "success": false,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Không tìm thấy dữ liệu",
  "details": []
}
```

## Public article APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `GET` | `/api/articles` | Lấy danh sách bài viết published. | Query: `page`, `size`, `categorySlug`, `keyword`. | Page of `ArticleSummaryResponse`. |
| `GET` | `/api/articles/{slug}` | Lấy chi tiết bài viết. | None. | `ArticleDetailResponse`. |
| `GET` | `/api/categories` | Lấy danh sách category. | None. | List `CategoryResponse`. |
| `GET` | `/api/categories/{slug}/articles` | Lấy bài viết theo category. | Query: `page`, `size`. | Page of `ArticleSummaryResponse`. |

Ví dụ response article detail:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
    "slug": "dinh-bo-linh-loan-12-su-quan",
    "summary": "Tổng quan về quá trình thống nhất đất nước...",
    "content": "<p>...</p>",
    "category": {
      "id": 1,
      "name": "Nhà Đinh",
      "slug": "nha-dinh"
    },
    "tags": ["Đinh Bộ Lĩnh", "Loạn 12 sứ quân"],
    "publishedAt": "2026-05-20T10:00:00"
  },
  "message": "OK"
}
```

## Admin article APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/admin/articles` | Tạo bài viết. | `CreateArticleRequest`. | `ArticleDetailResponse`. |
| `PUT` | `/api/admin/articles/{id}` | Cập nhật bài viết. | `UpdateArticleRequest`. | `ArticleDetailResponse`. |
| `DELETE` | `/api/admin/articles/{id}` | Xóa bài viết. | None. | Empty/success. |
| `PATCH` | `/api/admin/articles/{id}/publish` | Publish/unpublish bài viết. | `{ "published": true }`. | `ArticleDetailResponse`. |

Request:

```json
{
  "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
  "slug": "dinh-bo-linh-loan-12-su-quan",
  "summary": "Tóm tắt ngắn...",
  "content": "Nội dung bài viết...",
  "categoryId": 1,
  "tags": ["Đinh Bộ Lĩnh", "Nhà Đinh"],
  "thumbnailUrl": "https://example.com/image.jpg",
  "status": "DRAFT"
}
```

## Admin category APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/admin/categories` | Tạo category. | `CreateCategoryRequest`. | `CategoryResponse`. |
| `PUT` | `/api/admin/categories/{id}` | Cập nhật category. | `UpdateCategoryRequest`. | `CategoryResponse`. |
| `DELETE` | `/api/admin/categories/{id}` | Xóa category. | None. | Empty/success. |

Request:

```json
{
  "name": "Nhà Đinh",
  "slug": "nha-dinh",
  "description": "Các bài viết về nhà Đinh",
  "parentId": null
}
```

## Document APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/admin/documents/upload` | Upload tài liệu. | `multipart/form-data` field `file`. | `DocumentResponse`. |
| `GET` | `/api/admin/documents` | Lấy danh sách tài liệu. | Query: `page`, `size`, `status`. | Page of `DocumentResponse`. |
| `GET` | `/api/admin/documents/{id}` | Lấy chi tiết tài liệu. | None. | `DocumentResponse`. |
| `DELETE` | `/api/admin/documents/{id}` | Xóa tài liệu. | None. | Empty/success. |
| `POST` | `/api/admin/documents/{id}/ingest` | Ingest tài liệu vào RAG. | Optional settings override. | `IngestionJobResponse`. |

Response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "fileName": "20260520_lich-su-viet-nam.pdf",
    "originalFileName": "Lich-su-Viet-Nam.pdf",
    "fileType": "PDF",
    "status": "PENDING",
    "createdAt": "2026-05-20T10:00:00"
  },
  "message": "Upload thành công"
}
```

## Datasource APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/admin/datasources` | Tạo datasource URL/manual/article/document. | `CreateDatasourceRequest`. | `DatasourceResponse`. |
| `GET` | `/api/admin/datasources` | Lấy danh sách datasource. | Query: `page`, `size`, `sourceType`, `status`. | Page of `DatasourceResponse`. |
| `POST` | `/api/admin/datasources/{id}/ingest` | Ingest datasource lần đầu. | None hoặc override settings. | `IngestionJobResponse`. |
| `POST` | `/api/admin/datasources/{id}/re-ingest` | Ingest lại datasource. | None hoặc override settings. | `IngestionJobResponse`. |

Request URL datasource:

```json
{
  "sourceType": "URL",
  "title": "Đinh Tiên Hoàng",
  "sourceUrl": "https://example.com/wiki/dinh-tien-hoang",
  "rawContent": null,
  "articleId": null,
  "documentId": null
}
```

Request manual input:

```json
{
  "sourceType": "MANUAL_INPUT",
  "title": "Ghi chú về Hoa Lư",
  "rawContent": "Hoa Lư là kinh đô của nhà Đinh và Tiền Lê.",
  "sourceUrl": null,
  "articleId": null,
  "documentId": null
}
```

## Chat APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/api/chat/sessions` | Tạo chat session. | `CreateChatSessionRequest`. | `ChatSessionResponse`. |
| `GET` | `/api/chat/sessions/{id}/messages` | Lấy messages của session. | None. | List `ChatMessageResponse`, sort `createdAt ASC`. |
| `POST` | `/api/chat/sessions/{id}/messages` | Gửi message user và nhận assistant answer. | `SendMessageRequest`. | `ChatMessagePairResponse`. |
| `GET` | `/api/chat/sessions/active?documentId=...` | Lấy hoặc tạo session đang active theo document nếu cần. | Query. | `ChatSessionResponse`. |

Request gửi message:

```json
{
  "message": "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?",
  "documentId": null,
  "articleId": null,
  "sourceIds": [],
  "useGraph": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": 101,
      "role": "USER",
      "content": "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?",
      "createdAt": "2026-05-20T10:01:00"
    },
    "assistantMessage": {
      "id": 102,
      "role": "ASSISTANT",
      "content": "Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân nhờ...",
      "citations": [
        {
          "sourceType": "ARTICLE",
          "articleId": 12,
          "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
          "slug": "dinh-bo-linh-loan-12-su-quan",
          "chunkIndex": 2
        }
      ],
      "createdAt": "2026-05-20T10:01:05"
    }
  },
  "message": "OK"
}
```

## Settings APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `GET` | `/api/admin/settings` | Lấy settings hệ thống. | None. | List `SystemSettingResponse`. |
| `PUT` | `/api/admin/settings/{key}` | Cập nhật setting theo key. | `UpdateSettingRequest`. | `SystemSettingResponse`. |

Request:

```json
{
  "settingValue": "5",
  "description": "Số chunk retrieve cho mỗi câu hỏi"
}
```

## Graph APIs

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `GET` | `/api/graph/persons/search?name=` | Tìm nhân vật theo tên. | Query `name`. | List `PersonResponse`. |
| `GET` | `/api/graph/persons/{id}/family-tree` | Lấy cây gia phả. | None. | `FamilyTreeResponse`. |
| `GET` | `/api/graph/persons/{id}/relationships` | Lấy quan hệ nhân vật. | None. | List `RelationshipResponse`. |
| `GET` | `/api/graph/persons/{id}/subordinates` | Lấy người dưới trướng. | None. | List `PersonRelationshipResponse`. |

Family tree response:

```json
{
  "success": true,
  "data": {
    "person": {
      "id": "person-dinh-bo-linh",
      "name": "Đinh Bộ Lĩnh"
    },
    "parents": [],
    "children": [
      {
        "id": "person-dinh-lien",
        "name": "Đinh Liễn"
      }
    ],
    "citations": [
      {
        "sourceType": "GRAPH",
        "relationship": "PARENT_OF",
        "source": "Đinh Bộ Lĩnh",
        "target": "Đinh Liễn",
        "evidenceSourceId": "source-001"
      }
    ]
  },
  "message": "OK"
}
```

## RAG service APIs

Các API này chỉ để Spring Boot gọi, frontend không gọi trực tiếp.

| Method | URL | Purpose | Request body | Response body |
|---|---|---|---|---|
| `POST` | `/rag/ingest` | Ingest datasource/article/document. | `RagIngestRequest`. | `RagIngestResponse`. |
| `POST` | `/rag/chat` | Hỏi RAG chatbot. | `RagChatRequest`. | `RagChatResponse`. |
| `POST` | `/rag/graph/family-tree` | Lấy family tree từ Neo4j. | `GraphFamilyTreeRequest`. | `FamilyTreeResponse`. |
| `POST` | `/rag/graph/query` | Query graph tổng quát. | `GraphQueryRequest`. | `GraphQueryResponse`. |
| `GET` | `/rag/health` | Health check. | None. | Health status. |

RAG ingest request:

```json
{
  "sourceId": "source-001",
  "sourceType": "DOCUMENT",
  "title": "Lịch sử Việt Nam",
  "documentId": 10,
  "articleId": null,
  "filePath": "/uploads/20260520_lich-su-viet-nam.pdf",
  "sourceUrl": null,
  "rawContent": null,
  "metadata": {
    "categoryName": "Nhà Đinh",
    "createdBy": "admin"
  },
  "settings": {
    "chunkSize": 800,
    "chunkOverlap": 120,
    "embeddingModel": "text-embedding-3-small"
  }
}
```

RAG chat request:

```json
{
  "sessionId": "session-001",
  "question": "Cha của Đinh Liễn là ai?",
  "topK": 5,
  "useGraph": true,
  "sourceIds": [],
  "llmModel": "gpt-4.1-mini",
  "temperature": 0.2
}
```

RAG chat response:

```json
{
  "answer": "Theo dữ liệu graph, cha của Đinh Liễn là Đinh Bộ Lĩnh.",
  "citations": [
    {
      "sourceType": "GRAPH",
      "relationship": "PARENT_OF",
      "source": "Đinh Bộ Lĩnh",
      "target": "Đinh Liễn",
      "evidenceSourceId": "source-001"
    }
  ],
  "usedVector": false,
  "usedGraph": true
}
```

