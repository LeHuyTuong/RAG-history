"""
Bước 4/4 trong chat pipeline: chuyển Qdrant hits thành Citation objects.

Vai trò: map ScoredPoint (Qdrant internal) sang Citation (API schema) để
chat_routes trả cho Spring Boot. Không gọi database — toàn bộ metadata
đã được flatten vào payload khi ingest.

Flow trong /rag/chat:
  llm_service  →  answer
  [cùng lúc] hits (list[ScoredPoint])
    → to_citations(hits)
      → list[Citation]  →  RagChatResponse.citations

Deduplicate theo (sourceType, sourceId, chunkIndex) để tránh trường hợp
Qdrant trả cùng 1 chunk nhiều lần khi kết hợp nhiều filter.
"""
from qdrant_client.models import ScoredPoint

from app.schemas.chat import Citation


def to_citations(hits: list[ScoredPoint]) -> list[Citation]:
    citations: list[Citation] = []
    seen: set[tuple[str | None, int | None, int | None]] = set()

    for hit in hits:
        payload = hit.payload or {}
        citation = Citation(
            sourceType=str(payload.get("sourceType") or "UNKNOWN"),
            sourceId=_to_int(payload.get("sourceId")),
            articleId=_to_int(payload.get("articleId")),
            documentId=_to_int(payload.get("documentId")),
            title=payload.get("title"),
            slug=payload.get("slug"),
            pageNumber=_to_int(payload.get("pageNumber")),
            chunkIndex=_to_int(payload.get("chunkIndex")),
            score=float(hit.score) if hit.score is not None else None,
        )
        key = (citation.sourceType, citation.sourceId, citation.chunkIndex)
        if key not in seen:
            seen.add(key)
            citations.append(citation)

    return citations


def _to_int(value) -> int | None:
    if value is None:
        return None
    return int(value)
