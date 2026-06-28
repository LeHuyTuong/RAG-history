# 28. Neo4j + Frontend Implementation Plan

## Mục tiêu

Tài liệu này mô tả kế hoạch triển khai Neo4j Graph RAG và kết nối frontend cho History RAG.

Mục tiêu cuối cùng:

- Frontend chỉ gọi Spring Boot, không gọi trực tiếp FastAPI hoặc Neo4j.
- Spring Boot expose API graph/RAG ổn định cho frontend.
- FastAPI RAG service xử lý Neo4j query, graph retrieval và kết hợp graph context vào câu trả lời.
- Chatbot biết khi nào dùng vector, khi nào dùng graph, khi nào dùng cả hai.
- Câu trả lời graph phải có citation/evidence, không trả lời chắc chắn khi thiếu dữ liệu.

## Trạng thái hiện tại

### Đã có

- FastAPI RAG service đã có vector RAG:
  - `/rag/health`
  - `/rag/ingest`
  - `/rag/delete`
  - `/rag/retrieve`
  - `/rag/chat`
  - `/rag/chat/stream`
- Spring Boot đã có gateway RAG dưới `/api/v1/rag`:
  - `/health`
  - `/chat`
  - `/chat/stream`
  - `/retrieve`
  - `/ingest`
  - `/sources/{sourceId}`
- Offline evaluator đã có cho answer correctness/faithfulness.
- Frontend có `ChatBox.jsx`, mock data trong `public/api`, nhưng chưa nối RAG/Graph API thật.

### Chưa có

- `rag-service/app/graph` chưa có Neo4j client/query service.
- `backend/feature/graph` gần như trống.
- `question_router_service.py` hiện vẫn luôn trả `use_graph=False`.
- Chat response chưa có graph citation riêng.
- Frontend chưa có graph API client, family tree panel, graph evidence panel.

## Kiến trúc target

```text
React Frontend
  |
  | /api/v1/rag/*
  | /api/v1/graph/*
  v
Spring Boot Backend
  |
  | /rag/*
  | /rag/graph/*
  v
FastAPI RAG Service
  |
  | Qdrant vector search
  | Neo4j graph query
  | Google LLM
  v
Answer + vector citations + graph citations
```

Rule quan trọng:

- Frontend không gọi FastAPI.
- Frontend không gọi Neo4j.
- Spring Boot là API gateway duy nhất cho UI.
- FastAPI là nơi xử lý retrieval, prompt, LLM và Neo4j query.

## Phase 1: Neo4j foundation trong FastAPI

### Files cần tạo

```text
rag-service/app/graph/__init__.py
rag-service/app/graph/neo4j_client.py
rag-service/app/graph/graph_repository.py
rag-service/app/services/graph_service.py
rag-service/app/schemas/graph.py
rag-service/app/api/graph_routes.py
rag-service/tests/test_graph_routes.py
rag-service/tests/test_graph_service.py
```

### Config cần thêm

Trong `rag-service/app/config.py`:

```python
neo4j_uri: str | None = None
neo4j_user: str | None = None
neo4j_password: str | None = None
neo4j_database: str = "neo4j"
```

Trong `.env.example`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=change-neo4j
NEO4J_DATABASE=neo4j
```

Không commit `.env` thật.

### Python dependency

Trong `rag-service/requirements.txt`:

```text
neo4j>=5.20.0
```

### Neo4j client

`neo4j_client.py`:

- Singleton driver.
- Có `get_driver()`.
- Có `verify_connectivity()`.
- Có `close_driver()` để test hoặc shutdown sau này.

Yêu cầu:

- Nếu thiếu `NEO4J_URI`, trả lỗi cấu hình rõ ràng.
- Không hard-code username/password.
- Không expose raw driver ra API route.

## Phase 2: Graph schema và query service

### Node model

Neo4j nodes target:

```text
(:Person {
  id,
  name,
  slug,
  alias,
  birthYear,
  deathYear,
  description
})

(:Event {
  id,
  name,
  slug,
  startYear,
  endYear,
  description
})

(:Period {
  id,
  name,
  slug,
  startYear,
  endYear
})

(:Location {
  id,
  name,
  slug,
  locationType,
  latitude,
  longitude
})

