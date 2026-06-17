# RAG Service Flow Guide

Tài liệu này hướng dẫn hoàn thành MVP đơn giản nhất cho `rag-service`: nhận file bằng `filePath`, extract text, chia chunk, tạo embedding, lưu Qdrant, rồi hỏi lại qua `/rag/chat` để nhận answer và citations.

Scope của hướng dẫn này chỉ gồm `rag-service`. Không làm Spring Boot, frontend, MySQL, Neo4j, multipart upload, background job hoặc evaluation trong MVP này.

## 1. Mục tiêu hoàn thành

MVP được xem là chạy được khi:

- `GET /rag/health` trả `status=ok`.
- `POST /rag/ingest` nhận một file `.txt` hoặc `.md` local qua `filePath` và trả `status=COMPLETED`.
- Qdrant có point mới trong collection `history_chunks`.
- `POST /rag/chat` hỏi nội dung vừa ingest và trả:
  - `answer` bằng tiếng Việt.
  - `citations` không rỗng.
  - `usedVector=true`.
  - `usedGraph=false`.

Flow MVP:

```text
POST /rag/ingest
  -> extract_service
  -> chunk_service
  -> embedding_service
  -> vector_repository.upsert(Qdrant)

POST /rag/chat
  -> embedding_service.embed_query
  -> retrieval_service
  -> prompt_service
  -> llm_service
  -> citation_service
```

## 2. Chức năng từng mảng

| Mảng | File chính | Chức năng |
|---|---|---|
| API routes | `app/api/ingest_routes.py`, `app/api/chat_routes.py` | Nhận request HTTP và gọi service tương ứng. |
| Config | `app/config.py` | Đọc `.env`: Qdrant URL/API key, Google API key, model, chunk size, topK, score threshold. |
| Extract | `app/services/extract_service.py` | Đọc text từ `rawContent`, `filePath`, hoặc `sourceUrl`; hỗ trợ TXT/MD/PDF/DOCX/URL. |
| Chunk | `app/services/chunk_service.py` | Chia text dài thành nhiều chunk nhỏ có overlap và tạo `contentHash`. |
| Embedding | `app/services/embedding_service.py` | Gọi Google embedding model để biến text/question thành vector 768 chiều. |
| Vector store | `app/vectorstore/qdrant_client.py`, `app/vectorstore/vector_repository.py` | Tạo collection Qdrant, upsert vector, search vector, xóa vector theo `sourceId`. |
| Ingest orchestration | `app/services/ingest_service.py` | Điều phối toàn bộ flow ingest: extract -> chunk -> embed -> delete old vectors -> upsert. |
| Retrieval | `app/services/retrieval_service.py` | Embed câu hỏi rồi search Qdrant lấy chunks liên quan. |
| Prompt | `app/prompts/system_prompt.txt`, `app/services/prompt_service.py` | Ghép câu hỏi + context thành prompt để LLM trả lời dựa trên nguồn. |
| LLM | `app/services/llm_service.py` | Gọi model sinh câu trả lời. |
| Citation | `app/services/citation_service.py` | Chuyển metadata từ Qdrant hit thành `citations` trong response. |
| Router | `app/services/question_router_service.py` | MVP chỉ bật vector search, tắt graph. |

Nói ngắn gọn: `/rag/ingest` là flow đưa dữ liệu vào Qdrant; `/rag/chat` là flow lấy dữ liệu từ Qdrant ra để LLM trả lời.

## 3. Setup local

Chạy từ thư mục `rag-service` để `.env` được load đúng:

```bash
cd rag-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Điền `.env` tối thiểu:

```env
QDRANT_URL=https://<cluster-id>.cloud.qdrant.io:6333
QDRANT_API_KEY=<qdrant_api_key>
QDRANT_COLLECTION=history_chunks

GOOGLE_API_KEY=<google_ai_studio_api_key>
LLM_MODEL=gemma-3-27b-it
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIM=768

