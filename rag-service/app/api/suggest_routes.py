from fastapi import APIRouter

from app.schemas.suggest import SuggestQuestionsRequest, SuggestQuestionsResponse

router = APIRouter()


@router.post("/suggest-questions", response_model=SuggestQuestionsResponse)
async def suggest_questions(req: SuggestQuestionsRequest):
    from app.config import settings
    from app.services.llm_service import suggest_questions_from_docs
    from app.services.retrieval_service import WIKI_LOCAL_COLLECTION
    from app.vectorstore.vector_repository import sample_chunks

    source_ids = req.sourceIds or None
    chunks = sample_chunks(
        collection=settings.qdrant_collection,
        source_ids=source_ids,
        limit=20,
    )
    try:
        chunks += sample_chunks(
            collection=WIKI_LOCAL_COLLECTION,
            source_ids=source_ids,
            limit=10,
        )
    except Exception:
        pass  # collection có thể chưa tồn tại (chưa ingest wiki lần nào)

    context = "\n\n".join(
        c.get("chunkText") or ""
        for c in chunks
        if c.get("chunkText")
    )
    if not context.strip():
        return SuggestQuestionsResponse(questions=[], sourceIds=req.sourceIds)

    questions = suggest_questions_from_docs(context, n=req.count)
    return SuggestQuestionsResponse(questions=questions, sourceIds=req.sourceIds)