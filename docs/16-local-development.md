# 16. Local Development

## Mục tiêu

Chạy local đầy đủ các thành phần:

- React Frontend.
- Spring Boot Backend.
- FastAPI RAG service.
- MySQL.
- Qdrant.
- Neo4j.

Với đồ án nhỏ, có thể chạy database bằng Docker và chạy frontend/backend/RAG service trực tiếp trên máy để dễ debug.

## Yêu cầu cài đặt

- Node.js LTS.
- Java 25.
- Maven.
- Python 3.10+.
- Docker Desktop.
- MySQL client nếu muốn kiểm tra DB thủ công.

## Chạy Qdrant

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Qdrant UI/API:

```text
http://localhost:6333
```

## Chạy Neo4j

```bash
docker run \
  --name neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

Neo4j Browser:

```text
http://localhost:7474
```

Tài khoản demo:

```text
username: neo4j
password: password
```

Khi làm thật, không hard-code password này trong code. Đưa vào `.env`.

## Chạy MySQL

Ví dụ bằng Docker:

```bash
docker run \
  --name history-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=history_rag \
  -e MYSQL_USER=history \
  -e MYSQL_PASSWORD=history_password \
  mysql:8
```

Kết nối local:

```text
jdbc:mysql://localhost:3306/history_rag
```

## Chạy React Frontend

```bash
cd frontend
npm install
npm run dev
```

File `.env` frontend gợi ý:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Frontend chỉ cần biết backend URL.

## Chạy Spring Boot Backend

```bash
cd backend
mvn spring-boot:run
```

Config gợi ý trong `application.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${MYSQL_URL}
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}

app:
  rag:
    base-url: ${RAG_SERVICE_URL}
  upload:
    base-path: ${UPLOAD_BASE_PATH}
```

Biến môi trường backend:

```env
MYSQL_URL=jdbc:mysql://localhost:3306/history_rag
MYSQL_USER=history
MYSQL_PASSWORD=history_password
RAG_SERVICE_URL=http://localhost:8001
UPLOAD_BASE_PATH=./uploads
JWT_SECRET_KEY=change-me-change-me-change-me-change-me-change-me-change-me-change-me-1234
```

## Chạy FastAPI RAG Service

```bash
cd rag-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Trên Windows PowerShell:

```powershell
cd rag-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

File `.env` RAG service gợi ý:

```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=history_chunks
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
LLM_PROVIDER=openai
LLM_API_KEY=change-me
LLM_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=text-embedding-3-small
DEFAULT_CHUNK_SIZE=800
DEFAULT_CHUNK_OVERLAP=120
DEFAULT_TOP_K=5
```

## Thứ tự chạy khuyến nghị

1. MySQL.
2. Qdrant.
3. Neo4j.
4. FastAPI RAG service.
5. Spring Boot Backend.
6. React Frontend.

## Health check

| Thành phần | URL |
|---|---|
| Backend | `http://localhost:8080/actuator/health` nếu bật actuator. |
| RAG service | `http://localhost:8001/rag/health`. |
| Qdrant | `http://localhost:6333`. |
| Neo4j Browser | `http://localhost:7474`. |
| React | URL Vite in ra, thường là `http://localhost:5173`. |

## Lỗi thường gặp

| Lỗi | Cách kiểm tra |
|---|---|
| Frontend không gọi được backend | Kiểm tra `VITE_API_BASE_URL` và CORS. |
| Backend không gọi được RAG | Kiểm tra `RAG_SERVICE_URL`. |
| RAG không search được vector | Kiểm tra Qdrant collection và embedding model. |
| Graph query lỗi | Kiểm tra Neo4j URI/user/password. |
| Upload lỗi | Kiểm tra `UPLOAD_BASE_PATH` và quyền ghi file. |

