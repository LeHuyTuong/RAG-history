# Task 1 — Web fallback (Wikipedia tiếng Việt) + đánh giá câu trả lời

## Mục tiêu & bối cảnh

Khi hệ thống **không đủ dữ liệu nội bộ** để trả lời (FAQ cache trượt + RAG trên sách/Qdrant không ra chunk nào đủ điểm), hiện tại chỉ trả câu cụt:
`"Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn về câu hỏi này."`

Đo thực tế: nhà Mạc chỉ phủ 1.9%, dữ liệu gia phả ~0.3% → nhiều câu bị rơi vào nhánh "không đủ dữ liệu".

**Yêu cầu:**
1. Khi thiếu dữ liệu → **tự tra Wikipedia tiếng Việt**, tổng hợp câu trả lời và trả về **kèm nhãn "nguồn ngoài"** để user biết.
2. Cho user **đánh giá** (đúng/sai/không đủ) câu trả lời nguồn ngoài.
3. Nếu Wikipedia **cũng không có** → hiện thông báo "chưa tìm thấy, thử diễn đạt lại" để user **gửi lại**.

**Đã chốt với stakeholder:** nguồn web = **Wikipedia tiếng Việt API** (miễn phí, không cần API key, phủ tốt lịch sử VN).

## Luồng sau khi thêm
```
FAQ cache miss
   → RAG (embed + Qdrant)  ─(có chunk đủ điểm)─▶ LLM trả lời như cũ (usedVector=true)
        │
        └─(KHÔNG có chunk / graph)──▶ WEB FALLBACK:
              1. search Wikipedia VI cho câu hỏi
              2. có kết quả → lấy extract → LLM tổng hợp
                             → trả answer + citation Wikipedia (usedWeb=true)
              3. không kết quả → trả thông báo "gửi lại" (needsRephrase=true)
```

---

## PHẦN A — rag-service (lõi, làm trước, tự chứa)

### A1. Module mới: `rag-service/app/services/web_fallback_service.py`
Dùng `httpx` (đã có sẵn trong requirements, xem `extract_service.py:82`). Gọi MediaWiki API của `vi.wikipedia.org`.

```python
import httpx, logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)
_API = "https://vi.wikipedia.org/w/api.php"
_HEADERS = {"User-Agent": "RAG-History/1.0 (contact: <email>)"}  # Wikimedia yêu cầu UA

@dataclass
class WebResult:
    title: str
    url: str
    extract: str

def search_wikipedia_vi(query: str, max_chars: int = 2000) -> WebResult | None:
    """Tra Wikipedia VI: search → lấy extract intro của trang top. None nếu không có/lỗi."""
    try:
        with httpx.Client(timeout=15, headers=_HEADERS, follow_redirects=True) as c:
            # 1) search title
            r = c.get(_API, params={
                "action": "query", "list": "search", "srsearch": query,
                "srlimit": 3, "format": "json", "utf8": 1,
            })
            hits = r.json().get("query", {}).get("search", [])
            if not hits:
                return None
            title = hits[0]["title"]
            # 2) lấy extract intro (plain text)
            r2 = c.get(_API, params={
                "action": "query", "prop": "extracts", "exintro": 1,
                "explaintext": 1, "redirects": 1, "titles": title, "format": "json",
            })
            pages = r2.json().get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            extract = (page.get("extract") or "").strip()
            if not extract:
                return None
            url = "https://vi.wikipedia.org/wiki/" + title.replace(" ", "_")
            return WebResult(title=title, url=url, extract=extract[:max_chars])
    except Exception as exc:               # nuốt lỗi để không sập chat
        logger.warning("Wikipedia fallback failed: %s", exc)
        return None
```

### A2. Prompt tổng hợp từ nguồn web: `rag-service/app/services/prompt_service.py`
Thêm hàm (đặt cạnh `build_user_message`):
```python
def build_web_user_message(question: str, title: str, extract: str) -> str:
    return (
        "CONTEXT (nguồn: Wikipedia tiếng Việt — có thể chưa được kiểm chứng nội bộ):\n"
        f"[W1] {title}\n{extract}\n\n"
        "QUESTION:\n" f"{question}\n\n"
        "Yêu cầu: Trả lời NGẮN GỌN dựa CHỈ trên CONTEXT trên. "
        "Nếu context không chứa câu trả lời, nói rõ là chưa tìm thấy. "
        "KHÔNG bịa thông tin ngoài context."
    )
```

### A3. Schema: `rag-service/app/schemas/chat.py`
- Thêm vào `Citation`: `sourceUrl: str | None = None` (để trả link Wikipedia — hiện Citation chưa có field URL).
- Thêm vào `RagChatResponse`:
  - `usedWeb: bool = False`
  - `needsRephrase: bool = False`  (báo frontend hiện nút "gửi lại")

### A4. Cắm vào `rag-service/app/api/chat_routes.py`
Thay nhánh "không đủ dữ liệu" hiện tại (khối `if not hits and not graph_facts:` trong CẢ `_chat()` và `_stream_chat_events()`) bằng: gọi web fallback trước khi trả `_NO_DATA_MSG`.

