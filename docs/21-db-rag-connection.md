# 21. DB ↔ RAG Connection

Tài liệu này định nghĩa **hợp đồng kết nối** giữa MySQL (20+ bảng, [20-logical-erd.md](20-logical-erd.md)) và RAG service (FastAPI + Qdrant + Neo4j). Mục tiêu: schema và pipeline được thiết kế sẵn để RAG implement sau mà không phải sửa lại DB.

## Nguyên tắc gốc

> **RAG service KHÔNG kết nối thẳng MySQL. Mọi dữ liệu SQL tới RAG đều qua Spring Boot + payload Qdrant.**

Trong sơ đồ kiến trúc ([02-system-architecture.md](02-system-architecture.md)), FastAPI chỉ có đường tới Qdrant/Neo4j/LLM — **không có** đường tới MySQL. Chỉ Spring Boot chạm MySQL (JDBC/JPA).

### Vì sao không cho RAG đọc thẳng MySQL?

| | Pattern 1: RAG đọc thẳng MySQL | Pattern 2: đẩy qua Spring Boot ✅ |
|---|---|---|
| Ai đọc MySQL | FastAPI có driver MySQL riêng | Chỉ Spring Boot |
| Hệ quả migrate | Phải sửa **cả JPA entity (Java) lẫn model (Python)** đồng bộ | Chỉ Spring Boot bám schema |
| Tính swappable | RAG bị khóa vào schema MySQL | RAG stateless, dễ thay/dễ demo |
| Bảo mật | Lộ thêm credential MySQL cho service Python | RAG chỉ cần Qdrant/Neo4j/LLM key |

→ Chọn **Pattern 2**. "Embed worker" trong sơ đồ ERD = **handler ingest bên trong FastAPI**, được Spring Boot "đút" content vào — KHÔNG phải process Python tự đọc MySQL.

## Sơ đồ kết nối 2 chiều

```text
CHIỀU INGEST (ghi)                            CHIỀU QUERY (đọc)

MySQL (source of truth)                        User hỏi
  │ Spring Boot đọc + JOIN sẵn                    │ Spring Boot
  │ (article+tag+event+period+person…)            ▼
  ▼ POST /rag/ingest {content, metadata}       POST /rag/chat {question, filters}
embed worker (FastAPI)                            │ FastAPI: embed → Qdrant search
  │ chunk → embed → upsert Qdrant                  ▼ (filter bằng payload đã denorm)
  ▼ trả {chunks:[{point_id,hash}]}             top-k chunks (payload có source_id)
Spring Boot ghi rag_chunks                        │ build prompt → LLM
  │ set data_sources.last_ingested_at             ▼
  ▼                                             answer + citations[{source_id,…}]
(historical entity → POST /rag/graph/sync         │ Spring Boot
   → Neo4j; set graph_synced_at)                   ▼ lưu chat_messages.citations_json → FE
```

**Mấu chốt:** mọi JOIN của 20 bảng xảy ra ở **Spring Boot tại thời điểm ingest**, kết quả ép phẳng vào **payload Qdrant**. Lúc query, RAG **không cần JOIN MySQL live**.

## DB phải "lộ" gì cho RAG (đã bake vào ERD)

1. **`data_sources` = hub duy nhất** (thêm `event_id`, `person_id`, source_type `EVENT`/`PERSON`): mọi thứ embeddable có 1 dòng `data_sources`. Citation luôn resolve qua hub.
2. **`rag_chunks`** (`source_id` FK `data_sources`): index MySQL-side của những gì có trong Qdrant → biết cái gì cần re-embed, và xóa vector theo `source_id`.
3. **Payload Qdrant** = nơi ép phẳng quan hệ (Spring Boot denormalize lúc ingest).
4. **`graph_synced_at`** trên bảng lịch sử: theo dõi sync Neo4j.

### Payload Qdrant bắt buộc theo từng nguồn

| Nguồn | Payload (Spring Boot JOIN sẵn rồi nhét vào) |
|---|---|
| `articles` | `source_id, source_type, article_id, category_id, tag_ids[], event_ids[], period_ids[], title, slug, chunk_index` |
| `events` | `source_id, event_id, period_ids[], location_ids[], person_ids[], year_start, year_end, certainty_level` |
| `persons` | `source_id, person_id, period_ids[], event_ids[]` |
| `documents` / `URL` / `MANUAL_INPUT` | `source_id, source_type, document_id, page_number, source_url, title` |

