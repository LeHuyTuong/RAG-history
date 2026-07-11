"""
API layer cho chat: POST /rag/chat, POST /rag/chat/stream (SSE),
WS /rag/chat/ws (WebSocket) và GET /rag/health.

Vai trò: nhận câu hỏi từ Spring Boot, chạy RAG pipeline, trả answer + citations.
Không chứa logic retrieval hay prompt — chỉ điều phối các service.

Flow trong /rag/chat:
  1. question_router_service.route()  — quyết định dùng vector / graph / cả hai
  2. retrieval_service.retrieve()     — embed câu hỏi + search Qdrant topK chunks
  3. prompt_service.build_user_msg()  — ghép câu hỏi + chunks thành prompt
  4. llm_service.generate()          — gọi Gemma LLM sinh câu trả lời
  5. citation_service.to_citations()  — map ScoredPoint → Citation objects

Fallback: nếu không có hits hoặc LLM lỗi → trả _NO_DATA_MSG thay vì crash.
Graph (Neo4j): dùng khi useGraph=True hoặc câu hỏi match _GRAPH_HINT_RE.

Streaming: /chat/stream (SSE) và /chat/ws (WebSocket) dùng CHUNG một nguồn
sự kiện — `_stream_chat_event_tuples` sinh các tuple (event_name, data_dict),
hai lớp vận chuyển chỉ khác cách đóng gói (SSE format vs WS JSON frame). Nhờ
vậy so sánh benchmark SSE vs WebSocket đo đúng chênh lệch của transport, không
lẫn khác biệt pipeline RAG (xem benchmarks/README.md).
"""
import json
import time
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from starlette.concurrency import iterate_in_threadpool
import anyio

from app.schemas.chat import Citation, RagChatRequest, RagChatResponse
from app.services import query_log_service

router = APIRouter()

_NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn về câu hỏi này."
_REPHRASE_MSG = "Chưa tìm thấy dữ liệu phù hợp. Bạn thử diễn đạt lại câu hỏi rõ hơn hoặc theo cách khác nhé."


@router.get("/health")
async def health():
    return {"status": "ok", "service": "rag-history"}


@router.post("/chat", response_model=RagChatResponse)
async def chat(req: RagChatRequest):
    return await _chat(req)


@router.post("/chat/stream")
def chat_stream(req: RagChatRequest):
    def event_stream():
        yield _sse("chat.created", {"message": "stream started"})
        for name, data in _stream_with_log(req, "sse"):
            yield _sse(name, data)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.websocket("/chat/ws")
async def chat_ws(ws: WebSocket):
    """
    Bản WebSocket tương đương của /chat/stream — dùng để benchmark SSE vs
    WebSocket trên CÙNG một nguồn token (`_stream_chat_event_tuples`), không đổi
    pipeline RAG.

    Giao thức:
      1. Client mở kết nối rồi gửi 1 message JSON = RagChatRequest.
      2. Server đẩy từng event dạng {"event": <name>, "data": <dict>} — cùng
         tên/thứ tự event như SSE (chat.created / chat.thinking / chat.delta /
         chat.citations / chat.completed / chat.suggestions).
      3. Server đóng kết nối khi stream kết thúc.

    `_stream_chat_event_tuples` là generator ĐỒNG BỘ và gọi LLM blocking; chạy
    qua `iterate_in_threadpool` để không chẹn event loop — tương đương cách SSE
    (StreamingResponse với generator `def`) được FastAPI chạy trong threadpool,
    giữ so sánh SSE/WS công bằng.
    """
    await ws.accept()

    try:
        raw = await ws.receive_json()
    except WebSocketDisconnect:
        return
    except Exception:
        await ws.close(code=1003)  # 1003 = unsupported data
        return

    try:
        req = RagChatRequest(**raw)
    except Exception:
        await ws.send_json({"event": "chat.error", "data": {"message": "invalid request"}})
        await ws.close(code=1003)
        return

    try:
        await ws.send_json({"event": "chat.created", "data": {"message": "stream started"}})
        async for name, data in iterate_in_threadpool(_stream_with_log(req, "ws")):
            await ws.send_json({"event": name, "data": data})
        await ws.close()
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await ws.send_json({"event": "chat.error", "data": {"message": "stream failed"}})
            await ws.close(code=1011)  # 1011 = internal error
        except Exception:
            pass