Trong `_chat()`:
```python
if not hits and not graph_facts:
    if settings.web_fallback_enabled:
        from app.services.web_fallback_service import search_wikipedia_vi
        web = search_wikipedia_vi(req.question, settings.web_fallback_max_chars)
        if web:
            try:
                from app.services.prompt_service import load_system_prompt, build_web_user_message
                answer = generate(load_system_prompt(),
                                  build_web_user_message(req.question, web.title, web.extract),
                                  req.temperature)
            except Exception:
                answer = web.extract  # fallback: trả thẳng extract nếu LLM lỗi
            citation = Citation(sourceType="URL", title=web.title,
                                sourceUrl=web.url, score=None)
            return RagChatResponse(answer=answer, citations=[citation],
                                   usedVector=False, usedGraph=False, usedWeb=True)
    # web cũng không có → gửi lại
    return RagChatResponse(answer=_REPHRASE_MSG, citations=[],
                           usedVector=routing["use_vector"], usedGraph=routing["use_graph"],
                           needsRephrase=True)
```
- Thêm hằng `_REPHRASE_MSG = "Chưa tìm thấy dữ liệu phù hợp. Bạn thử diễn đạt lại câu hỏi rõ hơn hoặc theo cách khác nhé."`
- **Bản `_stream_chat_events()`**: cùng logic; khi có `web` → emit answer qua `_answer_events(answer, [citation], used_vector=False, used_graph=False)` rồi thêm 1 event báo `usedWeb`; khi không có → `_answer_events(_REPHRASE_MSG, [], ...)`. Cân nhắc thêm event SSE `chat.web` (báo nguồn ngoài) và `chat.rephrase`.
- **Lưu ý**: `search_wikipedia_vi` là **blocking** (`httpx.Client` sync). Trong `_chat()` (async) sẽ chặn event loop — chấp nhận được vì đây là nhánh hiếm; nếu muốn sạch, gói bằng `await anyio.to_thread.run_sync(...)`. (Liên quan Task 3.)

### A5. Config: `rag-service/app/config.py`
Thêm vào `Settings`:
```python
web_fallback_enabled: bool = True          # env WEB_FALLBACK_ENABLED
web_fallback_max_chars: int = 2000         # env WEB_FALLBACK_MAX_CHARS
```

### A6. docker-compose.yml
Thêm biến (tùy chọn) cho service `rag-service`: `WEB_FALLBACK_ENABLED`, `WEB_FALLBACK_MAX_CHARS`. Không bắt buộc (đã có default). Đảm bảo container có mạng ra ngoài (gọi Wikipedia).

---

## PHẦN B — Đánh giá câu trả lời (cross-repo, làm sau khi A xong)

Hiện chưa có cơ chế đánh giá cho câu trả lời chat (bảng `engagement` chỉ gắn với post/bài viết — xem `V1__init.sql:179-188`). Cần thêm mới:

### B1. rag-service — endpoint nhận feedback (nhẹ)
`POST /rag/feedback` trong module route mới `app/api/feedback_routes.py`:
- Body: `{ question, answer, usedWeb, sourceUrl, rating }` với `rating ∈ {GOOD, BAD, INSUFFICIENT}`.
- Ghi ra file/log JSONL (`data/feedback.jsonl`) HOẶC forward sang backend. Đơn giản trước: append JSONL để thu thập.

### B2. backend (Spring) — lưu bền
- Thêm bảng `chat_feedback` (migration Flyway mới `V3__chat_feedback.sql`): `id, member_id (nullable), question TEXT, answer TEXT, used_web BOOL, source_url, rating VARCHAR(20), created_at`.
- `RagService`/controller: endpoint `POST /api/chat/feedback` → lưu bảng trên. (Tham khảo `feature/rag/RagServiceImpl` cho pattern proxy sang rag-service.)

### B3. frontend — UI
- Ở màn chat: khi response có `usedWeb=true` → hiện badge **"Nguồn: Wikipedia (chưa kiểm chứng nội bộ)"** + link `sourceUrl` + 3 nút đánh giá (👍 đúng / 👎 sai / ⚠️ chưa đủ) → gọi `POST /api/chat/feedback`.
- Khi `needsRephrase=true` → hiện ô gợi ý **"Gửi lại / diễn đạt khác"** (nút resend).
- Tham khảo chỗ rating có sẵn: `frontend/src/pages/user/articles/ArticleDetail.jsx:471`.

---

## Verification (Phần A — chạy thật)
1. **Unit web fetch:**
   `.venv/bin/python -c "from app.services.web_fallback_service import search_wikipedia_vi as s; r=s('nhà Mạc'); print(r.title, r.url); print(r.extract[:200])"` → phải ra trang "Nhà Mạc" + extract.
2. **E2E fallback trúng web:** chạy `uvicorn app.main:app --port 8001`; POST `/rag/chat` một câu chắc chắn KHÔNG có trong sách nhưng có trên Wikipedia (vd hỏi chi tiết một nhân vật nhà Mạc ít phổ biến) → response có `usedWeb=true`, có citation `sourceType="URL"` + `sourceUrl` wiki, answer bám theo extract.
3. **E2E không có gì:** POST câu vô nghĩa → `needsRephrase=true`, answer = `_REPHRASE_MSG`.
4. **Không phá luồng cũ:** câu có trong sách → vẫn `usedVector=true`, không chạm web. Câu trong FAQ → vẫn hit cache (Task đã xong trước đó).
5. **Không sập khi mất mạng:** tắt mạng → `search_wikipedia_vi` trả None → rơi về `needsRephrase`, không crash.
6. Chạy `.venv/bin/pytest` — thêm test cho `web_fallback_service` (mock httpx: search OK, search rỗng, lỗi mạng → None).

## Không làm / để sau
- Không cache kết quả Wikipedia (có thể thêm sau nếu tốn thời gian gọi lại nhiều).
- Không đổi embedding, không re-embed, không đụng Qdrant/Gemini hiện có.
- Task 3 (song song/không session) và Task 4 (gia phả) là plan riêng.
