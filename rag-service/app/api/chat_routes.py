from fastapi import APIRouter

from app.schemas.chat import RagChatRequest, RagChatResponse

router = APIRouter()

_NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn về câu hỏi này."


@router.get("/health")
async def health():
    return {"status": "ok", "service": "rag-history"}


@router.post("/chat", response_model=RagChatResponse)
async def chat(req: RagChatRequest):
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
