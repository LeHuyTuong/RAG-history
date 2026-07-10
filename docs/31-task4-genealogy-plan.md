# Task 4 — Gia phả triều đại (Lý & Trần): số đời + phát hiện "thất lạc" (API)

## Mục tiêu & bối cảnh

Người dùng muốn: dựng **2 cây gia phả** (nhà Lý, nhà Trần), tính **"bao nhiêu đời"**, và chỉ ra **"thất lạc ở đâu"** (mắt xích kế vị/cha-con bị đứt — có thể do thất lạc sử liệu). Phạm vi lần này: **data + thuật toán, expose qua API. CHƯA làm UI.**

**Thực trạng hạ tầng (đã verify trực tiếp):**
- **Neo4j Aura cloud** (app đang trỏ tới qua `.env`): **SỐNG**, chỉ auto-pause khi lâu không dùng rồi tự thức (free tier). Đang chứa **~69.790 node + 70.296 quan hệ** GraphRAG (labels `Entity`, `Chunk`; trong đó 13.432 `Người`, 674 `Triều_đại`). ⚠️ Lần query đầu sau khi ngủ mất ~30-60s cold-start.
- **Neo4j local docker** (`localhost:7687`): chạy nhưng **rỗng (0 node)** — instance riêng, app KHÔNG dùng. → **Không dùng local; lưu gia phả trên Aura.**
- Đồ thị GraphRAG có sẵn quan hệ cha-con nhưng **nhiễu & không đồng nhất**: cùng ý "là con của" có 5-6 biến thể (`LÀ CON`, `LÀ_CON`, `LÀ CON CỦA`, `LÀ CON TRAI`...), tên nhân vật chưa chuẩn hoá (huý vs miếu hiệu), không có thứ tự đời/kế vị. → Chỉ dùng làm **nguồn đối chiếu phụ**, không đủ sạch để dựng gia phả tin cậy.
- Data "gia phả" trong Qdrant ~0.3% (bỏ qua). Backend: `person` không có FK cha/con; `feature/graph/` là stub rỗng.

**Quyết định đã chốt:**
- Triều đại: **Nhà Lý & Nhà Trần**.
- Nguồn data CHÍNH: **Wikipedia tiếng Việt** (tái dùng httpx ở `app/services/web_fallback_service.py`). Danh sách ~22 vua + cha-con trên Wikipedia rất chuẩn.
- Nguồn PHỤ (tuỳ chọn): đối chiếu với quan hệ `LÀ CON CỦA...` sẵn có trong Aura để bắt sai/bổ sung.
- Store: **Neo4j Aura** (chính instance app dùng — giữ nguyên `.env`), label riêng **`:RoyalPerson`**, KHÔNG trộn với `:Entity`/`:REL`.
- Nơi đặt code: **rag-service** (đã có Neo4j driver `app/graph/graph_client.py` + FastAPI). Backend proxy để sau nếu cần.

---

## Data model (Neo4j Aura — label riêng `:RoyalPerson`)

```
(:RoyalPerson {
    name,            // "Lý Thái Tổ"
    dynasty,         // "Nhà Lý" | "Nhà Trần"
    reignOrder,      // 1,2,3... thứ tự làm vua (int, null nếu không phải vua)
    templeName,      // miếu hiệu
    birthYear, deathYear, reignStart, reignEnd,  // int nullable
    sourceUrl        // link Wikipedia
})
(:RoyalPerson)-[:CHA_CON]->(:RoyalPerson)      // cha → con
(:RoyalPerson)-[:KE_VI]->(:RoyalPerson)        // vua trước → vua sau (theo reignOrder)
```
- Constraint: `CREATE CONSTRAINT royal_name IF NOT EXISTS FOR (p:RoyalPerson) REQUIRE (p.name, p.dynasty) IS UNIQUE`.
- Label riêng → build/xoá độc lập, không đụng 70k node GraphRAG.

---

## Phase 1 — Harvester Wikipedia → Neo4j Aura
File mới: `rag-service/scripts/build_genealogy.py`

**Cách tiếp cận hybrid (ổn định hơn tự crawl):**
1. **King-list mồi (hardcode):** tên + thứ tự vua từng triều — nhà Lý 9 vua, nhà Trần ~13 vua:
   ```python
   LY = ["Lý Thái Tổ","Lý Thái Tông","Lý Thánh Tông","Lý Nhân Tông",
         "Lý Thần Tông","Lý Anh Tông","Lý Cao Tông","Lý Huệ Tông","Lý Chiêu Hoàng"]
   TRAN = ["Trần Thái Tông","Trần Thánh Tông","Trần Nhân Tông","Trần Anh Tông", ...]
   ```
2. **Lấy infobox mỗi vua** qua MediaWiki API `action=parse&page=<tên>&prop=wikitext&format=json`, parse field:
   - `cha =` / `thân phụ =` → cạnh `:CHA_CON` (cha → vua này).
   - `sinh=/mất=/trị vì=` → năm (regex). `miếu hiệu =` → templeName.
   - Tái dùng `_HEADERS`/httpx từ `web_fallback_service.py`.
