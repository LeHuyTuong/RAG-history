"""
Bước 1/4 trong chat pipeline: embed câu hỏi và search Qdrant.

Vai trò: cầu nối giữa câu hỏi thô của user và các chunk liên quan trong Qdrant.
Nhận question string, trả về list ScoredPoint để prompt_service build context.

Flow trong /rag/chat:
  chat_routes
    → retrieve(question, top_k, source_ids, tag_ids)
      1. embed_query(question)           — biến câu hỏi thành vector 768 chiều
      2. vector_repository.search(...)   — cosine search topK + filter + threshold
    → [ScoredPoint, ...]  →  prompt_service

Filter source_ids / tag_ids đi thẳng xuống Qdrant — không cần đọc MySQL.
score_threshold lọc chunk quá xa về ngữ nghĩa trước khi đưa vào prompt.
"""
from qdrant_client.models import ScoredPoint

from app.config import settings
from app.services.embedding_service import embed_query
from app.vectorstore.vector_repository import search


def retrieve(
    question: str,
    top_k: int,
    source_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
) -> list[ScoredPoint]:
    query_vector = embed_query(question)
    return search(
        collection=settings.qdrant_collection,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=settings.score_threshold,
        source_ids=source_ids,
        tag_ids=tag_ids,
    )