→ Filter ví dụ "period_id IN (Trần) AND person_ids CONTAINS (Trần Hưng Đạo)" chạy được nhờ các field này nằm sẵn trong payload, không đụng MySQL.

## Hợp đồng API

Mở rộng từ [12-api-design.md](12-api-design.md). FE không gọi các endpoint này; chỉ Spring Boot gọi.

### `POST /rag/ingest`

Request (đã có ở doc 12, bổ sung metadata denorm):
```jsonc
{
  "sourceId": 101,
  "sourceType": "ARTICLE",
  "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
  "articleId": 12, "documentId": null, "eventId": null, "personId": null,
  "filePath": null, "sourceUrl": null, "rawContent": "<nội dung đã extract>",
  "metadata": {
    "categoryId": 1, "categoryName": "Nhà Đinh",
    "tagIds": [3, 7], "eventIds": [21], "periodIds": [5]
  },
  "settings": { "chunkSize": 800, "chunkOverlap": 120, "embeddingModel": "text-embedding-3-small" }
}
```

Response (**phần đang thiếu trong doc 12 — Spring Boot cần để ghi `rag_chunks`**):
```jsonc
{
  "sourceId": 101, "status": "COMPLETED",
  "collection": "history_chunks", "embeddingModel": "text-embedding-3-small",
  "chunks": [
    { "chunkIndex": 0, "qdrantPointId": "p-abc", "contentHash": "9f2c…" },
    { "chunkIndex": 1, "qdrantPointId": "p-def", "contentHash": "1a7b…" }
  ]
}
```

### `POST /rag/graph/sync` (mới — cho Design B)
```jsonc
{
  "nodes": [
    { "type": "Person", "id": 7, "props": { "name": "Trần Hưng Đạo", "alias": "…" } },
    { "type": "Event",  "id": 21, "props": { "name": "Kháng chiến Mông-Nguyên lần 2", "year": 1285 } }
  ],
  "relationships": [
    { "type": "PARTICIPATED_IN", "from": {"type":"Person","id":7}, "to": {"type":"Event","id":21},
      "props": { "role": "GENERAL", "confidence": 0.95, "evidenceSourceId": 55 } }
  ]
}
```
→ FastAPI `MERGE` node/rel vào Neo4j; Spring Boot set `graph_synced_at = now()`.

### `POST /rag/delete?sourceId=101`
Xóa toàn bộ điểm Qdrant theo `source_id`. Spring Boot xóa các dòng `rag_chunks` tương ứng (hoặc để ON DELETE CASCADE từ `data_sources`).

### `POST /rag/chat`
Như doc 12; response trả `citations[]` mang `sourceId` + payload metadata. Spring Boot lưu vào `chat_messages.citations_json`; nếu cần dữ liệu mới nhất để hiển thị, resolve `sourceId → data_sources → article/event` ở phía Spring Boot.

## Vòng đời (Spring Boot điều phối)

| Sự kiện ở MySQL | Spring Boot làm gì |
|---|---|
| Tạo/sửa article, event, person | upsert `data_sources` → tạo `ingestion_jobs`(PENDING) → `POST /rag/ingest` → ghi `rag_chunks` + job=COMPLETED + `last_ingested_at` |
| Sửa nội dung | so `content_hash`; khác → `POST /rag/delete` điểm cũ → ingest lại |
| Xóa nguồn | `POST /rag/delete?sourceId=` → xóa `rag_chunks` → (nếu là entity) xóa node Neo4j |
| Tạo/sửa entity lịch sử | thêm `POST /rag/graph/sync` → set `graph_synced_at` |

## Cần làm NGAY (RAG để sau vẫn không kẹt)

1. ✅ Schema: 4 delta đã bake vào [20-logical-erd.md](20-logical-erd.md) + [V1__init.sql](../backend/src/main/resources/db/migration/V1__init.sql).
2. ⏳ Stub 3 endpoint FastAPI (`/rag/ingest`, `/rag/graph/sync`, `/rag/delete`) trả mock — đúng tinh thần "đang mock" trong [README](../README.md).
3. ⏳ Spring Boot: module `datasource` + `rag` client đọc/ghi `data_sources`, `ingestion_jobs`, `rag_chunks` theo hợp đồng trên (chưa cần embed thật).

Khi làm RAG thật sau này, **chỉ thay phần lõi trong FastAPI** (chunk/embed/Qdrant/Neo4j/LLM) — hợp đồng API và schema MySQL không đổi.
