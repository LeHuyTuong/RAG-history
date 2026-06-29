"""
API layer cho ingestion: POST /rag/ingest và DELETE /rag/delete.

Vai trò: nhận request từ Spring Boot, validate input (Pydantic tự làm),
gọi ingest_service, và trả về response. Không chứa logic xử lý.

2 endpoints:
  POST   /rag/ingest         — ingest 1 source mới (hoặc re-ingest)
  DELETE /rag/delete?sourceId — xóa toàn bộ vector của 1 source

Import ingest_service lazy (bên trong hàm) để tránh khởi tạo heavy resources
(Qdrant client, Gemini client) khi app start — chỉ khởi tạo khi có request.
"""
from fastapi import APIRouter, Depends, Header, HTTPException

from app.schemas.ingest import RagIngestRequest, RagIngestResponse

router = APIRouter()


def _verify_api_key(x_rag_api_key: str | None = Header(default=None)) -> None:
    """Kiểm tra X-Rag-Api-Key header. Bỏ qua nếu RAG_API_KEY chưa được cấu hình (dev mode)."""
    from app.config import settings
    if settings.rag_api_key and x_rag_api_key != settings.rag_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Rag-Api-Key header.")


@router.post("/ingest", response_model=RagIngestResponse, dependencies=[Depends(_verify_api_key)])
async def ingest_source(req: RagIngestRequest):
    from app.services.ingest_service import ingest
    try:
        return ingest(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(e)}")


@router.delete("/delete", dependencies=[Depends(_verify_api_key)])
async def delete_source(sourceId: int):
    from app.vectorstore.vector_repository import delete_by_source_id
    from app.config import settings
    delete_by_source_id(settings.qdrant_collection, sourceId)
    return {"status": "deleted", "sourceId": sourceId}
