"""
Schemas cho retrieval debug flow.

Endpoint /rag/retrieve cho phép Spring Boot hoặc script benchmark kiểm tra
riêng bước embedding + Qdrant search mà không gọi LLM. Đây là công cụ kết nối
và debug ingestion: nếu retrieve chưa ra chunk đúng thì chat khó trả đúng.
"""
from pydantic import BaseModel


class RagRetrieveRequest(BaseModel):
    question: str
    topK: int | None = None
    sourceIds: list[int] = []
    tagIds: list[int] = []


class RetrievalHit(BaseModel):
    sourceType: str
    sourceId: int | None = None
    articleId: int | None = None
    documentId: int | None = None
    title: str | None = None
    slug: str | None = None
    pageNumber: int | None = None
    chunkIndex: int | None = None
    score: float | None = None
    chunkText: str | None = None


class RagRetrieveResponse(BaseModel):
    question: str
    topK: int
    hits: list[RetrievalHit]
