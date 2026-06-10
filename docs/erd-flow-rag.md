# ERD Lịch sử Việt Nam — Flow, Màn hình & Tích hợp RAG

> Tài liệu thiết kế cho website lịch sử Việt Nam với 11 entity conceptual, ~20 flow, 24 màn hình và pipeline RAG.

---

## A. Flow có được (~20 flow)

### Public (10 flow)

| # | Flow | Đi qua entity nào |
|---|---|---|
| 1 | Trang chủ | Post (sort by date) |
| 2 | Duyệt theo Tag | Post ← Tag |
| 3 | Duyệt theo Thời kỳ | Event ← Period (rồi list Post liên quan) |
| 4 | Đọc bài viết | Post + Tag + Event |
| 5 | Xem sự kiện | Event + Period + Location + Source + Participation → Person |
| 6 | Xem nhân vật | Person + Participation → Event |
| 7 | Xem địa danh | Location + Event |
| 8 | Xem sử liệu | Source + Event |
| 9 | Timeline | Event sort theo năm |
| 10 | Search | Full-text Post |

### Member (4 flow)

| # | Flow | Đi qua entity nào |
|---|---|---|
| 11 | Đăng ký / Đăng nhập | Member |
| 12 | Like / Bookmark / Comment | Engagement → Post |
| 13 | Trang cá nhân | Member + Engagement history |
| 14 | Lịch sử đọc | Engagement (type=view) |

### Admin (6 flow)

| # | Flow | Đi qua entity nào |
|---|---|---|
| 15 | Dashboard | — |
| 16 | CRUD Post | Post + Tag + Event |
| 17 | CRUD Event | Event + Period + Location + Source + Participation |
| 18 | CRUD Person / Location / Source | từng entity |
| 19 | Quản lý Tag, Period | metadata |
| 20 | Duyệt Engagement (comment) | Engagement.text moderation |

**Tổng: ~20 flow với 11 entity.**

### Flow KHÔNG có (do thiếu entity)

| Flow | Thiếu entity |
|---|---|
| Cây gia phả | **Kinship** (Person ↔ Person) |
| Trích dẫn nguồn ở Post (page, quote) | **Citation** — Source hiện chỉ gắn Event |
| Phân loại theo Chủ đề chính | **Category** — chỉ có Tag |
| Reply lồng comment | Engagement không có `parent_id` |

---

## B. Màn hình cần thiết kế (24 màn)

### Public website (15 màn)

| # | Màn hình | Route |
|---|---|---|
| 1 | Trang chủ | `/` |
| 2 | Danh sách bài viết | `/bai-viet` |
| 3 | Chi tiết bài viết | `/bai-viet/:slug` |
| 4 | Trang Tag | `/tag/:slug` |
| 5 | Trang Thời kỳ | `/thoi-ky/:slug` |
| 6 | Danh sách Sự kiện | `/su-kien` |
| 7 | Chi tiết Sự kiện | `/su-kien/:slug` |
| 8 | Danh sách Nhân vật | `/nhan-vat` |
| 9 | Chi tiết Nhân vật | `/nhan-vat/:slug` |
| 10 | Danh sách Địa danh | `/dia-danh` |
| 11 | Chi tiết Địa danh | `/dia-danh/:slug` |
| 12 | Thư viện Sử liệu | `/su-lieu` |
| 13 | Chi tiết Sử liệu | `/su-lieu/:slug` |
| 14 | Timeline | `/dong-thoi-gian` |
| 15 | Kết quả tìm kiếm | `/search?q=` |

### Member (4 màn)

| # | Màn hình | Route |
|---|---|---|
| 16 | Đăng ký / Đăng nhập | `/dang-nhap` |
| 17 | Trang cá nhân | `/toi` |
| 18 | Bookmark / Lịch sử | `/toi/bookmark` |
| 19 | Chatbot RAG | `/hoi-dap` |

### Admin (5 màn)

