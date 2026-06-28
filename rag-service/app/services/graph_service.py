"""
Graph retrieval cho GraphRAG: tìm entity trong câu hỏi → mở rộng quan hệ từ Neo4j.

Vai trò: bổ sung cho vector retrieval. Khi câu hỏi hỏi về quan hệ thực thể
("tướng dưới trướng X", "con của Y"), vector search thường thiếu vì thông tin
nằm rải rác; graph trả về trực tiếp các quan hệ của entity được nhắc tới.

Flow trong /rag/chat (khi use_graph=True):
  chat_routes
    → graph_service.retrieve_graph_context(question)
      1. find_entities_in_question()  — match tên entity xuất hiện trong câu hỏi
      2. expand_relations()           — lấy quan hệ 1-hop của các entity đó
    → list[str] context  →  ghép vào prompt cùng vector chunks

Trả về list câu mô tả quan hệ dạng text để LLM đọc, không trả raw graph.
"""
from __future__ import annotations

from app.config import settings
from app.graph.graph_client import get_driver, graph_available


def find_entities_in_question(question: str, max_entities: int = 8) -> list[str]:
    """
    Tìm các entity trong graph có tên xuất hiện trong câu hỏi.
    Dùng CONTAINS 2 chiều: ưu tiên tên dài (cụ thể) trước.
    """
    q = question.strip()
    with get_driver().session(database=settings.neo4j_database) as session:
        rows = session.run(
            "MATCH (e:Entity) "
            "WHERE size(e.name) >= 3 AND toLower($q) CONTAINS toLower(e.name) "
            "RETURN e.name AS name, e.type AS type "
            "ORDER BY size(e.name) DESC LIMIT $lim",
            q=q, lim=max_entities,
        )
        return [r["name"] for r in rows]


def expand_relations(entity_names: list[str], limit: int = 30) -> list[str]:
    """
    Lấy quan hệ 1-hop của các entity → format thành câu text cho prompt.
    VD: "Đinh Bộ Lĩnh —PHONG_CHỨC→ Lê Hoàn (Thập đạo tướng quân)"
    """
    if not entity_names:
        return []
    with get_driver().session(database=settings.neo4j_database) as session:
        rows = session.run(
            "MATCH (a:Entity)-[r:REL]->(b:Entity) "
            "WHERE a.name IN $names OR b.name IN $names "
            "RETURN a.name AS src, r.type AS rel, b.name AS tgt, r.context AS ctx "
            "LIMIT $lim",
            names=entity_names, lim=limit,
        )
        facts = []
        for r in rows:
            line = f"{r['src']} —{r['rel']}→ {r['tgt']}"
            if r["ctx"]:
                line += f" ({r['ctx']})"
            facts.append(line)
        return facts


def retrieve_graph_context(question: str) -> list[str]:
    """
    Entry point: câu hỏi → list câu quan hệ từ graph.
    Trả [] ngay nếu Neo4j không sẵn sàng (team chưa có Neo4j) hoặc không match entity nào.
    """
    if not graph_available():
        return []
    entities = find_entities_in_question(question)
    if not entities:
        return []
    return expand_relations(entities)
