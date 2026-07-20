"""
API layer để xem log lượt hỏi-đáp RAG: GET /rag/logs.

Đọc trực tiếp từ MongoDB (`rag_query_logs`, ghi bởi `query_log_service.log_query`
trong chat_routes) — phục vụ evaluation/debug (docs/18), thay bảng đánh giá
thủ công bằng dữ liệu query được.

Không auth (giống /rag/retrieve) vì service chỉ expose nội bộ (xem main.py).
Trả [] nếu MONGO_URL chưa cấu hình, không lỗi 500.
"""
from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/logs")
async def list_query_logs(
    limit: int = Query(default=20, ge=1, le=200),
    question: str | None = None,
    usedVector: bool | None = None,
    usedGraph: bool | None = None,
    usedWeb: bool | None = None,
    transport: str | None = None,
):
    from app.services import query_log_service

    return query_log_service.list_logs(
        limit=limit,
        question=question,
        used_vector=usedVector,
        used_graph=usedGraph,
        used_web=usedWeb,
        transport=transport,
    )