async def _chat(req: RagChatRequest) -> RagChatResponse:
    from app.config import settings
    from app.services.retrieval_service import retrieve
    from app.services.prompt_service import load_system_prompt, build_user_message
    from app.services.llm_service import generate, suggest_questions
    from app.services.citation_service import to_citations
    from app.services.question_router_service import route, validate_question

    validation_error = validate_question(req.question)
    if validation_error:
        return RagChatResponse(
            answer=validation_error,
            citations=[],
            usedVector=False,
            usedGraph=False,
        )

    if settings.faq_cache_enabled:
        from app.services import faq_cache_service
        hit = faq_cache_service.lookup(req.question)
        if hit:
            faq_citation = Citation(
                sourceType="FAQ", sourceId=2_000_000,
                title="FAQ (AI-generated)", score=hit.score / 100.0,
            )
            return RagChatResponse(
                answer=hit.answer, citations=[faq_citation],
                usedVector=False, usedGraph=False,
            )

    top_k = req.topK or settings.default_top_k
    routing = route(req.question, req.useGraph)

    hits = []
    if routing["use_vector"]:
        hits = retrieve(
            question=req.question,
            top_k=top_k,
            source_ids=req.sourceIds or None,
            tag_ids=req.tagIds or None,
        )

    graph_facts = _graph_context(req.question) if routing["use_graph"] else []

    if not hits and not graph_facts:
        if settings.web_fallback_enabled:
            from app.services.web_fallback_service import search_wikipedia_vi
            web = await anyio.to_thread.run_sync(
                search_wikipedia_vi, req.question, settings.web_fallback_max_chars
            )
            if web:
                try:
                    from app.services.prompt_service import load_system_prompt, build_web_user_message
                    answer = generate(
                        load_system_prompt(),
                        build_web_user_message(req.question, web.title, web.extract),
                        req.temperature,
                    )
                except Exception:
                    answer = web.extract
                citation = Citation(
                    sourceType="URL", title=web.title,
                    sourceUrl=web.url, score=None,
                )
                return RagChatResponse(
                    answer=answer, citations=[citation],
                    usedVector=False, usedGraph=False, usedWeb=True,
                )
        return RagChatResponse(
            answer=_REPHRASE_MSG,
            citations=[],
            usedVector=routing["use_vector"],
            usedGraph=routing["use_graph"],
            needsRephrase=True,
        )

    try:
        system_prompt = load_system_prompt()
        user_message = build_user_message(req.question, hits, graph_facts)
        answer = generate(system_prompt, user_message, req.temperature, req.model)
    except Exception:
        return RagChatResponse(
            answer=_NO_DATA_MSG,
            citations=[],
            usedVector=True,
            usedGraph=bool(graph_facts),
        )

    suggestions = suggest_questions(req.question, answer, req.model)
    return RagChatResponse(
        answer=answer,
        citations=to_citations(hits),
        usedVector=True,
        usedGraph=bool(graph_facts),
        suggestions=suggestions,
    )


def _stream_with_log(req: RagChatRequest, transport: str):
    """Bọc ngoài `_stream_chat_event_tuples`, tích luỹ nội dung các event rồi
    ghi 1 document log vào MongoDB (`query_log_service`) trong `finally` — bắt
    trọn mọi nhánh trả lời (kể cả disconnect/lỗi giữa chừng), không phải sửa gì
    bên trong generator gốc. `transport` = "sse" | "ws" để phân biệt nguồn.

    Bỏ qua log khi `stream_source == "mock"` (benchmark transport, xem
    benchmarks/README.md) vì đó không phải lượt chat thật."""
    from app.config import settings

    # Chỉ log lượt chat THẬT (gemma). mock/ollama là nguồn benchmark, không log.
    if settings.stream_source != "gemma":
        yield from _stream_chat_event_tuples(req)
        return

    started = time.perf_counter()
    parts: list[str] = []
    citations: list[dict] = []
    completed: dict = {}
    suggestions: list[str] = []
    graph_facts: list[str] = []
    try:
        for name, data in _stream_chat_event_tuples(req):
            if name == "_internal.graph_facts":
                graph_facts = data.get("facts", [])
                continue  # sự kiện nội bộ — không forward ra SSE/WS
            if name == "chat.delta":
                parts.append(data.get("text", ""))
            elif name == "chat.citations":
                citations = data.get("citations", [])
            elif name == "chat.completed":
                completed = data
            elif name == "chat.suggestions":
                suggestions = data.get("suggestions", [])
            yield name, data
    finally:
        query_log_service.log_query({
            "question": req.question,
            "answer": "".join(parts),
            "model": req.model or settings.llm_model,
            "citations": citations,
            "usedVector": completed.get("usedVector"),
            "usedGraph": completed.get("usedGraph"),
            "graphFacts": graph_facts,
            "usedWeb": completed.get("usedWeb"),
            "needsRephrase": completed.get("needsRephrase"),
            "suggestions": suggestions,
            "topK": req.topK,
            "useGraph": req.useGraph,
            "sourceIds": req.sourceIds,
            "tagIds": req.tagIds,
            "temperature": req.temperature,
            "transport": transport,
            "latencyMs": round((time.perf_counter() - started) * 1000),
            "createdAt": datetime.now(timezone.utc),
        })


