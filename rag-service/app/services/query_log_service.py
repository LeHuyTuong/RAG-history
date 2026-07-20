"""
Ghi log mỗi lượt hỏi-đáp RAG vào MongoDB (`rag_query_logs`) — phục vụ
evaluation/debug (docs/18), thay cho bảng đánh giá thủ công.

Fire-and-forget: nuốt mọi lỗi (Mongo down, chưa cấu hình MONGO_URL, insert lỗi)
để việc log KHÔNG BAO GIỜ làm chậm hay làm sập chat. Không phải service nào
khác trong app biết Mongo tồn tại — mọi thứ đóng gói ở đây.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

_client = None  # module-level lazy-init, cache lại sau lần đầu


def _collection():
    """Lazy-init MongoClient (timeout ngắn để Mongo chậm không kéo dài lượt chat)."""
    global _client
    from app.config import settings

    if _client is None:
        from pymongo import MongoClient
        _client = MongoClient(settings.mongo_url, serverSelectionTimeoutMS=2000)
    return _client[settings.mongo_db][settings.query_log_collection]


def log_query(doc: dict) -> None:
    """Ghi 1 document log. No-op nếu chưa cấu hình; nuốt mọi lỗi khác."""
    from app.config import settings

    if not settings.query_log_enabled or not settings.mongo_url:
        return
    try:
        _collection().insert_one(doc)
    except Exception as exc:
        logger.warning("query log failed: %s", exc)


def list_logs(
    *,
    limit: int = 20,
    question: str | None = None,
    used_vector: bool | None = None,
    used_graph: bool | None = None,
    used_web: bool | None = None,
    transport: str | None = None,
) -> list[dict]:
    """Đọc log gần nhất (mới nhất trước), có filter cơ bản. Trả [] nếu chưa
    cấu hình Mongo hoặc query lỗi — không raise (endpoint /rag/logs chỉ để
    xem/evaluation, không được làm hỏng service)."""
    from app.config import settings

    if not settings.mongo_url:
        return []

    query: dict = {}
    if question:
        import re
        query["question"] = {"$regex": re.escape(question), "$options": "i"}
    if used_vector is not None:
        query["usedVector"] = used_vector
    if used_graph is not None:
        query["usedGraph"] = used_graph
    if used_web is not None:
        query["usedWeb"] = used_web
    if transport:
        query["transport"] = transport

    try:
        cursor = _collection().find(query).sort("createdAt", -1).limit(limit)
        return [_serialize(doc) for doc in cursor]
    except Exception as exc:
        logger.warning("query log list failed: %s", exc)
        return []


def _serialize(doc: dict) -> dict:
    """Mongo ObjectId không tự serialize JSON được — đổi `_id` thành `id` (str)."""
    doc["id"] = str(doc.pop("_id"))
    return doc


def close() -> None:
    """Đóng client lúc shutdown (gọi từ lifespan trong main.py)."""
    global _client
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
        _client = None
