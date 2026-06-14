"""
Bước 0/4 trong chat pipeline: quyết định chiến lược retrieval.

Vai trò: routing layer — quyết định dùng vector search, graph search, hay cả hai.
Trả dict để chat_routes dễ mở rộng mà không cần đổi interface.

Flow trong /rag/chat:
  chat_routes
    → route(question, requested_use_graph)
      → {"use_vector": True, "use_graph": False}
    → retrieval_service (nếu use_vector)
    → [graph_service — chưa implement]

MVP: luôn dùng vector, không dùng graph — Neo4j chừa cho phase sau.
Tham số requested_use_graph giữ nguyên để chat_routes không cần thay đổi
khi Neo4j được thêm vào.
"""


def route(question: str, requested_use_graph: bool = False) -> dict[str, bool]:
    # Graph (Neo4j) chưa implement — bỏ qua requested_use_graph trong MVP
    return {
        "use_vector": True,
        "use_graph": False,
    }
