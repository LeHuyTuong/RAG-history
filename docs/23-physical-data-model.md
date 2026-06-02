# 23. Physical Data Model

> Mô hình vật lý (physical) hiện thực từ logical model [22-logical-erd-v2.md](22-logical-erd-v2.md). DDL chạy được: [`V1__init.sql`](../backend/src/main/resources/db/migration/V1__init.sql) (Flyway, MySQL 8). 17 bảng.

## 1. Quy ước vật lý

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| DBMS | **MySQL 8** | Theo stack dự án |
| Engine | **InnoDB** | Hỗ trợ FK + transaction |
| Charset / Collation | **utf8mb4** | Bắt buộc cho tiếng Việt có dấu (utf8 thường thiếu) |
| Khóa chính | **BIGINT AUTO_INCREMENT** | id tăng tự động, đủ lớn |
| Thời gian | `DATETIME DEFAULT CURRENT_TIMESTAMP`, `updated_at ... ON UPDATE` | Tự set khi tạo/sửa |
| Boolean | `BOOLEAN` (TINYINT(1)) | `revoked` |
| Đặt tên FK | `fk_<bảng>_<đích>` | Dễ đọc lỗi |

## 2. Ánh xạ Logical → Physical (kiểu dữ liệu)

| Logical (doc 22) | Physical (MySQL) | Ghi chú |
|---|---|---|
| `bigint id PK` | `BIGINT AUTO_INCREMENT PRIMARY KEY` | |
| `varchar name` | `VARCHAR(50/100/255/500)` | Cỡ theo ngữ nghĩa: username 50, email/tên 255, title/slug 500 |
| `text` | `TEXT` | summary, description, biography, note |
| `longtext` | `LONGTEXT` | `content`, `chunk_text` (có thể rất dài) |
| `date` | `DATE` | birth_date, start_date |
| `datetime` | `DATETIME` | mốc thời gian + timestamps |
| `decimal` (lat/long) | `DECIMAL(9,6)` | đủ độ chính xác toạ độ |
| `decimal` (confidence) | `DECIMAL(3,2)` | 0.00–1.00 |
| `json` | `JSON` | `metadata_json` (payload denorm) |
| `boolean` | `BOOLEAN` | `revoked` |
| `ip_address` | `VARCHAR(45)` | đủ cho IPv6 |

## 3. Chiến lược khóa ngoại (ON DELETE)

| FK | Hành vi | Vì sao |
|---|---|---|
| `post.admin_id → admin` | **RESTRICT** | Không cho xóa admin còn bài viết (gán lại trước) |
| `post.event_id → event` | **SET NULL** | Xóa sự kiện thì bài vẫn còn, chỉ mất liên kết |
| `event.period_id → period` | **SET NULL** | Tương tự |
| `post_tag`, `event_location`, `participation`, `event_source` | **CASCADE** | Xóa cha thì dòng cầu nối tự mất |
| `engagement.{member,post,parent}` | **CASCADE** | Xóa member/post/comment cha thì kéo theo |
| `refresh_token.{member,admin}` | **CASCADE** | Xóa user thì token mất |
| `rag_chunk.source_id` | **KHÔNG có FK** | Polymorphic — xem mục 4 |

## 4. `rag_chunk` polymorphic — không FK

`rag_chunk` trỏ tới 4 loại nguồn (`POST`/`EVENT`/`PERSON`/`SOURCE`) qua cặp (`source_type`, `source_id`) nên **không thể đặt FK ràng buộc**. Hệ quả phải xử lý ở **tầng ứng dụng (Spring Boot)**:

- Khi xóa/sửa 1 Post/Event/Person/Source → service phải **chủ động** xóa các `rag_chunk` tương ứng **và** điểm trong Qdrant (không có `ON DELETE CASCADE`).
- Ràng buộc trùng: `UNIQUE (source_type, source_id, chunk_index)`.
- Tăng tốc tra cứu: `INDEX (source_type, source_id)` và `INDEX (qdrant_point_id)`.

> Đây là đánh đổi đã chấp nhận ở doc 22: bớt 1 bảng hub, trả giá bằng việc tự lo toàn vẹn ở code.

## 5. Ràng buộc đáng chú ý khác

- `refresh_token`: `CHECK (member_id IS NOT NULL OR admin_id IS NOT NULL)` — token phải thuộc về một bên (MySQL 8.0.16+ enforce CHECK).
- `event_source`: PK kép `(event_id, source_id)` → mỗi cặp sự kiện–nguồn 1 dòng; `page_number` là trang chính. Nếu cần trích nhiều trang/cặp, đổi sang surrogate `id` + `UNIQUE(event_id, source_id, page_number)`.
- `participation`: `UNIQUE (event_id, person_id, role)` — 1 người 1 vai trò trong 1 sự kiện.
- `post`: `FULLTEXT (title, summary, content)` cho tìm kiếm bài viết.

## 6. Thứ tự tạo bảng (FK-safe)

`admin, member → refresh_token → period, person, location → event → post → tag → post_tag → engagement → event_location → participation → source → event_source → rag_chunk → system_settings`. File dùng `SET FOREIGN_KEY_CHECKS=0` lúc tạo cho chắc.

## 7. Seed mặc định (Gemini)

`system_settings` được seed sẵn tham số RAG cho **Gemini** (`text-embedding-004`, **768 chiều** → đúng `vector_size` của collection Qdrant; LLM `gemini-2.0-flash`). Sửa runtime trong admin, **không hard-code**.

## 8. Chạy migration (làm sau — CHƯA gắn Flyway)

> ⏸️ Backend hiện là skeleton, **chưa cài Flyway**. Mục này là hướng dẫn cho lúc bắt tay code backend; giờ `V1__init.sql` chỉ là artifact thiết kế.

Khi đó, để `V1__init.sql` thành schema chính thức:

1. Thêm dependency `flyway-core` + `flyway-mysql` vào `pom.xml`.
2. Đổi `JPA_DDL_AUTO` từ `update` → `validate` (hoặc `none`) để Hibernate không tự đổi schema — Flyway là nguồn schema duy nhất.

Sau đó Flyway tự chạy `V1__init.sql` (trong `db/migration`) mỗi khi Spring Boot khởi động. Thêm Flyway ở bước này **không phải sửa lại SQL**.
