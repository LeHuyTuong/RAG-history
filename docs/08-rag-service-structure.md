# 08. RAG Service Structure

## Mục tiêu

RAG service dùng Python FastAPI để tận dụng thư viện xử lý tài liệu, embedding, vector store và LLM. Spring Boot chỉ gọi RAG service qua REST API, không xử lý embedding trong Java.

## Cấu trúc đề xuất

```text
rag-service/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── chat_routes.py
│   │   ├── ingest_routes.py
│   │   ├── datasource_routes.py
│   │   └── graph_routes.py
│   ├── services/
│   │   ├── ingest_service.py
│   │   ├── extract_service.py
│   │   ├── chunk_service.py
│   │   ├── embedding_service.py
│   │   ├── retrieval_service.py
│   │   ├── prompt_service.py
│   │   ├── llm_service.py
│   │   ├── question_router_service.py
│   │   └── citation_service.py
│   ├── graph/
│   │   ├── neo4j_client.py
│   │   ├── graph_schema.md
│   │   ├── graph_query_service.py
│   │   └── family_tree_service.py
│   ├── vectorstore/
│   │   ├── qdrant_client.py
│   │   └── vector_repository.py
│   ├── schemas/
│   ├── config.py
│   └── prompts/
│       ├── system_prompt.txt
│       └── answer_prompt.txt
├── requirements.txt
└── README.md
```

## API layer

| File | Trách nhiệm |
|---|---|
| `chat_routes.py` | Endpoint `/rag/chat`, nhận question và trả answer + citations. |
| `ingest_routes.py` | Endpoint `/rag/ingest`, nhận datasource/document/article để ingest. |
| `datasource_routes.py` | Endpoint phụ cho validate/fetch datasource nếu cần. |
| `graph_routes.py` | Endpoint graph/family tree dùng Neo4j. |

API layer chỉ validate request và gọi service, không chứa logic chunking/retrieval/prompt.

## Service layer

| Service | Trách nhiệm |
|---|---|
| `ingest_service.py` | Orchestrate ingestion từ extract -> chunk -> embedding -> vector store. |
| `extract_service.py` | Extract text từ PDF/DOCX/TXT/Markdown/URL. |
| `chunk_service.py` | Split text thành chunks có overlap. |
| `embedding_service.py` | Gọi embedding model. |
| `retrieval_service.py` | Search topK chunks trong Qdrant. |
| `prompt_service.py` | Build prompt từ question, chunks và graph context. |
| `llm_service.py` | Gọi LLM API hoặc local model. |
| `question_router_service.py` | Nhận diện câu hỏi cần vector, graph hoặc cả hai. |
| `citation_service.py` | Chuẩn hóa citations trả về backend. |

## Graph package

`graph/` xử lý Neo4j:

- Kết nối Neo4j.
- Query person/family tree/relationship.
- Trả graph data có evidence/citation.

Với đồ án nhỏ, không cần viết text-to-Cypher phức tạp. Có thể làm router đơn giản dựa trên keyword và endpoint cụ thể:

- family tree.
- relationships.
- subordinates.
- person search.

## Vectorstore package

`vectorstore/` là adapter với Qdrant:

- Tạo collection.
- Upsert vectors.
- Search vectors.
- Delete vectors theo `sourceId` nếu cần.

Không để logic prompt hoặc citation nằm trong vector repository.

## Schemas

`schemas/` chứa Pydantic models:

- `RagChatRequest`
- `RagChatResponse`
- `Citation`
- `IngestRequest`
- `IngestResponse`
- `ChunkMetadata`
- `GraphQueryRequest`
- `FamilyTreeResponse`

## Config

`config.py` đọc cấu hình từ `.env`:

- Qdrant URL/API key.
- Neo4j URI/user/password.
- LLM provider/API key/model.
- Embedding model.
- Chunk size/overlap mặc định.
- TopK mặc định.

Prompt không hard-code trong Python code. Prompt nên:

- Đặt trong `app/prompts/*.txt`, hoặc
- Nhận từ backend settings khi backend gọi `/rag/chat`, hoặc
- Load từ `system_settings` thông qua backend nếu thiết kế cho phép.

## RAG service không training model

RAG service không fine-tune hay train model. Pipeline chỉ gồm:

```text
data -> extract -> chunk -> embedding -> vector store -> retrieval -> prompt -> LLM answer
```

Điểm quan trọng là dữ liệu và citation tốt, không phải training model.

## Response chuẩn cho chat

Ví dụ:

```json
{
  "answer": "Đinh Bộ Lĩnh dẹp loạn 12 sứ quân nhờ khả năng liên kết lực lượng địa phương, xây dựng căn cứ Hoa Lư và từng bước đánh bại các sứ quân.",
  "citations": [
    {
      "sourceType": "ARTICLE",
      "sourceId": "article-12",
      "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
      "chunkIndex": 2,
      "score": 0.82
    }
  ],
  "usedGraph": false,
  "usedVector": true
}
```

