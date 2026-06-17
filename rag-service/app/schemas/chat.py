"""
Pydantic schemas cho chat flow: request từ Spring Boot và response trả về.

Vai trò: định nghĩa "hợp đồng" API giữa Spring Boot và RAG service cho /rag/chat.
Spring Boot serialize Java object → JSON → RAG service deserialize vào đây.

3 model:
  RagChatRequest  — câu hỏi + tham số tuning (topK, filter, temperature)
  RagChatResponse — answer text + danh sách citations + flags (usedVector/Graph)
  Citation        — 1 nguồn được dùng để trả lời: sourceType, title, score...

Response phải luôn kèm citations — chatbot lịch sử không được trả lời
mà không có nguồn để user kiểm chứng (docs/14).
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
