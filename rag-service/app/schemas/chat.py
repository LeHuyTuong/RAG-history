"""
Schema cho chat flow. Response phải luôn kèm citations — chatbot lịch sử
không nên trả lời mà không có nguồn (docs/14).
"""
from pydantic import BaseModel


class Citation(BaseModel):
    sourceType: str  # "DOCUMENT" | "ARTICLE" | "URL" | "MANUAL_INPUT"
    sourceId: int | None = None
    articleId: int | None = None
    documentId: int | None = None
    title: str | None = None
    slug: str | None = None
    pageNumber: int | None = None
    chunkIndex: int | None = None
    score: float | None = None  # cosine similarity score từ Qdrant


class RagChatRequest(BaseModel):
    question: str
    topK: int | None = None  # None = dùng default_top_k từ config
    useGraph: bool = False    # luôn False trong MVP; chừa chỗ cho Neo4j sau
    sourceIds: list[int] = []  # filter: chỉ search trong các source này
    tagIds: list[int] = []     # filter: chỉ search chunk có gắn tag này
    temperature: float = 0.2


class RagChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    usedVector: bool
    usedGraph: bool