(:Source {
  id,
  title,
  sourceType,
  sourceUrl,
  documentId,
  pageNumber
})
```

### Relationship model

Target relationships:

```text
(:Person)-[:PARENT_OF]->(:Person)
(:Person)-[:SPOUSE_OF]->(:Person)
(:Person)-[:CHILD_OF]->(:Person)
(:Person)-[:RULED_DURING]->(:Period)
(:Person)-[:PARTICIPATED_IN {role, confidence, note}]->(:Event)
(:Event)-[:IN_PERIOD]->(:Period)
(:Event)-[:HAPPENED_AT]->(:Location)
(:Event)-[:EVIDENCED_BY {pageNumber, confidence, note}]->(:Source)
(:Person)-[:EVIDENCED_BY {pageNumber, confidence, note}]->(:Source)
```

### Graph DTOs

`rag-service/app/schemas/graph.py`:

```python
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    properties: dict = {}

class GraphRelationship(BaseModel):
    id: str
    type: str
    sourceId: str
    targetId: str
    properties: dict = {}
    confidence: float | None = None
    evidence: list[GraphEvidence] = []

class GraphEvidence(BaseModel):
    sourceType: str = "GRAPH"
    sourceId: str | None = None
    sourceTitle: str | None = None
    documentId: int | None = None
    pageNumber: int | None = None
    note: str | None = None
    confidence: float | None = None

class GraphQueryRequest(BaseModel):
    question: str
    entityName: str | None = None
    relationTypes: list[str] = []
    limit: int = 20

class GraphQueryResponse(BaseModel):
    queryType: str
    nodes: list[GraphNode]
    relationships: list[GraphRelationship]
    evidence: list[GraphEvidence]

class PersonSearchRequest(BaseModel):
    name: str
    limit: int = 10

class FamilyTreeRequest(BaseModel):
    personId: str | None = None
    personName: str | None = None
    depth: int = 2
```

## Phase 3: FastAPI graph endpoints

### Endpoints

```text
GET  /rag/graph/health
POST /rag/graph/person-search
POST /rag/graph/family-tree
POST /rag/graph/query
```

### `/rag/graph/health`

Trả:

```json
{
  "status": "ok",
  "service": "neo4j-graph",
  "connected": true
}
```

Nếu chưa config Neo4j:

```json
{
  "status": "not_configured",
  "service": "neo4j-graph",
  "connected": false
}
```

### `/rag/graph/person-search`

Request:

```json
{
  "name": "Trần Hưng Đạo",
  "limit": 10
}
```

Response:

```json
{
  "queryType": "PERSON_SEARCH",
  "nodes": [
    {
      "id": "person:123",
      "label": "Trần Hưng Đạo",
      "type": "Person",
      "properties": {
        "slug": "tran-hung-dao",
        "alias": "Hưng Đạo Đại Vương"
      }
    }
  ],
  "relationships": [],
  "evidence": []
}
```

### `/rag/graph/family-tree`

Request:

```json
{
  "personName": "Đinh Bộ Lĩnh",
  "depth": 2
}
```

Response:

```json
{
  "queryType": "FAMILY_TREE",
  "nodes": [],
  "relationships": [],
  "evidence": []
}
```

### `/rag/graph/query`

Request:

```json
{
  "question": "Con của Đinh Bộ Lĩnh gồm những ai?",
  "entityName": "Đinh Bộ Lĩnh",
  "relationTypes": ["PARENT_OF"],
  "limit": 20
}
```

Response:

```json
{
  "queryType": "GRAPH_QUERY",
  "nodes": [],
  "relationships": [],
  "evidence": []
}
```

## Phase 4: Cypher query rules

Không nhận raw Cypher từ user.

Chỉ dùng query template đã định nghĩa sẵn:

### Person search

```cypher
MATCH (p:Person)
WHERE toLower(p.name) CONTAINS toLower($name)
   OR toLower(coalesce(p.alias, "")) CONTAINS toLower($name)
RETURN p
LIMIT $limit
```

### Family tree

```cypher
MATCH path = (root:Person)-[r:PARENT_OF|CHILD_OF|SPOUSE_OF*1..2]-(relative:Person)
WHERE root.id = $personId
RETURN path
LIMIT $limit
```

### Person relationships

```cypher
MATCH (p:Person)-[r]-(target)
WHERE p.id = $personId
  AND type(r) IN $relationTypes
