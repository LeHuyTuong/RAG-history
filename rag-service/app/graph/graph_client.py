"""
Kết nối Neo4j cho GraphRAG — singleton driver + khởi tạo schema.

Vai trò: tương tự qdrant_client cho vector store. Cung cấp driver dùng chung
và đảm bảo các constraint/index cần thiết tồn tại trước khi ghi/đọc graph.

Schema graph:
  (:Entity {name, type})                    — thực thể lịch sử, unique theo name
  (:Entity)-[:REL {type, context, page, docId}]->(:Entity)  — quan hệ
  (:Chunk {pointId, docId, page, processed}) — đánh dấu chunk đã trích (cho resume)

MERGE theo Entity.name (đã normalize) để cùng 1 nhân vật xuất hiện ở nhiều chunk
được gộp thành 1 node duy nhất — đây là cốt lõi giúp nối thông tin rời rạc.
"""
import time

from neo4j import Driver, GraphDatabase

from app.config import settings

_driver: Driver | None = None

# Cache trạng thái Neo4j có kết nối được không — tránh chờ timeout lặp lại mỗi câu hỏi.
# Khi team CHƯA có Neo4j, lần check đầu fail nhanh (~3s) rồi cache → các câu sau bỏ graph tức thì.
_avail_cache: dict = {"ok": None, "ts": 0.0}
_AVAIL_TTL = 60.0  # giây — re-check sau ngần này (cho phép Neo4j bật lên giữa chừng)


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
            connection_timeout=3.0,             # TCP connect — fail nhanh nếu không có Neo4j
            connection_acquisition_timeout=5.0,  # tổng thời gian lấy connection
            max_transaction_retry_time=3.0,     # không retry lâu khi lỗi
        )
    return _driver


def graph_available() -> bool:
    """True nếu Neo4j kết nối được. Cache kết quả _AVAIL_TTL giây để không chờ timeout mỗi lần."""
    now = time.time()
    if _avail_cache["ok"] is not None and (now - _avail_cache["ts"]) < _AVAIL_TTL:
        return _avail_cache["ok"]
    try:
        get_driver().verify_connectivity()
        _avail_cache["ok"] = True
    except Exception:  # noqa: BLE001
        _avail_cache["ok"] = False
    _avail_cache["ts"] = now
    return _avail_cache["ok"]


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def ensure_schema() -> None:
    """Tạo constraint + index (idempotent) — gọi 1 lần trước khi ghi graph."""
    statements = [
        "CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE",
        "CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.pointId IS UNIQUE",
        "CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)",
    ]
    with get_driver().session(database=settings.neo4j_database) as session:
        for stmt in statements:
            session.run(stmt)


def chunk_already_processed(point_id: str) -> bool:
    """True nếu chunk này đã được trích trước đó (dùng cho --resume)."""
    with get_driver().session(database=settings.neo4j_database) as session:
        rec = session.run(
            "MATCH (c:Chunk {pointId: $pid}) RETURN c.processed AS p",
            pid=point_id,
        ).single()
        return bool(rec and rec["p"])


def write_graph(point_id: str, doc_id: int, page: int | None,
                entities: list[dict], relations: list[dict]) -> None:
    """
    Ghi entities + relations của 1 chunk vào Neo4j trong 1 transaction.
    MERGE entity theo name → gộp trùng. Đánh dấu Chunk.processed=true để resume.
    """
    with get_driver().session(database=settings.neo4j_database) as session:
        session.execute_write(_write_tx, point_id, doc_id, page, entities, relations)


def _write_tx(tx, point_id, doc_id, page, entities, relations):
    # 1. Đánh dấu chunk đã xử lý
    tx.run(
        "MERGE (c:Chunk {pointId: $pid}) SET c.docId=$doc, c.page=$page, c.processed=true",
        pid=point_id, doc=doc_id, page=page,
    )
    # 2. MERGE từng entity (gộp theo name); cập nhật type nếu chưa có
    for ent in entities:
        name = (ent.get("name") or "").strip()
        if not name:
            continue
        tx.run(
            "MERGE (e:Entity {name: $name}) "
            "ON CREATE SET e.type=$type "
            "ON MATCH SET e.type=coalesce(e.type, $type)",
            name=name, type=(ent.get("type") or "").strip(),
        )
    # 3. MERGE quan hệ — lưu type quan hệ làm property để query linh hoạt
    for rel in relations:
        src = (rel.get("source") or "").strip()
        tgt = (rel.get("target") or "").strip()
        rtype = (rel.get("relation") or "LIÊN_QUAN").strip()
        if not src or not tgt:
            continue
        tx.run(
            "MERGE (a:Entity {name: $src}) "
            "MERGE (b:Entity {name: $tgt}) "
            "MERGE (a)-[r:REL {type: $rtype}]->(b) "
            "SET r.context=$ctx, r.page=$page, r.docId=$doc",
            src=src, tgt=tgt, rtype=rtype,
            ctx=(rel.get("context") or "")[:300], page=page, doc=doc_id,
        )
