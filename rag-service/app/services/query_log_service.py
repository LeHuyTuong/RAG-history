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

_client = None  # module-level lazy-init
_in_memory_logs: list[dict] = []


def _collection():
    """Lazy-init MongoClient (timeout ngắn để Mongo chậm không kéo dài lượt chat)."""
    global _client
    from app.config import settings

    if _client is None:
        from pymongo import MongoClient
        _client = MongoClient(
            settings.mongo_url,
            serverSelectionTimeoutMS=2000,
            tlsAllowInvalidCertificates=True,
        )
    return _client[settings.mongo_db][settings.query_log_collection]


def log_query(doc: dict) -> None:
    """Ghi 1 document log. Nuốt mọi lỗi Mongo, fallback lưu memory."""
    import uuid
    from datetime import datetime, timezone

    log_item = dict(doc)
    if "id" not in log_item:
        log_item["id"] = f"log-{uuid.uuid4().hex[:8]}"
    if "createdAt" not in log_item:
        log_item["createdAt"] = datetime.now(timezone.utc).isoformat()

    _in_memory_logs.insert(0, log_item)

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
    """Đọc log gần nhất (mới nhất trước). Thử đọc từ Mongo; nếu không có hoặc
    lỗi kết nối thì dùng mảng fallback để không bị trống dữ liệu."""
    from app.config import settings

    if settings.mongo_url:
        try:
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

            cursor = _collection().find(query).sort("createdAt", -1).limit(limit)
            results = [_serialize(doc) for doc in cursor]
            if results:
                return results
        except Exception as exc:
            logger.warning("query log list Mongo failed, using local fallback: %s", exc)

    filtered = list(_in_memory_logs)
    if question:
        q_lower = question.lower()
        filtered = [item for item in filtered if q_lower in (item.get("question") or "").lower()]
    if used_vector is not None:
        filtered = [item for item in filtered if item.get("usedVector") == used_vector]
    if used_graph is not None:
        filtered = [item for item in filtered if item.get("usedGraph") == used_graph]
    if used_web is not None:
        filtered = [item for item in filtered if item.get("usedWeb") == used_web]
    if transport:
        t_lower = transport.lower()
        filtered = [item for item in filtered if (item.get("transport") or "").lower() == t_lower]

    return filtered[:limit]


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
