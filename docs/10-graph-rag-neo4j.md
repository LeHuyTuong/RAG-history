# 10. Graph RAG Neo4j

## Neo4j dùng để làm gì?

Neo4j dùng để lưu và truy vấn các quan hệ lịch sử có cấu trúc, đặc biệt là những quan hệ khó biểu diễn tốt bằng văn bản thuần:

- Cây gia phả.
- Quan hệ vua - tướng.
- Nhân vật - triều đại.
- Nhân vật - sự kiện.
- Sự kiện - địa danh.
- Nhân vật - chức danh.

Ví dụ:

```text
(Đinh Bộ Lĩnh)-[:PARENT_OF]->(Đinh Liễn)
(Lê Hoàn)-[:SERVED_UNDER]->(Đinh Bộ Lĩnh)
(Đinh Bộ Lĩnh)-[:RULED]->(Nhà Đinh)
(Loạn 12 sứ quân)-[:HAPPENED_AT]->(Việt Nam)
```

## Phân biệt Vector DB và Neo4j

| Thành phần | Mạnh ở điểm nào | Ví dụ câu hỏi |
|---|---|---|
| Vector DB | Tìm đoạn tài liệu liên quan theo ngữ nghĩa. | "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?" |
| Neo4j | Tìm quan hệ có cấu trúc, đường nối giữa entity. | "Con của Đinh Bộ Lĩnh gồm những ai?" |
| Vector + Neo4j | Vừa cần dữ kiện quan hệ, vừa cần giải thích bằng ngữ cảnh. | "Giải thích vai trò các tướng dưới trướng Đinh Bộ Lĩnh trong việc dẹp loạn." |

## Khi nào dùng Neo4j?

Dùng Neo4j cho câu hỏi quan hệ trực tiếp:

- "Cha của Đinh Bộ Lĩnh là ai?"
- "Con của Đinh Bộ Lĩnh gồm những ai?"
- "Vợ của vua X là ai?"
- "Dưới trướng Đinh Bộ Lĩnh có ai?"
- "Nhân vật A liên quan gì nhân vật B?"
- "Nhân vật này thuộc triều đại nào?"
- "Sự kiện này xảy ra ở đâu?"

## Khi nào dùng Vector DB?

Dùng Vector DB cho câu hỏi cần diễn giải từ tài liệu:

- "Vì sao Đinh Bộ Lĩnh dẹp được loạn 12 sứ quân?"
- "Bối cảnh lịch sử thời kỳ này là gì?"
- "Ý nghĩa của chiến thắng Bạch Đằng là gì?"
- "Những nguyên nhân dẫn đến công cuộc Đổi mới 1986 là gì?"
- "So sánh chính sách của triều Lý và triều Trần."

## Khi nào dùng cả hai?

Dùng cả vector và graph khi câu hỏi vừa cần quan hệ, vừa cần giải thích:

- "Giải thích vai trò các tướng dưới trướng Đinh Bộ Lĩnh trong việc dẹp loạn 12 sứ quân."
- "Quan hệ giữa Trần Hưng Đạo và nhà Trần ảnh hưởng thế nào đến kháng chiến chống Nguyên Mông?"
- "Những nhân vật thuộc nhà Đinh có vai trò gì trong việc xây dựng nhà nước Đại Cồ Việt?"

## Question router

`question_router_service.py` trong RAG service nên phân loại câu hỏi:

| Loại | Dấu hiệu | Retrieval |
|---|---|---|
| `VECTOR_ONLY` | Vì sao, bối cảnh, phân tích, ý nghĩa, so sánh. | Qdrant. |
| `GRAPH_ONLY` | Cha, mẹ, con, vợ, chồng, thuộc triều đại, dưới trướng. | Neo4j. |
| `VECTOR_AND_GRAPH` | Vai trò của nhóm nhân vật, quan hệ kèm giải thích. | Qdrant + Neo4j. |

Với đồ án nhỏ, router có thể làm bằng keyword + rule đơn giản. Không bắt buộc dùng LLM để route.

## Luồng Graph RAG

```text
User question
  |
  v
Question Router
  |
  | nếu cần graph
  v
Neo4j Query Service
  |
  v
Graph facts + relationship citations
  |
  | nếu cần thêm ngữ cảnh
  v
Vector Retrieval
  |
  v
Prompt Builder
  |
  v
LLM
  |
  v
Answer + citations
```

## Graph citation

Graph relationship cũng cần citation. Mỗi relationship nên có metadata:

- `sourceId`
- `sourceType`
- `sourceTitle`
- `sourceUrl`
- `sourceDocumentId`
- `sourcePageNumber`
- `confidence`
- `note`

Ví dụ:

```json
{
  "sourceType": "GRAPH",
  "relationship": "PARENT_OF",
  "source": "Đinh Bộ Lĩnh",
  "target": "Đinh Liễn",
  "evidenceSourceId": "source-001",
  "confidence": 0.9
}
```

## API expose cho frontend

Frontend không gọi Neo4j trực tiếp. Frontend gọi Spring Boot:

- `GET /api/graph/persons/search?name=`
- `GET /api/graph/persons/{id}/family-tree`
- `GET /api/graph/persons/{id}/relationships`
- `GET /api/graph/persons/{id}/subordinates`

Spring Boot gọi FastAPI nếu graph xử lý ở RAG service:

- `POST /rag/graph/family-tree`
- `POST /rag/graph/query`

## Lưu ý dữ liệu lịch sử

Quan hệ lịch sử có thể có tranh luận hoặc nhiều nguồn khác nhau. Vì vậy:

- Relationship nên có `confidence`.
- Relationship nên có `sourceTitle` hoặc `sourceUrl`.
- Nếu dữ liệu chưa chắc, chatbot nên diễn đạt thận trọng.
- Không nên trả lời chắc chắn khi thiếu evidence.

