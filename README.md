# History RAG

Skeleton cho hệ thống website lịch sử Việt Nam tích hợp CMS, RAG mock và Graph RAG mock.

## Apps

- `frontend/`: ReactJS + Vite. Chỉ gọi Spring Boot Backend.
- `backend/`: Java Spring Boot gateway chính, chia module/domain.
- `rag-service/`: Python FastAPI RAG service mock.
- `docs/`: tài liệu thiết kế kiến trúc.

## Chạy local

### Backend

```bash
cd backend
mvn spring-boot:run
```

Health:

```text
GET http://localhost:8080/api/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dùng `VITE_API_BASE_URL` trong `.env`.

### RAG service

```bash
cd rag-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Health:

```text
GET http://localhost:8001/rag/health
```

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Compose gồm:

- frontend
- backend
- rag-service
- mysql
- qdrant
- neo4j

## Đang mock trong phase này

- Auth JWT chỉ có endpoint login mock.
- RAG chat trả answer/citation mock.
- Ingest trả `COMPLETED` mock.
- Qdrant chưa được gọi thật.
- Neo4j chưa được gọi thật.
- LLM/embedding chưa được gọi thật.
- Frontend là UI skeleton, chưa hoàn thiện trải nghiệm CMS.

## Phase tiếp theo

- Hoàn thiện DTO response thay vì trả thẳng entity.
- Thêm JWT auth và phân quyền admin.
- Thêm migration SQL hoặc Flyway.
- Implement ingestion thật trong FastAPI.
- Kết nối Qdrant, Neo4j và LLM provider.
- Thêm evaluation set cho RAG.
