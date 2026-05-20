# 05. Frontend Structure

## Mục tiêu

Frontend React cần đủ chức năng cho website lịch sử và admin CMS, nhưng cấu trúc vẫn đơn giản để sinh viên/fresher dễ nắm:

- Public site: đọc bài viết, xem category, tìm kiếm cơ bản.
- Chat UI: hỏi chatbot và xem citation/source.
- Admin CMS: quản lý bài viết, category, tài liệu, datasource, settings.

Frontend chỉ gọi Spring Boot Backend. Không gọi trực tiếp FastAPI RAG service.

## Cấu trúc đề xuất

```text
frontend/
├── src/
│   ├── api/
│   │   ├── authApi.js
│   │   ├── articleApi.js
│   │   ├── categoryApi.js
│   │   ├── documentApi.js
│   │   ├── datasourceApi.js
│   │   └── chatApi.js
│   ├── components/
│   │   ├── layout/
│   │   ├── article/
│   │   ├── category/
│   │   ├── chat/
│   │   ├── document/
│   │   └── admin/
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ArticleListPage.jsx
│   │   ├── ArticleDetailPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── AdminDashboardPage.jsx
│   │   ├── AdminArticlePage.jsx
│   │   ├── AdminCategoryPage.jsx
│   │   ├── AdminDocumentPage.jsx
│   │   └── AdminDatasourcePage.jsx
│   ├── hooks/
│   │   └── useChat.js
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
```

## Thư mục `api/`

Mỗi file trong `api/` chịu trách nhiệm gọi một nhóm endpoint backend:

| File | Trách nhiệm |
|---|---|
| `authApi.js` | Login/logout, lấy thông tin user hiện tại. |
| `articleApi.js` | Public article API và admin article API. |
| `categoryApi.js` | Public category API và admin category API. |
| `documentApi.js` | Upload, list, delete, ingest document. |
| `datasourceApi.js` | Tạo URL/Wiki/manual input, ingest/re-ingest datasource. |
| `chatApi.js` | Tạo session, lấy message, gửi message. |

Nguyên tắc:

- Tạo một HTTP client chung cấu hình `baseURL` từ biến môi trường frontend.
- Gắn token ở request interceptor nếu user đã login.
- Không hard-code backend URL trong component.
- Không gọi FastAPI RAG service từ frontend.

## Thư mục `components/`

Gợi ý component:

| Nhóm | Component |
|---|---|
| `layout/` | `MainLayout`, `AdminLayout`, `Header`, `Sidebar`, `Footer`. |
| `article/` | `ArticleCard`, `ArticleList`, `ArticleEditor`, `ArticleStatusBadge`. |
| `category/` | `CategoryMenu`, `CategoryForm`, `CategoryTree`. |
| `chat/` | `ChatWindow`, `MessageBubble`, `CitationList`, `ChatInput`, `SessionList`. |
| `document/` | `DocumentUploader`, `DocumentTable`, `IngestStatusBadge`. |
| `admin/` | `DashboardStats`, `SettingsForm`, `IngestionJobTable`. |

## Pages public

### `HomePage.jsx`

- Hiển thị bài viết mới.
- Hiển thị category nổi bật.
- Có entry vào trang chatbot.

### `ArticleListPage.jsx`

- List bài viết theo page.
- Filter theo category/tag nếu cần.
- Sort theo `publishedAt DESC`.

### `ArticleDetailPage.jsx`

- Hiển thị title, summary, content, category, tags, publishedAt.
- Có thể hiển thị box "Hỏi chatbot về bài viết này".
- Khi user chat theo bài viết, frontend gửi `articleId` hoặc `activeDocumentId/sourceId` nếu backend hỗ trợ scope.

### `ChatPage.jsx`

- Hiển thị session hiện tại.
- Message sort theo `createdAt ASC`.
- Message mới append xuống cuối.
- Assistant message hiển thị citation/source.
- Khi gửi message, disable input hoặc show loading để tránh gửi trùng.

## Pages admin

### `AdminDashboardPage.jsx`

- Tổng số bài viết.
- Tổng số tài liệu.
- Tổng số datasource.
- Số ingestion job failed.
- Link nhanh đến quản lý content.

### `AdminArticlePage.jsx`

- CRUD bài viết.
- Publish/unpublish.
- Gắn category/tag.
- Nút ingest hoặc re-ingest nếu bài đã published.

### `AdminCategoryPage.jsx`

- CRUD category.
- Hỗ trợ parent category nếu cần.

### `AdminDocumentPage.jsx`

- Upload PDF/DOCX/TXT/Markdown.
- Xem trạng thái ingest.
- Nút ingest/re-ingest.
- Xem lỗi ingest nếu failed.

### `AdminDatasourcePage.jsx`

- Thêm nguồn URL/Wiki.
- Nhập manual input.
- Xem status.
- Ingest/re-ingest.

## Quản lý chat state

Nguyên tắc:

- Backend là nguồn dữ liệu chính cho chat history.
- Frontend gọi `GET /api/chat/sessions/{id}/messages` để load messages.
- Khi gửi message thành công, append response mới hoặc refetch messages.
- Message hiển thị theo `createdAt ASC`.
- Không lưu toàn bộ chat vào `localStorage`.

`localStorage` chỉ nên lưu:

- `accessToken`.
- `activeSessionId` nếu cần khôi phục session.
- `activeDocumentId` hoặc `activeSourceId` nếu cần giữ context tạm.

## Citation UI

Mỗi assistant message nên hiển thị phần nguồn:

- PDF: tên file, trang, chunk nếu cần.
- Article: title, link article.
- URL/Wiki: title, URL.
- Graph: relationship, source node, target node, evidence source.

Không nên chỉ hiển thị "Nguồn: RAG". Người dùng cần biết nội dung đến từ tài liệu nào.

## Biến môi trường frontend

Ví dụ:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Không lưu:

- LLM API key.
- Qdrant URL.
- Neo4j password.
- FastAPI internal URL.

Những giá trị này chỉ nằm ở backend/RAG service.

