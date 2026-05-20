# 09. RAG Pipeline

## Mục tiêu

Pipeline RAG giúp chatbot trả lời dựa trên dữ liệu đã được hệ thống quản lý. RAG không training model. RAG chỉ retrieve context liên quan rồi đưa vào LLM để sinh câu trả lời có citation/source.

## Pipeline tổng quát

```text
1. Data source
   |
   v
2. Ingestion
   |
   v
3. Chunking
   |
   v
4. Embedding
   |
   v
5. Vector database
   |
   v
6. Retrieval
   |
   v
7. Graph retrieval nếu cần
   |
   v
8. Prompt building
   |
   v
9. LLM answer generation
   |
   v
10. Citation/source tracking
   |
   v
11. Evaluation
```

## 1. Data source

Nguồn dữ liệu gồm:

- Article.
- PDF.
- DOCX.
- TXT.
- Markdown.
- Wiki/URL.
- Manual input.

Mỗi nguồn phải có `sourceId` và `sourceType`.

## 2. Ingestion

Backend gửi request sang RAG service:

```text
Spring Boot Document/Article/Datasource Service
  |
  v
RagClientService
  |
  v
FastAPI /rag/ingest
```

RAG service:

- Nhận metadata nguồn.
- Extract content nếu cần.
- Chuẩn hóa text.
- Tạo chunks.
- Tạo embeddings.
- Lưu vào Qdrant.
- Trả status về backend.

## 3. Chunking

Chunking split văn bản thành đoạn nhỏ để retrieval hiệu quả.

Config:

- `chunkSize`: lấy từ settings, không hard-code.
- `chunkOverlap`: lấy từ settings, không hard-code.

Yêu cầu:

- Không cắt quá nhỏ làm mất ngữ cảnh.
- Không cắt quá dài làm retrieval kém chính xác.
- Với PDF, cố gắng giữ page number.
- Với article, giữ title/category.

## 4. Embedding

RAG service tạo vector cho từng chunk bằng embedding model.

Embedding model lấy từ:

- `.env`, hoặc
- backend settings truyền sang, hoặc
- cấu hình RAG service.

Không hard-code model trong code.

## 5. Vector database

Qdrant lưu:

- Vector.
- Chunk text.
- Chunk metadata.

Collection gợi ý:

- `history_chunks`

## Metadata chunk bắt buộc

```json
{
  "chunkId": "chunk-001",
  "sourceId": "source-001",
  "sourceType": "DOCUMENT",
  "documentId": 10,
  "articleId": null,
  "fileName": "Lich-su-Viet-Nam.pdf",
  "pageNumber": 45,
  "chunkIndex": 8,
  "sourceUrl": null,
  "title": "Lịch sử Việt Nam",
  "categoryName": "Nhà Đinh",
  "createdAt": "2026-05-20T10:00:00"
}
```

## 6. Retrieval

Khi user hỏi:

1. RAG service embed câu hỏi.
2. Search Qdrant lấy topK chunks.
3. topK lấy từ settings, không hard-code.
4. Lọc theo score threshold nếu cần.

Ví dụ query:

```text
Question: "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?"
TopK chunks:
- Article chunk về căn cứ Hoa Lư.
- PDF chunk về bối cảnh loạn 12 sứ quân.
- Wiki chunk về các sứ quân.
```

## 7. Graph retrieval

Nếu câu hỏi liên quan quan hệ/gia phả, RAG service query Neo4j:

- Cha/con/vợ/chồng.
- Vua/tướng.
- Nhân vật/triều đại.
- Nhân vật/sự kiện.
- Sự kiện/địa danh.

Question router quyết định:

- Vector only.
- Graph only.
- Vector + Graph.

## 8. Prompt building

Prompt gồm:

- System instruction.
- Câu hỏi user.
- Context từ vector chunks.
- Context từ graph nếu có.
- Yêu cầu trả lời tiếng Việt.
- Yêu cầu không bịa nếu thiếu nguồn.
- Yêu cầu trả citations.

Prompt không hard-code trong Python class. Nên để trong file prompt hoặc settings.

## 9. LLM answer generation

LLM chỉ được dùng context đã retrieve để trả lời. Nếu context không đủ, câu trả lời nên nói rõ:

```text
Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn.
```

Không nên tạo câu trả lời chắc chắn khi citation yếu hoặc không có source.

## 10. Citation/source tracking

Mỗi answer phải trả `citations`.

Citation có thể đến từ:

- PDF document.
- Article.
- URL/Wiki.
- Manual input.
- Graph relationship.

Backend lưu citations vào `chat_messages.citations_json`.

## 11. Evaluation

Đánh giá RAG theo:

- Retrieval accuracy.
- Answer correctness.
- Citation accuracy.
- Hallucination rate.
- Graph relationship accuracy.
- Latency.
- Cost per query.

Nên có bộ test 20-50 câu để demo và đo chất lượng.

## Lưu ý vận hành

- Khi source update, cần re-ingest.
- Khi source delete, nên xóa vector theo `sourceId`.
- Nếu ingest lỗi, lưu `errorMessage`.
- Nếu LLM lỗi, backend vẫn nên lưu user message và trả lỗi thân thiện.
- Với đồ án nhỏ, có thể xử lý ingestion đồng bộ trước; sau đó mới nâng cấp sang background job nếu còn thời gian.