DEFAULT_CHUNK_SIZE=800
DEFAULT_CHUNK_OVERLAP=120
DEFAULT_TOP_K=5
SCORE_THRESHOLD=0.5
```

Nếu dùng Qdrant local để demo:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Khi đó `.env` có thể dùng:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

Vẫn cần khai báo `QDRANT_API_KEY` vì `config.py` đang yêu cầu biến này tồn tại.

Chạy FastAPI:

```bash
uvicorn app.main:app --reload --port 8001
```

Health check:

```bash
curl http://localhost:8001/rag/health
```

## 4. Thứ tự implement

Ba file đã có và giữ nguyên vai trò:

- `app/vectorstore/qdrant_client.py`: tạo singleton Qdrant client, ensure collection, tạo payload index cho `sourceId` và `tagIds`.
- `app/vectorstore/vector_repository.py`: upsert, search có filter, delete theo `sourceId`.
- `app/services/ingest_service.py`: orchestrate `extract -> chunk -> embed -> upsert`.

Các file cần thêm để `/rag/chat` chạy:

1. `app/services/question_router_service.py`
   - MVP chỉ cần trả `{"use_vector": True, "use_graph": False}`.
   - Không implement Neo4j trong phase này.

2. `app/services/retrieval_service.py`
   - Nhận `question`, `top_k`, `source_ids`, `tag_ids`.
   - Gọi `embed_query(question)`.
   - Gọi `vector_repository.search(...)`.
   - Dùng `settings.score_threshold`.

3. `app/prompts/system_prompt.txt`
   - Prompt tiếng Việt.
   - Yêu cầu LLM chỉ trả lời dựa trên context.
   - Nếu context không đủ, trả lời rằng dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn.

4. `app/services/prompt_service.py`
   - `load_system_prompt()` đọc file prompt.
   - `build_user_message(question, hits)` build message gồm câu hỏi và context.
   - Context lấy từ payload Qdrant: `chunkText`, `title`, `sourceType`, `sourceId`, `pageNumber`, `chunkIndex`.

5. `app/services/llm_service.py`
   - Tạo singleton Google GenAI client.
   - Gọi `client.models.generate_content(...)`.
   - Dùng `settings.llm_model`.
   - Trả `response.text.strip()`.

6. `app/services/citation_service.py`
   - Convert Qdrant hits sang list `Citation`.
   - Map các field: `sourceType`, `sourceId`, `articleId`, `documentId`, `title`, `slug`, `pageNumber`, `chunkIndex`, `score`.
   - Không gọi database.

## 5. Code cần thêm

Phần này là code mẫu cho các file còn thiếu. Tạo đúng file và đặt nội dung tương ứng.

### `app/services/question_router_service.py`

```python
def route(question: str, requested_use_graph: bool = False) -> dict[str, bool]:
    """
    MVP chỉ dùng vector search. Graph/Neo4j để phase sau.
    Giữ tham số requested_use_graph để không phải đổi chat_routes.py.
    """
    return {
        "use_vector": True,
        "use_graph": False,
    }
```

### `app/services/retrieval_service.py`

```python
from qdrant_client.models import ScoredPoint

from app.config import settings
from app.services.embedding_service import embed_query
from app.vectorstore.vector_repository import search


def retrieve(
    question: str,
    top_k: int,
    source_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
) -> list[ScoredPoint]:
    """
    Embed câu hỏi rồi search Qdrant.
    Filter source_ids/tag_ids đi thẳng xuống Qdrant để không cần đọc MySQL.
    """
    query_vector = embed_query(question)
    return search(
        collection=settings.qdrant_collection,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=settings.score_threshold,
        source_ids=source_ids,
        tag_ids=tag_ids,
    )
```

### `app/prompts/system_prompt.txt`

```text
Bạn là trợ lý hỏi đáp lịch sử Việt Nam cho hệ thống History RAG.

