"""
Schema cho ingest flow. Bám sát hợp đồng API định nghĩa trong docs/12 và docs/21.
Spring Boot JOIN sẵn các metadata (tagIds, categoryId…) rồi gửi vào đây —
RAG service không cần đọc thẳng MySQL.
"""
from pydantic import BaseModel


class IngestSettings(BaseModel):
    """Override chunk params per-request. None = dùng giá trị mặc định từ config.py."""
    chunkSize: int | None = None
    chunkOverlap: int | None = None


class IngestMetadata(BaseModel):
    """
    Metadata Spring Boot denormalize từ MySQL rồi nhét vào đây.
    Sẽ được ép phẳng vào payload Qdrant để filter lúc query mà không cần JOIN MySQL.
    """
    categoryId: int | None = None
    categoryName: str | None = None
    slug: str | None = None  # chỉ article mới có slug
    tagIds: list[int] = []
    eventIds: list[int] = []
    periodIds: list[int] = []


class RagIngestRequest(BaseModel):
    sourceId: int
    sourceType: str  # "DOCUMENT" | "ARTICLE" | "URL" | "MANUAL_INPUT"
    title: str
    articleId: int | None = None
    documentId: int | None = None
    # Một trong 3 field dưới phải có giá trị: filePath, sourceUrl, hoặc rawContent
    filePath: str | None = None
    sourceUrl: str | None = None
    rawContent: str | None = None
    metadata: IngestMetadata = IngestMetadata()
    settings: IngestSettings = IngestSettings()


class IngestedChunk(BaseModel):
    chunkIndex: int
    qdrantPointId: str
    contentHash: str  # sha256 để Spring Boot so sánh khi re-ingest


class RagIngestResponse(BaseModel):
    sourceId: int
    status: str  # "COMPLETED" | "EMPTY" | "FAILED"
    collection: str
    embeddingModel: str
    chunks: list[IngestedChunk]
