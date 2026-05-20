# 17. Deployment Docker Compose

## Mục tiêu

Docker Compose dùng để demo hoặc deploy nhỏ. Hệ thống gồm:

- `frontend`
- `backend`
- `rag-service`
- `mysql`
- `qdrant`
- `neo4j`

Không hard-code secrets trong compose. Dùng `.env`.

## Sơ đồ container

```text
Browser
  |
  v
frontend
  |
  v
backend
  |
  |----> mysql
  |----> rag-service
             |
             |----> qdrant
             |----> neo4j
             |----> LLM API
```

## Biến môi trường `.env` gợi ý

```env
# MySQL
MYSQL_DATABASE=history_rag
MYSQL_USER=history
MYSQL_PASSWORD=change-me
MYSQL_ROOT_PASSWORD=change-root

# Backend
BACKEND_PORT=8080
JWT_SECRET=change-me
UPLOAD_BASE_PATH=/app/uploads
RAG_SERVICE_URL=http://rag-service:8001

# Frontend
VITE_API_BASE_URL=http://localhost:8080

# RAG
RAG_PORT=8001
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=history_chunks
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=change-neo4j
LLM_PROVIDER=openai
LLM_API_KEY=change-me
LLM_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=text-embedding-3-small
DEFAULT_CHUNK_SIZE=800
DEFAULT_CHUNK_OVERLAP=120
DEFAULT_TOP_K=5
```

## Docker Compose skeleton

Đây là thiết kế compose tham khảo, không phải code bắt buộc phải dùng nguyên văn.

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "${BACKEND_PORT}:8080"
    environment:
      - MYSQL_URL=jdbc:mysql://mysql:3306/${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - RAG_SERVICE_URL=${RAG_SERVICE_URL}
      - UPLOAD_BASE_PATH=${UPLOAD_BASE_PATH}
    volumes:
      - uploaded_files:/app/uploads
    depends_on:
      - mysql
      - rag-service

  rag-service:
    build: ./rag-service
    ports:
      - "${RAG_PORT}:8001"
    environment:
      - QDRANT_URL=${QDRANT_URL}
      - QDRANT_COLLECTION=${QDRANT_COLLECTION}
      - NEO4J_URI=${NEO4J_URI}
      - NEO4J_USER=${NEO4J_USER}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - LLM_PROVIDER=${LLM_PROVIDER}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL}
      - EMBEDDING_MODEL=${EMBEDDING_MODEL}
      - DEFAULT_CHUNK_SIZE=${DEFAULT_CHUNK_SIZE}
      - DEFAULT_CHUNK_OVERLAP=${DEFAULT_CHUNK_OVERLAP}
      - DEFAULT_TOP_K=${DEFAULT_TOP_K}
    depends_on:
      - qdrant
      - neo4j

  mysql:
    image: mysql:8
    environment:
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=${NEO4J_USER}/${NEO4J_PASSWORD}
    volumes:
      - neo4j_data:/data

volumes:
  mysql_data:
  qdrant_data:
  neo4j_data:
  uploaded_files:
```

## Volumes cần có

| Volume | Dữ liệu |
|---|---|
| `mysql_data` | Dữ liệu MySQL. |
| `qdrant_data` | Vector store Qdrant. |
| `neo4j_data` | Graph database. |
| `uploaded_files` | File PDF/DOCX/TXT/Markdown upload. |

## Secrets

Không commit `.env` thật lên Git.

Nên có:

- `.env.example` không chứa secret thật.
- README hướng dẫn copy `.env.example` thành `.env`.

## Health checks gợi ý

- Backend: `/actuator/health`.
- RAG service: `/rag/health`.
- Qdrant: root endpoint.
- Neo4j: browser hoặc driver connection.
- MySQL: container healthy.

## Lưu ý demo

Với đồ án nhỏ, Docker Compose chỉ cần chạy ổn trên máy demo. Không cần Kubernetes, service discovery, message broker hoặc CI/CD phức tạp.

