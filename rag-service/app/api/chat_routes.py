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
Graph (Neo4j) chưa implement — useGraph luôn False trong MVP.
"""
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.chat import RagChatRequest, RagChatResponse

router = APIRouter()

_NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn về câu hỏi này."


@router.get("/health")
async def health():
    return {"status": "ok", "service": "rag-history"}


@router.post("/chat", response_model=RagChatResponse)
async def chat(req: RagChatRequest):
    return await _chat(req)


@router.post("/chat/stream")
async def chat_stream(req: RagChatRequest):
    async def event_stream():
        yield _sse("chat.created", {"message": "stream started"})
        response = await _chat(req)

        for chunk in _chunk_text(response.answer):
            yield _sse("chat.delta", {"text": chunk})

        yield _sse("chat.citations", {
            "citations": [citation.model_dump() for citation in response.citations],
        })
        yield _sse("chat.completed", {
            "usedVector": response.usedVector,
            "usedGraph": response.usedGraph,
        })

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
    from app.services.llm_service import generate
    from app.services.citation_service import to_citations
    from app.services.question_router_service import route

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

    if not hits:
        return RagChatResponse(
            answer=_NO_DATA_MSG,
            citations=[],
            usedVector=routing["use_vector"],
            usedGraph=False,
        )

    try:
        system_prompt = load_system_prompt()
        user_message = build_user_message(req.question, hits)
        answer = generate(system_prompt, user_message, req.temperature)
    except Exception:
        return RagChatResponse(
            answer=_NO_DATA_MSG,
            citations=[],
            usedVector=True,
            usedGraph=False,
        )

    return RagChatResponse(
        answer=answer,
        citations=to_citations(hits),
        usedVector=True,
        usedGraph=False,
    )


def _sse(event: str, data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _chunk_text(text: str, chunk_size: int = 48):
    if not text:
        return
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