RETURN p, r, target
LIMIT $limit
```

### Event participation

```cypher
MATCH (p:Person)-[r:PARTICIPATED_IN]->(e:Event)
WHERE p.id = $personId
RETURN p, r, e
LIMIT $limit
```

## Phase 5: Tích hợp graph vào chat RAG

### Files cần sửa

```text
rag-service/app/services/question_router_service.py
rag-service/app/services/graph_service.py
rag-service/app/services/prompt_service.py
rag-service/app/api/chat_routes.py
rag-service/app/schemas/chat.py
```

### Router target

`question_router_service.route()` nên trả:

```python
{
    "use_vector": True,
    "use_graph": False,
    "query_type": "VECTOR_ONLY"
}
```

Các query type:

- `VECTOR_ONLY`
- `GRAPH_ONLY`
- `VECTOR_AND_GRAPH`

### Rule detect graph

Dùng keyword rule trước:

| Dấu hiệu | Query type |
|---|---|
| `cha của`, `mẹ của`, `con của`, `vợ của`, `chồng của` | `GRAPH_ONLY` |
| `quan hệ giữa`, `liên hệ giữa` | `GRAPH_ONLY` |
| `thuộc triều đại nào`, `trị vì thời nào` | `GRAPH_ONLY` |
| `tham gia sự kiện nào`, `vai trò trong sự kiện` | `VECTOR_AND_GRAPH` |
| `vì sao`, `nguyên nhân`, `ý nghĩa`, `bối cảnh`, `so sánh` | `VECTOR_ONLY` |

### Prompt target

Prompt user message nên có thêm:

```text
VECTOR CONTEXT:
[C1] ...

GRAPH CONTEXT:
[G1]
relationship=PARENT_OF
source=Đinh Bộ Lĩnh
target=Đinh Liễn
confidence=0.9
evidence=...

