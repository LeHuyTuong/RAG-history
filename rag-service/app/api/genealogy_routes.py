"""
Genealogy API routes — read-only endpoints for royal family trees.

Endpoints:
  GET /rag/genealogy/{dynasty}/tree         — cây gia phả
  GET /rag/genealogy/{dynasty}/generations  — số đời từ thuỷ tổ
  GET /rag/genealogy/{dynasty}/gaps         — phát hiện thất lạc
"""
from fastapi import APIRouter, HTTPException

from app.services.genealogy_service import GenealogyService

router = APIRouter()
_service: GenealogyService | None = None


def _get_service() -> GenealogyService:
    global _service
    if _service is None:
        _service = GenealogyService()
    return _service


@router.get("/genealogy/{dynasty}/tree")
async def get_tree(dynasty: str):
    _validate_dynasty(dynasty)
    svc = _get_service()
    result = svc.get_tree(dynasty)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No genealogy data for {dynasty}")
    return result


@router.get("/genealogy/{dynasty}/generations")
async def get_generations(dynasty: str):
    _validate_dynasty(dynasty)
    svc = _get_service()
    result = svc.count_generations(dynasty)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No genealogy data for {dynasty}")
    return result


@router.get("/genealogy/{dynasty}/gaps")
async def get_gaps(dynasty: str):
    _validate_dynasty(dynasty)
    svc = _get_service()
    result = svc.find_gaps(dynasty)
    return result


def _validate_dynasty(dynasty: str) -> None:
    if dynasty not in ("ly", "tran"):
        raise HTTPException(status_code=400, detail="dynasty must be 'ly' or 'tran'")