def _stream_chat_event_tuples(req: RagChatRequest):
    """Nguồn sự kiện chung cho SSE và WebSocket.

    Yield các tuple (event_name, data_dict). Lớp vận chuyển tự đóng gói:
    SSE dùng `_sse(name, data)`, WebSocket gửi {"event": name, "data": data}.
    Sự kiện `chat.created` được lớp vận chuyển tự phát ở đầu (không nằm trong
    generator này) để cả hai transport khởi đầu giống nhau.
    """
    from app.config import settings

    # Nhánh benchmark: phát token local, bỏ qua retrieval + Gemma (xem config
    # stream_source). Đặt ĐẦU generator để cả SSE lẫn WS đi qua đúng nhánh này.
    if settings.stream_source == "mock":
        for event in _mock_stream_event_tuples():
            yield event
        return

    # Full-local AI: token thật từ LLM local (Ollama), không tốn quota, không
    # gọi Gemma. Bỏ qua retrieval cloud (Qdrant/Gemini embedding) để giữ luồng
    # hoàn toàn local — dùng cho benchmark transport/concurrency với token thật.
    if settings.stream_source == "ollama":
        for event in _ollama_stream_event_tuples(req.question):
            yield event
        return

    # Token thật, NHANH, qua Groq (LPU) — free tier, key đọc từ file env RIÊNG
    # (benchmarks/.env.groq.local), KHÔNG qua app.config.Settings/.env gốc mà
    # Docker Compose dùng. Bỏ qua retrieval cloud, giống nhánh ollama.
    if settings.stream_source == "groq":
        for event in _groq_stream_event_tuples(req.question):
            yield event
        return

    from app.services.retrieval_service import retrieve
    from app.services.prompt_service import load_system_prompt, build_user_message
    from app.services.llm_service import generate_stream, suggest_questions
    from app.services.citation_service import to_citations
    from app.services.question_router_service import route, validate_question

    validation_error = validate_question(req.question)
    if validation_error:
        for event in _answer_events(validation_error, [], False, False):
            yield event
        return

    if settings.faq_cache_enabled:
        from app.services import faq_cache_service
        hit = faq_cache_service.lookup(req.question)
        if hit:
            faq_citation = Citation(
                sourceType="FAQ", sourceId=2_000_000,
                title="FAQ (AI-generated)", score=hit.score / 100.0,
            )
            for event in _answer_events(hit.answer, [faq_citation], False, False):
                yield event
            return

    top_k = req.topK or settings.default_top_k
    routing = route(req.question, req.useGraph)

    hits = []
    if routing["use_vector"]:
        hits = retrieve(
            question=req.question,
            top_k=top_k,
            source_ids=req.sourceIds or None,
            tag_ids=req.tagIds or None,
        )

    graph_facts = _graph_context(req.question) if routing["use_graph"] else []
    if graph_facts:
        # Sự kiện nội bộ cho _stream_with_log log chi tiết graph_facts — bị lọc
        # bỏ trước khi forward ra SSE/WS (không phải wire format của frontend).
        yield ("_internal.graph_facts", {"facts": graph_facts})

    if not hits and not graph_facts:
        if settings.web_fallback_enabled:
            from app.services.web_fallback_service import search_wikipedia_vi
            web = search_wikipedia_vi(req.question, settings.web_fallback_max_chars)
            if web:
                citation = Citation(
                    sourceType="URL", title=web.title,
                    sourceUrl=web.url, score=None,
                )
                try:
                    from app.services.prompt_service import load_system_prompt, build_web_user_message
                    system_prompt = load_system_prompt()
                    user_message = build_web_user_message(req.question, web.title, web.extract)
                    full_answer = ""
                    for kind, chunk in generate_stream(system_prompt, user_message, req.temperature):
                        if kind == "thinking":
                            yield ("chat.thinking", {"text": chunk})
                        else:
                            full_answer += chunk
                            yield ("chat.delta", {"text": chunk})
                    yield ("chat.citations", {
                        "citations": [citation.model_dump()],
                    })
                    yield ("chat.completed", {
                        "usedVector": False,
                        "usedGraph": False,
                        "usedWeb": True,
                        "needsRephrase": False,
                    })
                    return
                except Exception:
                    if full_answer:
                        yield ("chat.citations", {"citations": [citation.model_dump()]})
                        yield ("chat.completed", {
                            "usedVector": False, "usedGraph": False,
                            "usedWeb": True, "needsRephrase": False,
                        })
                    else:
                        for event in _answer_events(web.extract, [citation], False, False, True):
                            yield event
                    return
        for event in _answer_events(_REPHRASE_MSG, [], routing["use_vector"], routing["use_graph"], needs_rephrase=True):
            yield event
        return

    citations = to_citations(hits)
    full_answer = ""
    try:
        system_prompt = load_system_prompt()
        user_message = build_user_message(req.question, hits, graph_facts)
        for kind, chunk in generate_stream(system_prompt, user_message, req.temperature, req.model):
            if kind == "thinking":
                yield ("chat.thinking", {"text": chunk})
            else:
                full_answer += chunk
                yield ("chat.delta", {"text": chunk})
    except Exception:
        for event in _answer_events(_NO_DATA_MSG, [], True, bool(graph_facts)):
            yield event
        return

    yield ("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield ("chat.completed", {
        "usedVector": True,
        "usedGraph": bool(graph_facts),
        "usedWeb": False,
        "needsRephrase": False,
    })
    suggestions = suggest_questions(req.question, full_answer, req.model)
    if suggestions:
        yield ("chat.suggestions", {"suggestions": suggestions})


