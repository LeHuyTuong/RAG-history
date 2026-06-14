"""
Pydantic schemas cho ingestion flow: request từ Spring Boot và response trả về.

Vai trò: định nghĩa "hợp đồng" API cho /rag/ingest. Bám sát docs/12 và docs/21.

4 model:
  RagIngestRequest — toàn bộ thông tin 1 source cần ingest:
                     content (filePath/sourceUrl/rawContent) + metadata đã denormalize
  IngestSettings   — tham số chunk tuning per-request (override default từ config.py)
  IngestMetadata   — metadata từ MySQL mà Spring Boot JOIN sẵn rồi gửi sang,
                     sẽ được flatten vào Qdrant payload để filter không cần JOIN MySQL
  RagIngestResponse — kết quả sau ingest: status + danh sách chunk đã lưu
  IngestedChunk    — thông tin 1 chunk: index, UUID trong Qdrant, hash để detect thay đổi
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
