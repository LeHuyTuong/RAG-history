# History RAG Service

FastAPI skeleton cho RAG service. Phase này chỉ mock response, chưa gọi LLM, Qdrant, Neo4j hoặc embedding thật.

## Run local

```bash
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Endpoints

- `GET /rag/health`
- `POST /rag/ingest`
- `POST /rag/chat`
- `POST /rag/graph/family-tree`
- `POST /rag/graph/query`