def _answer_events(answer: str, citations: list, used_vector: bool, used_graph: bool, used_web: bool = False, needs_rephrase: bool = False):
    """Sinh các tuple (event_name, data_dict) cho câu trả lời tĩnh (không stream
    từ LLM): chia nhỏ text thành delta rồi kèm citations + completed."""
    for chunk in _chunk_text(answer):
        yield ("chat.delta", {"text": chunk})
    yield ("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield ("chat.completed", {
        "usedVector": used_vector,
        "usedGraph": used_graph,
        "usedWeb": used_web,
        "needsRephrase": needs_rephrase,
    })


_MOCK_ANSWER = (
    "Nhà Trần được thành lập năm 1225 khi Trần Cảnh lên ngôi, mở đầu một triều "
    "đại kéo dài gần 175 năm. Dưới thời Trần, quân dân Đại Việt ba lần đánh bại "
    "quân Nguyên Mông, tiêu biểu là chiến thắng Bạch Đằng năm 1288 do Hưng Đạo "
    "Vương Trần Quốc Tuấn chỉ huy. Nhà Trần cũng để lại dấu ấn về văn hóa, luật "
    "pháp và tổ chức hành chính cho lịch sử phong kiến Việt Nam."
)


def _mock_stream_event_tuples():
    """Nguồn token LOCAL cho benchmark transport (SSE vs WS) — không gọi Gemma,
    không tốn quota, lặp lại được. Phát `stream_mock_tokens` token với nhịp
    `stream_mock_delay_ms` giữa các token (0 = stress). Cả hai transport nhận
    input giống hệt nên chênh lệch đo được là của transport, không phải LLM.

    Text lấy từ một câu trả lời lịch sử mẫu (chia theo từ, lặp vòng nếu cần) để
    kích thước token/bytes sát thực tế tiếng Việt."""
    from app.config import settings

    words = _MOCK_ANSWER.split(" ")
    n = max(1, settings.stream_mock_tokens)
    delay = max(0, settings.stream_mock_delay_ms) / 1000.0
    for i in range(n):
        if i > 0 and delay > 0:
            time.sleep(delay)
        yield ("chat.delta", {"text": words[i % len(words)] + " "})
    yield ("chat.citations", {"citations": []})
    yield ("chat.completed", {
        "usedVector": False,
        "usedGraph": False,
        "usedWeb": False,
        "needsRephrase": False,
    })


