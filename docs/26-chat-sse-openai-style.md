# 26. Chat SSE theo kiểu OpenAI

## Mục tiêu

Chat hiện nên đi theo hướng streaming để frontend nhận câu trả lời từng phần thay vì chờ full JSON response. Pattern giống OpenAI là:

```text
React
  -> Spring Boot /api/chat/sessions/{id}/messages/stream
    -> FastAPI /rag/chat/stream
      -> LLM/RAG stream
```

Spring Boot vẫn là gateway duy nhất cho frontend. Frontend không gọi trực tiếp FastAPI RAG service.

## MVP hiện tại

Backend đã có endpoint streaming trực tiếp cho RAG:

```text
POST /api/v1/rag/chat/stream
Accept: text/event-stream
Authorization: Bearer <access-token>
```

Endpoint này gọi FastAPI:

```text
POST /rag/chat/stream
```

MVP này chưa lưu `chat_sessions` / `chat_messages`. Nó dùng để kiểm thử luồng streaming trước khi hoàn thiện module chat history.

Do chưa lưu chat history, event `chat.created` của MVP chỉ báo stream đã bắt đầu. Khi module chat hoàn thiện, event này sẽ trả thêm `sessionId` và `userMessageId`.

## REST và SSE cùng tồn tại

Giữ REST endpoint cũ để fallback:

```text
POST /api/chat/sessions/{id}/messages
```

Thêm SSE endpoint cho streaming:

```text
POST /api/chat/sessions/{id}/messages/stream
Accept: text/event-stream
Authorization: Bearer <access-token>
```

Không dùng native `EventSource` cho flow chính vì `EventSource` chỉ thuận với `GET` và khó gửi `Authorization` header. Frontend nên dùng `fetch()` và đọc `ReadableStream`.

## Event format

SSE dùng format:

```text
event: <event-name>
data: <json>

```

Event đề xuất:

| Event | Khi nào gửi | Data |
|---|---|---|
| `chat.created` | Backend nhận request và tạo user message. | `sessionId`, `userMessageId` |
| `chat.delta` | Có token/text chunk mới từ RAG/LLM. | `text` |
| `chat.citations` | RAG đã có citations. | `citations` |
| `chat.completed` | Assistant message đã lưu xong. | `assistantMessageId`, `usedVector`, `usedGraph` |
| `chat.error` | Có lỗi trong stream. | `message`, `code` |

Ví dụ:

```text
event: chat.created
data: {"sessionId":1,"userMessageId":101}

event: chat.delta
data: {"text":"Đinh Bộ Lĩnh"}

event: chat.delta
data: {"text":" dẹp loạn 12 sứ quân nhờ..."}

event: chat.citations
data: {"citations":[{"title":"Đại Việt sử ký toàn thư","pageNumber":12}]}

event: chat.completed
data: {"assistantMessageId":102,"usedVector":true,"usedGraph":false}
```

## Backend responsibilities

`ChatController` chỉ nhận request và trả stream. Không gọi WebClient trực tiếp ngoài service/client layer.

`ChatService`:

- Lưu user message trước khi gọi RAG.
- Gọi `RagClientService.streamChat()`.
- Forward delta ra `SseEmitter`.
- Gom full answer để lưu assistant message khi stream kết thúc.
- Lưu citations vào `chat_messages.citations_json`.

`RagClientService`:

- Gọi FastAPI `/rag/chat/stream`.
- Consume `text/event-stream`.
- Không hard-code URL; dùng `app.rag.base-url`.
- Forward `traceparent` nếu có để nối trace giữa backend và RAG service.

## FastAPI responsibilities

FastAPI thêm:

```text
POST /rag/chat/stream
```

Endpoint trả `StreamingResponse` với media type `text/event-stream`. Nếu LLM provider chưa hỗ trợ token streaming, FastAPI vẫn có thể fake stream bằng cách chia answer thành nhiều `chat.delta`, nhưng phải giữ contract event như trên.

## Observability

Với SSE, một request có thể mở lâu hơn REST thường. Cần đo:

- Tổng thời gian stream.
- Số delta event.
- Thời gian tới delta đầu tiên.
- Trạng thái completed/error.
- `traceparent` trong response header để debug xuyên frontend -> backend -> RAG.

Các metric này có thể bổ sung sau bằng Micrometer hoặc starter observability.
