"""
API layer cho retrieval debug: POST /rag/retrieve.

Endpoint này không sinh answer. Nó chỉ trả các chunk Qdrant topK sau khi embed
câu hỏi, giúp kiểm tra nhanh việc PDF đã ingest được chưa, filter có đúng chưa,
và score retrieval có đủ cao chưa.
"""
from fastapi import APIRouter, HTTPException

from app.schemas.retrieve import RagRetrieveRequest, RagRetrieveResponse, RetrievalHit

router = APIRouter()


@router.post("/retrieve", response_model=RagRetrieveResponse)
async def retrieve_chunks(req: RagRetrieveRequest):
    from app.config import settings
    from app.services.retrieval_service import retrieve

    top_k = req.topK or settings.default_top_k
    try:
        hits = retrieve(
            question=req.question,
            top_k=top_k,
            source_ids=req.sourceIds or None,
            tag_ids=req.tagIds or None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieve failed: {str(e)}")

    return RagRetrieveResponse(
        question=req.question,
        topK=top_k,
        hits=[_to_hit(hit) for hit in hits],
    )


def _to_hit(hit) -> RetrievalHit:
    payload = hit.payload or {}
    return RetrievalHit(
        sourceType=str(payload.get("sourceType") or "UNKNOWN"),
        sourceId=_to_int(payload.get("sourceId")),
        articleId=_to_int(payload.get("articleId")),
        documentId=_to_int(payload.get("documentId")),
        title=payload.get("title"),
        slug=payload.get("slug"),
        pageNumber=_to_int(payload.get("pageNumber")),
        chunkIndex=_to_int(payload.get("chunkIndex")),
        score=float(hit.score) if hit.score is not None else None,
        chunkText=payload.get("chunkText"),
    )


def _to_int(value) -> int | None:
    if value is None:
        return None
    return int(value)