QUESTION:
...
```

### Chat response target

Mở rộng `RagChatResponse`:

```json
{
  "answer": "...",
  "citations": [],
  "graphCitations": [],
  "usedVector": true,
  "usedGraph": true
}
```

Giữ `citations` cho vector citations để không phá frontend cũ.

## Phase 6: Spring Boot graph gateway

### Files cần tạo

```text
backend/src/main/java/com/example/historyrag/feature/graph/GraphController.java
backend/src/main/java/com/example/historyrag/feature/graph/GraphService.java
backend/src/main/java/com/example/historyrag/feature/graph/GraphServiceImpl.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/GraphNodeResponse.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/GraphRelationshipResponse.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/GraphEvidenceResponse.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/GraphQueryRequest.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/GraphQueryResponse.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/PersonSearchRequest.java
backend/src/main/java/com/example/historyrag/feature/graph/dto/FamilyTreeRequest.java
backend/src/main/java/com/example/historyrag/infrastructure/webclient/GraphClientService.java
backend/src/main/java/com/example/historyrag/infrastructure/webclient/GraphClientServiceImpl.java
```

### Spring Boot endpoints

```text
GET  /api/v1/graph/health
GET  /api/v1/graph/persons/search?name=...
GET  /api/v1/graph/persons/{personId}/family-tree?depth=2
GET  /api/v1/graph/persons/{personId}/relationships
POST /api/v1/graph/query
```

### Mapping sang FastAPI

| Spring Boot | FastAPI |
|---|---|
| `GET /api/v1/graph/health` | `GET /rag/graph/health` |
| `GET /api/v1/graph/persons/search` | `POST /rag/graph/person-search` |
| `GET /api/v1/graph/persons/{id}/family-tree` | `POST /rag/graph/family-tree` |
| `GET /api/v1/graph/persons/{id}/relationships` | `POST /rag/graph/query` |
| `POST /api/v1/graph/query` | `POST /rag/graph/query` |

### Validation

- `name` không được blank.
- `depth` từ 1 đến 4.
- `limit` từ 1 đến 100.
- `relationTypes` chỉ cho allow-list:
  - `PARENT_OF`
  - `CHILD_OF`
  - `SPOUSE_OF`
  - `RULED_DURING`
  - `PARTICIPATED_IN`
  - `HAPPENED_AT`
  - `IN_PERIOD`

## Phase 7: Sync MySQL sang Neo4j

### Mục tiêu

MySQL vẫn là source of truth. Neo4j là graph projection để query nhanh quan hệ.

### Cách làm MVP

Ưu tiên script/manual sync trước, chưa cần event-driven phức tạp.

FastAPI endpoint:

```text
POST /rag/graph/sync
```

Hoặc Spring Boot admin endpoint:

```text
POST /api/v1/admin/graph/sync
```

### Dữ liệu sync

Từ MySQL:

- `person`
- `event`
- `period`
- `location`
- `source`
- `participation`
- `event_location`
- `event_source`

Vào Neo4j:

- `Person`
- `Event`
- `Period`
- `Location`
- `Source`
- relationships tương ứng.

### Strategy

MVP:

1. Xóa graph projection theo label dự án nếu cần.
2. Upsert nodes bằng `MERGE`.
3. Upsert relationships bằng `MERGE`.
4. Gắn evidence metadata lên relationship.
5. Trả report:

```json
{
  "status": "COMPLETED",
  "nodesUpserted": 120,
  "relationshipsUpserted": 300,
  "errors": []
}
```

## Phase 8: Frontend API clients

### Files cần tạo

```text
frontend/src/api/httpClient.js
frontend/src/api/ragApi.js
frontend/src/api/graphApi.js
```

### `httpClient.js`

Trách nhiệm:

- Base URL lấy từ env.
- Tự gắn JWT token nếu có.
- Parse `ApiResponse<T>`.
- Throw lỗi rõ ràng cho UI.

Env:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### `ragApi.js`

Functions:

```js
export async function ragHealth()
export async function ragChat(request)
export async function ragRetrieve(request)
export async function ragIngest(request)
export async function ragDeleteSource(sourceId)
export function streamRagChat(request, handlers)
```

### `graphApi.js`

Functions:

```js
export async function graphHealth()
export async function searchPersons(name)
export async function getFamilyTree(personId, depth = 2)
export async function getPersonRelationships(personId)
export async function queryGraph(request)
```

## Phase 9: Frontend UI

### Chat UI

File hiện có:

```text
frontend/src/components/ChatBox.jsx
```

Nâng cấp:

- Gọi `ragChat` hoặc `streamRagChat`.
- Hiển thị loading state.
- Hiển thị error state.
- Hiển thị citations.
- Hiển thị `usedVector`, `usedGraph`.
- Có toggle `Graph`:
  - `Auto`
  - `Vector only`
  - `Vector + Graph`

### Debug retrieve UI

Component:

```text
frontend/src/components/RagRetrieveDebugPanel.jsx
```

Chỉ hiển thị cho admin/dev.

Nội dung:

- Input question.
- topK selector.
- sourceId/tag filter nếu cần.
- List hits:
  - title
  - pageNumber
  - chunkIndex
  - score
  - chunkText preview

Mục đích: sau khi ingest PDF, kiểm tra Qdrant có trả đúng chunk chưa.

### Family tree UI

Components:

```text
frontend/src/components/FamilyTreePanel.jsx
frontend/src/components/GraphNodeList.jsx
frontend/src/components/GraphRelationshipList.jsx
frontend/src/components/GraphEvidencePanel.jsx
```

MVP render không cần thư viện graph phức tạp:

- Search person.
- Chọn person.
- Hiển thị cây dạng nested list hoặc table.
- Hiển thị relationship evidence.

Sau khi ổn mới thêm visualization library.

## Phase 10: Tests

### FastAPI tests

```text
rag-service/tests/test_graph_routes.py
rag-service/tests/test_graph_service.py
rag-service/tests/test_question_router_service.py
rag-service/tests/test_chat_routes.py
```

Cases:

- Neo4j health ok.
- Neo4j not configured.
- Person search returns nodes.
- Family tree returns relationships.
- Graph query rejects unsafe relation type.
- Chat graph-only returns `usedGraph=true`.
- Chat vector-only keeps `usedGraph=false`.
- Chat vector+graph includes both contexts.

### Spring Boot tests

```text
backend/src/test/java/com/example/historyrag/feature/graph/GraphControllerTest.java
backend/src/test/java/com/example/historyrag/feature/graph/GraphServiceImplTest.java
backend/src/test/java/com/example/historyrag/infrastructure/webclient/GraphClientServiceImplTest.java
```

Cases:

- Controller wraps response in `ApiResponse`.
- Validation rejects blank `name`.
- Validation rejects invalid `depth`.
- WebClient maps Spring endpoint to FastAPI endpoint.
- `traceparent` is forwarded.

### Frontend tests

Nếu chưa có test setup, tối thiểu làm manual smoke checklist trước.

Manual smoke:

1. Open chat.
2. Ask vector question.
3. Ask graph question.
4. Check citations render.
5. Search person.
6. Open family tree.
7. Inspect graph evidence.
8. Toggle graph mode.

## Phase 11: E2E checklist

### Local services

```text
MySQL      localhost:3307
Qdrant     cloud or localhost
Neo4j      bolt://localhost:7687
FastAPI    http://localhost:8001
Spring     http://localhost:8080
Frontend   http://localhost:5173
```

### Flow cần pass

1. Admin tạo/source PDF hoặc manual content.
2. Spring Boot gọi `/api/v1/rag/ingest`.
3. FastAPI lưu chunks vào Qdrant.
4. Graph sync tạo nodes/relationships trong Neo4j.
5. Frontend hỏi câu vector.
6. Frontend hỏi câu graph.
7. Frontend hỏi câu vector + graph.
8. Response có citations.
9. Response không bịa khi thiếu evidence.
10. Offline evaluator chạy được.

## Phase 12: Evaluation mở rộng cho graph

Hiện evaluator đã có:

- `correctness_score`
- `faithfulness_score`
- `hallucination_flag`

Nên thêm:

- `graph_correctness_score`
- `graph_citation_hit`
- `graph_relationship_hit`
- `expected_relationships`
- `actual_relationships`

Ví dụ output:

```csv
qid,question,expected_answer,actual_answer,citations,correctness_score,faithfulness_score,hallucination_flag,graph_correctness_score,graph_citation_hit
G001,Con của Đinh Bộ Lĩnh gồm những ai?,Đinh Liễn...,Đinh Liễn [G1].,...,3,3,false,3,true
```

## Thứ tự code đề xuất

Nên code theo thứ tự này:

1. `rag-service` Neo4j config + client.
2. `/rag/graph/health`.
3. `/rag/graph/person-search`.
4. `/rag/graph/family-tree`.
5. `/rag/graph/query`.
6. FastAPI tests cho graph.
7. Spring Boot `feature/graph` gateway.
8. Spring Boot tests cho graph gateway.
9. Frontend `httpClient`, `ragApi`, `graphApi`.
10. Frontend update `ChatBox.jsx` gọi RAG thật.
11. Frontend `FamilyTreePanel`.
12. Tích hợp graph vào `/rag/chat`.
13. E2E local.
14. Mở rộng evaluator graph.

## Tiêu chí hoàn thành

Một implementation được coi là ổn khi:

- `GET /rag/graph/health` báo Neo4j connected.
- `GET /api/v1/graph/health` qua Spring Boot trả ok.
- Person search tìm được nhân vật trong Neo4j.
- Family tree trả nodes + relationships.
- Chat câu graph trả `usedGraph=true`.
- Chat câu vector vẫn trả `usedVector=true`, `usedGraph=false`.
- Chat câu vector+graph trả cả vector citations và graph citations.
- Frontend không gọi FastAPI trực tiếp.
- Tests FastAPI pass.
- Tests Spring Boot graph pass.
- Manual E2E pass.
- Không commit `.env`, API key, Neo4j password thật.

## Rủi ro cần tránh

- Không cho user gửi raw Cypher.
- Không dùng Neo4j làm source of truth thay MySQL trong MVP.
- Không trả lời graph nếu relationship không có evidence.
- Không để frontend gọi thẳng Neo4j/FastAPI.
- Không trộn graph citation vào vector citation mà không có `sourceType`.
- Không phá contract `/api/v1/rag/chat` hiện có.

