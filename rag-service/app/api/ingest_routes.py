from fastapi import APIRouter, HTTPException

from app.schemas.ingest import RagIngestRequest, RagIngestResponse

router = APIRouter()


@router.post("/ingest", response_model=RagIngestResponse)
async def ingest_source(req: RagIngestRequest):
    from app.services.ingest_service import ingest
    try:
        return ingest(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(e)}")


@router.delete("/delete")
async def delete_source(sourceId: int):
    from app.vectorstore.vector_repository import delete_by_source_id
    from app.config import settings
    delete_by_source_id(settings.qdrant_collection, sourceId)
    return {"status": "deleted", "sourceId": sourceId}