Quy tắc bắt buộc:
1. Chỉ trả lời dựa trên phần CONTEXT được cung cấp.
2. Không tự bịa thêm sự kiện, năm tháng, nhân vật hoặc quan hệ nếu context không có.
3. Nếu context không đủ để kết luận chắc chắn, hãy nói: "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn."
4. Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn.
5. Khi dùng thông tin từ context, có thể nhắc mã nguồn dạng [C1], [C2] trong câu trả lời.
```

### `app/services/prompt_service.py`

```python
from pathlib import Path

from qdrant_client.models import ScoredPoint

_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "system_prompt.txt"


def load_system_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_user_message(question: str, hits: list[ScoredPoint]) -> str:
    context = "\n\n".join(_format_hit(i, hit) for i, hit in enumerate(hits, start=1))
    return (
        "CONTEXT:\n"
        f"{context}\n\n"
        "QUESTION:\n"
        f"{question}\n\n"
        "Yêu cầu: Trả lời dựa trên CONTEXT. Nếu không đủ nguồn, nói rõ là dữ liệu chưa đủ."
    )


def _format_hit(index: int, hit: ScoredPoint) -> str:
    payload = hit.payload or {}
    title = payload.get("title") or "Không rõ tiêu đề"
    source_type = payload.get("sourceType") or "UNKNOWN"
    source_id = payload.get("sourceId")
    page_number = payload.get("pageNumber")
    chunk_index = payload.get("chunkIndex")
    chunk_text = payload.get("chunkText") or ""
    score = round(float(hit.score), 4) if hit.score is not None else None

    location = f"chunkIndex={chunk_index}"
    if page_number is not None:
        location = f"{location}, pageNumber={page_number}"

    return (
        f"[C{index}]\n"
        f"sourceType={source_type}; sourceId={source_id}; title={title}; "
        f"{location}; score={score}\n"
        f"{chunk_text}"
    )
```

### `app/services/llm_service.py`

```python
from google import genai
from google.genai import types

from app.config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


def generate(system_prompt: str, user_message: str, temperature: float = 0.2) -> str:
    response = _get_client().models.generate_content(
        model=settings.llm_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise ValueError("LLM returned empty response")
    return text
```

### `app/services/citation_service.py`

```python
from qdrant_client.models import ScoredPoint

from app.schemas.chat import Citation


def to_citations(hits: list[ScoredPoint]) -> list[Citation]:
    citations: list[Citation] = []
    seen: set[tuple[str | None, int | None, int | None]] = set()

    for hit in hits:
        payload = hit.payload or {}
        citation = Citation(
            sourceType=str(payload.get("sourceType") or "UNKNOWN"),
            sourceId=_to_int(payload.get("sourceId")),
            articleId=_to_int(payload.get("articleId")),
            documentId=_to_int(payload.get("documentId")),
            title=payload.get("title"),
            slug=payload.get("slug"),
            pageNumber=_to_int(payload.get("pageNumber")),
            chunkIndex=_to_int(payload.get("chunkIndex")),
            score=float(hit.score) if hit.score is not None else None,
        )
        key = (citation.sourceType, citation.sourceId, citation.chunkIndex)
        if key not in seen:
            seen.add(key)
            citations.append(citation)

    return citations


def _to_int(value) -> int | None:
    if value is None:
        return None
    return int(value)
```

## 6. Ingest file

MVP dùng endpoint có sẵn:

```text
POST /rag/ingest
```

Request gửi đường dẫn file local bằng `filePath`. Nên test trước với `.txt` hoặc `.md` vì dễ debug hơn PDF/DOCX.

Tạo file demo:

```bash
cat > /tmp/demo-dinh-bo-linh.txt <<'EOF'
Đinh Bộ Lĩnh là người có vai trò quan trọng trong việc dẹp loạn 12 sứ quân ở thế kỷ X.
Ông xây dựng căn cứ ở Hoa Lư, tập hợp lực lượng địa phương và từng bước đánh bại các sứ quân.
Sau khi thống nhất đất nước, Đinh Bộ Lĩnh lên ngôi Hoàng đế năm 968, đặt quốc hiệu là Đại Cồ Việt.
EOF
```

Gọi ingest:

```bash
curl -X POST http://localhost:8001/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": 101,
    "sourceType": "DOCUMENT",
    "title": "Demo Đinh Bộ Lĩnh",
    "filePath": "/tmp/demo-dinh-bo-linh.txt",
    "metadata": {
      "categoryName": "Nhà Đinh",
      "tagIds": [1]
    },
    "settings": {
      "chunkSize": 800,
      "chunkOverlap": 120
    }
  }'