| # | Màn hình | Route |
|---|---|---|
| 20 | Dashboard | `/admin` |
| 21 | Quản lý Post | `/admin/posts` (list + editor) |
| 22 | Quản lý thực thể lịch sử | `/admin/events`, `/persons`, `/locations`, `/sources` |
| 23 | Quản lý metadata | `/admin/tags`, `/periods` |
| 24 | Duyệt comment | `/admin/engagements` |

---

## C. Kết hợp RAG với ERD

### Kiến trúc

```
MySQL (11 entity ERD)            Qdrant (vector)
       │                                ▲
       │ sync                           │
       └──► embed worker ───────────────┘
            (lấy text từ Post/Event/Person/Source)
```

### Embed gì → metadata gì

| Nguồn embed | Chunk text | Payload metadata (lấy từ ERD) |
|---|---|---|
| `Post.content` | Chia theo đoạn | `post_id`, `tag_ids[]`, `event_ids[]`, `period_id` |
| `Event.description` | Full | `event_id`, `period_id`, `location_id`, `year_start`, `year_end`, `person_ids[]` |
| `Person.bio` | Theo giai đoạn | `person_id`, `period_id`, `role` |
| `Source.content` | Trích đoạn | `source_id`, `event_ids[]`, `year`, `type` |

→ **4 collection** trong Qdrant (hoặc 1 collection với field `source_type`).

### Flow RAG (màn 19 — Chatbot)

```
User hỏi: "Vai trò Trần Hưng Đạo trong kháng chiến Mông-Nguyên lần 2?"
   │
   ▼
1. Embed câu hỏi
   │
   ▼
2. Qdrant search với filter từ ERD:
      period_id IN (Trần)
      person_ids CONTAINS (Trần Hưng Đạo)
   │
   ▼
3. Lấy top-k chunks → ra: post_id, event_id, source_id
   │
   ▼
4. JOIN MySQL để lấy context giàu:
      - Post.title + content
      - Event.year + Location + Participation
      - Source.title (để cite)
   │
   ▼
5. Gửi LLM với context + yêu cầu citation
   │
   ▼
6. Trả lời + link về Post/Event/Source trong site
```

### Bảng tech cần thêm (không có ở conceptual)

```sql
RagChunk (
  id,
  source_type  ENUM('post','event','person','source'),
  source_id,           -- FK về entity gốc
  chunk_text,
  qdrant_point_id,
  embedded_at,
  content_hash
)
```

→ Conceptual giữ **11 entity**, physical thêm **1 bảng `RagChunk`**. Tổng **12 bảng** ở physical.

### Vấn đề RAG do thiếu entity

| Thiếu | Hậu quả với RAG |
|---|---|
| ❌ Citation | RAG không trả lời được "trích dẫn ở trang nào" — chỉ cite tên Source |
| ❌ Category | Filter theo chủ đề chính kém, phải dựa Tag (Tag thường nhiều, noise hơn) |
| ❌ Kinship | Không trả lời được câu hỏi quan hệ "Trần Hưng Đạo là con ai" |
| ❌ Post ↔ Source direct | Post thuần (không gắn Event) không cite được Source — phải đi vòng |

### 3 màn RAG-powered có thể thêm

| Màn | Mô tả | Dùng RAG thế nào |
|---|---|---|
| Chatbot hỏi đáp | Q&A box | RAG full pipeline |
| Related posts ở Post detail | "Bài liên quan" | Vector similarity trên Post |
| Smart search | Search box | Hybrid: BM25 + vector |

---

## Tóm tắt

| Khía cạnh | Con số |
|---|---|
| Entity conceptual | 11 |
| Bảng physical (+ RagChunk) | 12 |
| Flow chạy được | ~20 |
| Màn hình | ~24 (15 public + 4 member + 5 admin) |
| RAG | OK, nhưng hạn chế cite source ở post-level và quan hệ nhân vật |
