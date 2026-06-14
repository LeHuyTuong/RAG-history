"""
Bước 4/4 trong ingestion pipeline: orchestrator kết nối toàn bộ luồng xử lý.

Vai trò: điều phối 4 bước extract → chunk → embed → upsert thành 1 flow
hoàn chỉnh. ingest_routes.py gọi hàm ingest() ở đây và nhận về response
để trả về Spring Boot.

Flow đầy đủ:
  ingest_routes
    → ingest(req)
      1. extract_service.extract()      — lấy text thô từ file/URL/rawContent
      2. chunk_service.chunk()          — split thành chunk có overlap
      3. embedding_service.embed_docs() — tạo vector cho từng chunk
      4. vector_repository.upsert()     — lưu vào Qdrant Cloud
    → RagIngestResponse(status, chunks[])

Re-ingest: xóa vector cũ trước khi upsert (delete_by_source_id) để tránh
tạo bản sao — đây là lý do delete đứng trước upsert trong flow.

Trả "EMPTY" nếu không extract được chunk, "COMPLETED" nếu thành công.
Exception từ bất kỳ bước nào sẽ bubble lên ingest_routes và trả 500.
"""
from datetime import datetime, timezone

from app.config import settings
from app.schemas.ingest import IngestedChunk, RagIngestRequest, RagIngestResponse
from app.services.chunk_service import chunk
from app.services.embedding_service import embed_documents
from app.services.extract_service import extract
from app.vectorstore.qdrant_client import ensure_collection
from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert


def ingest(req: RagIngestRequest) -> RagIngestResponse:
    chunk_size = req.settings.chunkSize or settings.default_chunk_size
    chunk_overlap = req.settings.chunkOverlap or settings.default_chunk_overlap
    collection = settings.qdrant_collection

    pages = extract(
        raw_content=req.rawContent,
        file_path=req.filePath,
        source_url=req.sourceUrl,
    )
    chunks = chunk(pages, chunk_size, chunk_overlap)

    if not chunks:
        return RagIngestResponse(
            sourceId=req.sourceId,
            status="EMPTY",
            collection=collection,
            embeddingModel=settings.embedding_model,
            chunks=[],
        )

    texts = [c.text for c in chunks]
    vectors = embed_documents(texts)

    created_at = datetime.now(timezone.utc).isoformat()
    payloads = [
        _build_payload(req, c.chunk_index, c.page_number, c.text, created_at)
        for c in chunks
    ]
    ids = [point_id(req.sourceId, c.chunk_index) for c in chunks]

    ensure_collection(collection)
    # Xóa vector cũ trước khi upsert để re-ingest không tạo bản sao
    delete_by_source_id(collection, req.sourceId)
    upsert(collection, ids, vectors, payloads)

    return RagIngestResponse(
        sourceId=req.sourceId,
        status="COMPLETED",
        collection=collection,
        embeddingModel=settings.embedding_model,
        chunks=[
            IngestedChunk(
                chunkIndex=chunks[i].chunk_index,
                qdrantPointId=ids[i],
                contentHash=chunks[i].content_hash,
            )
            for i in range(len(chunks))
        ],
    )


def _build_payload(
    req: RagIngestRequest,
    chunk_index: int,
    page_number: int | None,
    text: str,
    created_at: str,
) -> dict:
    """
    Flatten metadata vào payload Qdrant để filter lúc search không cần JOIN MySQL.
    Cấu trúc bám sát "Metadata chunk bắt buộc" trong docs/09.
    """
    return {
        # --- định danh nguồn ---
        "sourceId": req.sourceId,
        "sourceType": req.sourceType,
        "articleId": req.articleId,
        "documentId": req.documentId,
        "sourceUrl": req.sourceUrl,
        "filePath": req.filePath,
        # --- vị trí chunk ---
        "chunkIndex": chunk_index,
        "pageNumber": page_number,
        "chunkText": text,
        # --- metadata từ Spring Boot (đã denormalize) ---
        "title": req.title,
        "categoryId": req.metadata.categoryId,
        "categoryName": req.metadata.categoryName,
        "slug": req.metadata.slug,
        "tagIds": req.metadata.tagIds,
        "eventIds": req.metadata.eventIds,
        "periodIds": req.metadata.periodIds,
        # --- audit ---
        "createdAt": created_at,
    }
