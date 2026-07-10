"""
API layer cho chat: POST /rag/chat và GET /rag/health.

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
"""
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import anyio

from app.schemas.chat import Citation, RagChatRequest, RagChatResponse

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
        for event in _stream_chat_events(req):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


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
        answer = generate(system_prompt, user_message, req.temperature)
    except Exception:
        return RagChatResponse(
            answer=_NO_DATA_MSG,
            citations=[],
            usedVector=True,
            usedGraph=bool(graph_facts),
        )

    suggestions = suggest_questions(req.question, answer)
    return RagChatResponse(
        answer=answer,
        citations=to_citations(hits),
        usedVector=True,
        usedGraph=bool(graph_facts),
        suggestions=suggestions,
    )


def _stream_chat_events(req: RagChatRequest):
    from app.config import settings
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
                            yield _sse("chat.thinking", {"text": chunk})
                        else:
                            full_answer += chunk
                            yield _sse("chat.delta", {"text": chunk})
                    yield _sse("chat.citations", {
                        "citations": [citation.model_dump()],
                    })
                    yield _sse("chat.completed", {
                        "usedVector": False,
                        "usedGraph": False,
                        "usedWeb": True,
                        "needsRephrase": False,
                    })
                    return
                except Exception:
                    if full_answer:
                        yield _sse("chat.citations", {"citations": [citation.model_dump()]})
                        yield _sse("chat.completed", {
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
        for kind, chunk in generate_stream(system_prompt, user_message, req.temperature):
            if kind == "thinking":
                yield _sse("chat.thinking", {"text": chunk})
            else:
                full_answer += chunk
                yield _sse("chat.delta", {"text": chunk})
    except Exception:
        for event in _answer_events(_NO_DATA_MSG, [], True, bool(graph_facts)):
            yield event
        return

    yield _sse("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield _sse("chat.completed", {
        "usedVector": True,
        "usedGraph": bool(graph_facts),
        "usedWeb": False,
        "needsRephrase": False,
    })
    suggestions = suggest_questions(req.question, full_answer)
    if suggestions:
        yield _sse("chat.suggestions", {"suggestions": suggestions})


def _answer_events(answer: str, citations: list, used_vector: bool, used_graph: bool, used_web: bool = False, needs_rephrase: bool = False):
    for chunk in _chunk_text(answer):
        yield _sse("chat.delta", {"text": chunk})
    yield _sse("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield _sse("chat.completed", {
        "usedVector": used_vector,
        "usedGraph": used_graph,
        "usedWeb": used_web,
        "needsRephrase": needs_rephrase,
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