```

Ý nghĩa response:

- `COMPLETED`: extract được text, tạo chunk, embedding và upsert Qdrant thành công.
- `EMPTY`: file đọc được nhưng không tạo được chunk nào, thường do file rỗng hoặc extract không ra text.
- `FAILED`: route sẽ trả HTTP 500 nếu có exception, ví dụ sai API key, Qdrant lỗi, embedding lỗi.

Sau khi `.txt` chạy ổn, mới thử:

- `.md`: gần giống `.txt`.
- `.docx`: cần nội dung trong paragraph thật, không chỉ ảnh scan.
- `.pdf`: chỉ extract tốt nếu PDF có text layer, không phải scan ảnh.

## 7. Chat retrieval

Endpoint:

```text
POST /rag/chat
```

Request mẫu:

```bash
curl -X POST http://localhost:8001/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?",
    "topK": 5,
    "sourceIds": [101],
    "tagIds": [1],
    "temperature": 0.2
  }'
```

Response đạt yêu cầu sẽ có dạng:

```json
{
  "answer": "Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân nhờ...",
  "citations": [
    {
      "sourceType": "DOCUMENT",
      "sourceId": 101,
      "title": "Demo Đinh Bộ Lĩnh",
      "pageNumber": null,
      "chunkIndex": 0,
      "score": 0.78
    }
  ],
  "usedVector": true,
  "usedGraph": false
}
```

`sourceIds` và `tagIds` là filter:

- Trong cùng một field là OR, ví dụ `sourceIds=[101,102]`.
- Giữa hai field là AND, nghĩa là vừa đúng source vừa đúng tag.
- Nếu muốn search toàn collection, bỏ `sourceIds` và `tagIds`.

## 8. Debug nhanh

Lỗi đọc file:

- Kiểm tra `filePath` là absolute path.
- Kiểm tra process FastAPI có quyền đọc file.
- Test bằng `.txt` trước PDF/DOCX.

Lỗi Qdrant:

- Kiểm tra `QDRANT_URL`.
- Kiểm tra `QDRANT_API_KEY`.
- Nếu đổi `EMBEDDING_DIM` hoặc embedding model, tạo collection mới hoặc xóa collection cũ vì vector dim phải khớp.
- Với Qdrant Cloud, cần payload index cho `sourceId` và `tagIds`; `ensure_collection()` đã tạo index khi collection mới được tạo.

Lỗi embedding hoặc LLM:

- Kiểm tra `GOOGLE_API_KEY`.
- Kiểm tra `EMBEDDING_MODEL`.
- Kiểm tra `LLM_MODEL` có available trong Google AI Studio không.
- Nếu ingest lỗi trước khi Qdrant có point, thường do embedding API.
- Nếu chat retrieve được hit nhưng không sinh answer, thường do LLM API.

Chat không có citation:

- Kiểm tra ingest có `COMPLETED` chưa.
- Hỏi sát nội dung file demo hơn.
- Bỏ filter `sourceIds` và `tagIds` để loại trừ filter sai.
- Giảm `SCORE_THRESHOLD` xuống `0.35` trong `.env` để demo dễ có hit hơn.
- Restart FastAPI sau khi đổi `.env`.

## 9. Giới hạn MVP

MVP này cố ý đơn giản:

- Không upload multipart, chỉ nhận `filePath` trong JSON.
- Không đọc MySQL.
- Không lưu chat history.
- Không gọi Spring Boot.
- Không dùng Neo4j.
- Không làm evaluation tự động.

Sau khi flow này chạy ổn, bước tiếp theo mới là nối Spring Boot qua `RagClientService`, lưu citations vào backend và thêm UI chat.