def _ollama_stream_event_tuples(question: str):
    """Nguồn token LOCAL THẬT cho benchmark (full-local AI): stream token từ
    Ollama (`settings.ollama_model`) qua HTTP, không gọi Gemma, không tốn quota.

    Bỏ qua RAG retrieval (Qdrant Cloud + Gemini embedding) để luồng hoàn toàn
    local; câu hỏi được đưa thẳng vào LLM local. Mục tiêu là có token THẬT (độ
    dài/nhịp do model quyết định, khác mock nhịp cố định) để so SSE vs WS.

    LƯU Ý concurrency: model local trên 1 máy chỉ generate song song hạn chế →
    ở concurrency cao, chính LLM local thành nút thắt (che khác biệt transport).
    Muốn đo THUẦN transport lúc đông thì dùng stream_source=mock; ollama hợp cho
    latency 1 stream / concurrency thấp với token thật (xem benchmarks/README.md)."""
    import httpx

    from app.config import settings

    url = settings.ollama_url.rstrip("/") + "/api/chat"
    payload = {
        "model": settings.ollama_model,
        "messages": [{"role": "user", "content": question}],
        "stream": True,
    }
    try:
        with httpx.Client(timeout=180) as cli:
            with cli.stream("POST", url, json=payload) as resp:
                for line in resp.iter_lines():
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                    except Exception:
                        continue
                    tok = obj.get("message", {}).get("content", "")
                    if tok:
                        yield ("chat.delta", {"text": tok})
                    if obj.get("done"):
                        break
    except Exception:
        for event in _answer_events(_NO_DATA_MSG, [], False, False):
            yield event
        return

    yield ("chat.citations", {"citations": []})
    yield ("chat.completed", {
        "usedVector": False,
        "usedGraph": False,
        "usedWeb": False,
        "needsRephrase": False,
    })


_GROQ_ENV_PATH = None  # lazy — tránh import Path ở module load nếu không cần


def _load_groq_env() -> tuple[str | None, str]:
    """Đọc GROQ_API_KEY/GROQ_MODEL từ `benchmarks/.env.groq.local` — file RIÊNG,
    KHÔNG phải `.env` gốc mà app.config.Settings/Docker Compose dùng. Tách biệt
    có chủ đích: đội dùng Docker không cần biết/quan tâm tới key benchmark này.

    Trả (api_key, model). api_key=None nếu file chưa tồn tại hoặc chưa điền key
    (ví dụ chỉ có bản `.example`) — caller tự xử lý fallback."""
    from pathlib import Path
    from dotenv import dotenv_values

    env_path = Path(__file__).resolve().parents[2] / "benchmarks" / ".env.groq.local"
    if not env_path.is_file():
        return None, "llama-3.1-8b-instant"
    values = dotenv_values(env_path)
    return values.get("GROQ_API_KEY") or None, values.get("GROQ_MODEL") or "llama-3.1-8b-instant"


def _groq_stream_event_tuples(question: str):
    """Nguồn token LOCAL-FREE, NHANH qua Groq (chip LPU) — free tier 30 RPM,
    dùng cho benchmark ở concurrency THẤP (≤~20-30, theo đúng RPM cap) với token
    thật mà latency rất thấp (khác Gemma chậm / Ollama tự nghẽn compute).

    Key đọc từ `benchmarks/.env.groq.local` (xem `_load_groq_env`), KHÔNG phải
    từ app.config.Settings. Nếu chưa cấu hình key, trả _NO_DATA_MSG (giống mọi
    nhánh lỗi khác) thay vì raise, để benchmark harness thấy lỗi rõ ràng qua
    event thay vì stack trace."""
    import httpx

    api_key, model = _load_groq_env()
    if not api_key:
        for event in _answer_events(
            "Chưa cấu hình GROQ_API_KEY (xem benchmarks/.env.groq.local.example).",
            [], False, False,
        ):
            yield event
        return

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": question}],
        "stream": True,
    }
    try:
        with httpx.Client(timeout=60) as cli:
            with cli.stream("POST", url, headers=headers, json=payload) as resp:
                for line in resp.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    raw = line[len("data: "):]
                    if raw.strip() == "[DONE]":
                        break
                    try:
                        obj = json.loads(raw)
                    except Exception:
                        continue
                    delta = obj.get("choices", [{}])[0].get("delta", {})
                    tok = delta.get("content") or ""
                    if tok:
                        yield ("chat.delta", {"text": tok})
    except Exception:
        for event in _answer_events(_NO_DATA_MSG, [], False, False):
            yield event
        return

    yield ("chat.citations", {"citations": []})
    yield ("chat.completed", {
        "usedVector": False,
        "usedGraph": False,
        "usedWeb": False,
        "needsRephrase": False,
    })


def _graph_context(question: str) -> list[str]:
    """Lấy quan hệ từ Neo4j cho câu hỏi; nuốt lỗi để graph không làm sập chat."""
    try:
        from app.services.graph_service import retrieve_graph_context
        return retrieve_graph_context(question)
    except Exception:
        return []


def _sse(event: str, data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _chunk_text(text: str, chunk_size: int = 48):
    if not text:
        return
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