3. **Cạnh `:KE_VI`** tuần tự theo king-list mồi (vua[i] → vua[i+1]).
4. **Ghi Aura** qua `app/graph/graph_client.py` (driver singleton sẵn có) — thêm hàm ghi `:RoyalPerson`/MERGE idempotent, hoặc tx riêng trong script.
5. **(Tuỳ chọn) đối chiếu Aura:** query `MATCH (a:Entity)-[r:REL]->(b:Entity) WHERE r.type CONTAINS 'CON' ...` lọc các cha-con liên quan Lý/Trần → log chỗ Wikipedia thiếu mà graph có (hoặc ngược lại).
6. CLI: `--dynasty ly|tran|all`, `--dry-run`, `--recreate` (chỉ xoá `:RoyalPerson`).

**Lưu ý parse:** tên field `cha` có thể là `[[Lý Công Uẩn|...]]` hoặc khác tên vua (huý vs miếu hiệu) → cần chuẩn hoá + map tay tối thiểu cho ~22 vua (số ít, kiểm được). Log rõ cha KHÔNG map được node nào (chính là ứng viên "thất lạc").

---

## Phase 2 — Thuật toán gia phả
File mới: `rag-service/app/services/genealogy_service.py` — dùng Cypher traversal đa đời (query 1-hop hiện tại không làm được):

1. **Cây** `get_tree(dynasty)`: `MATCH (p:RoyalPerson {dynasty:$d}) OPTIONAL MATCH (p)-[:CHA_CON]->(c) ...` → dựng cây lồng nhau.
2. **Số đời** `count_generations(dynasty)`:
   - Thuỷ tổ = node không có `:CHA_CON` đi vào trong triều.
   - `MATCH path=(root:RoyalPerson {dynasty:$d})-[:CHA_CON*]->(leaf) WHERE NOT (root)<-[:CHA_CON]-() RETURN max(length(path))+1 AS generations`.
   - `đời thứ N` của 1 người = độ sâu từ thuỷ tổ.
3. **Phát hiện "thất lạc"** `find_gaps(dynasty)`:
   - **Vua mồ côi:** `reignOrder>1` nhưng KHÔNG có `:CHA_CON` đi vào (không rõ cha) → nghi đứt mạch.
   - **Đứt kế vị:** 2 vua liên tiếp (`:KE_VI`) không có đường cha-con nối được → chuyển ngôi khác dòng (vd Lý→Trần).
   - **Cha dangling:** cha có trong infobox nhưng không thành node (đã log ở Phase 1).
   - Mỗi gap: `{person, reignOrder, reason, note}`.

---

## Phase 3 — API (rag-service)
File mới `rag-service/app/api/genealogy_routes.py`, đăng ký trong `app/main.py` (giống pattern router cũ: `app.include_router(genealogy_router, prefix="/rag")`).

GET (đọc-only):
- `GET /rag/genealogy/{dynasty}/tree`
- `GET /rag/genealogy/{dynasty}/generations` → `{dynasty, generations, perPerson:[{name, generation}]}`
- `GET /rag/genealogy/{dynasty}/gaps`
- `dynasty` ∈ `ly | tran`; 404 nếu chưa build.

## Config
Dùng Neo4j settings sẵn có. Có thể thêm `genealogy_enabled: bool = True`.

## Verification (chạy thật)
1. **Aura sống + đúng data:** query đếm `:RoyalPerson` (nhớ query đầu có thể chờ cold-start ~30-60s).
2. **Harvest:** `.venv/bin/python scripts/build_genealogy.py --dynasty all --recreate` → in số node/cạnh (~9 Lý + ~13 Trần + cạnh CHA_CON/KE_VI). Xem Aura Browser: `MATCH (p:RoyalPerson) RETURN p.dynasty, count(*)`.
3. **generations:** `GET /rag/genealogy/tran/generations` → số đời hợp lý (Trần ~5-6 đời huyết thống).
4. **gaps:** `GET /rag/genealogy/ly/gaps` → bắt được đứt mạch Lý→Trần (Lý Chiêu Hoàng) + vua không rõ cha.
5. **tree:** `GET /rag/genealogy/ly/tree` → Lý Thái Tổ → Thái Tông → Thánh Tông... đúng.
6. Test `tests/test_genealogy_service.py` (mock Neo4j / data nhỏ): count_generations, find_gaps.

## Không làm / để sau
- UI cây gia phả (frontend) — phase riêng.
- Backend proxy `/api/v1/genealogy/...` — thêm sau nếu frontend cần.
- Không đụng embedding/Qdrant/FAQ/web-fallback; không mở rộng `:Entity/:REL` (gia phả dùng `:RoyalPerson`).

## Rủi ro cho người làm
- **Aura auto-pause:** lâu không dùng sẽ ngủ; query đầu chờ cold-start. Đừng tưởng "chết" như tôi đã nhầm — cứ retry.
- **Parse infobox Wikipedia hay lệch** (huý vs miếu hiệu, `[[...]]`, template lồng). Log kỹ phần không map + map tay ~22 vua.
- **Chốt định nghĩa "thất lạc"** bằng ví dụ thật sau khi có data (mồ côi cha / đứt kế vị / chuyển triều) — tránh over-engineer.
- Đồ thị GraphRAG cũ chỉ dùng đối chiếu, đừng tin tưởng cho cấu trúc chính (nhiễu, tên không chuẩn).
