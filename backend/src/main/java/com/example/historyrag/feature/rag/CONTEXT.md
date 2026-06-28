# Rag Context

Retrieval-augmented generation feature. Keep controllers, service interface, service implementation, repositories, entities, and feature DTOs in this package according to project rules.

Current MVP exposes Spring Boot gateway endpoints under `/api/v1/rag`:
- `GET /health` -> FastAPI `/rag/health`
- `POST /chat` -> FastAPI `/rag/chat`
- `POST /chat/stream` -> FastAPI `/rag/chat/stream`
- `POST /retrieve` -> FastAPI `/rag/retrieve` for retrieval-only debugging
- `POST /ingest` -> FastAPI `/rag/ingest`
- `DELETE /sources/{sourceId}` -> FastAPI `/rag/delete?sourceId=...`

These endpoints do not persist chat sessions/messages yet. They are gateway adapters so frontend and backend modules can connect through Spring Boot without calling FastAPI directly.
