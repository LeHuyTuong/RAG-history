"""
Bước 0/4 trong chat pipeline: validate input và quyết định chiến lược retrieval.

Vai trò: routing layer — quyết định dùng vector search, graph search, hay cả hai.
Trả dict để chat_routes dễ mở rộng mà không cần đổi interface.

Flow trong /rag/chat:
  chat_routes
    → validate_question(question)   — lọc input vô nghĩa trước khi đụng vào Qdrant
    → route(question, requested_use_graph)
      → {"use_vector": True, "use_graph": False}
    → retrieval_service (nếu use_vector)
    → [graph_service — chưa implement]

MVP: luôn dùng vector, không dùng graph — Neo4j chừa cho phase sau.
Tham số requested_use_graph giữ nguyên để chat_routes không cần thay đổi
khi Neo4j được thêm vào.
"""
import re

# Câu hỏi quá ngắn (sau khi strip) không thể là câu hỏi lịch sử hợp lệ
_MIN_CHARS = 10

# Tiếng cười, emoji, ký tự ngẫu nhiên, câu quá ngắn ít từ
_NOISE_RE = re.compile(
    r"""^(?:
        h[eèéê]+h[eèéê]*       |  # hehe, hehehe
        h[iìíî]+h[iìíî]*       |  # hihi
        h[aàáâ]+h[aàáâ]*       |  # haha
        l+o+l+                 |  # lol, loool
        x+d+                   |  # xD, xxdd
        (?:[\W_]|\s)*          |  # chỉ dấu câu / khoảng trắng
        .{1,4}                    # bất kỳ chuỗi ≤ 4 ký tự
    )$""",
    re.IGNORECASE | re.VERBOSE,
)


def validate_question(question: str) -> str | None:
    """
    Trả về None nếu câu hỏi hợp lệ.
    Trả về thông báo lỗi (string) nếu câu hỏi không hợp lệ.
    """
    q = question.strip()
    if len(q) < _MIN_CHARS:
        return "Câu hỏi quá ngắn. Vui lòng đặt câu hỏi cụ thể hơn về lịch sử Việt Nam."
    if _NOISE_RE.fullmatch(q):
        return "Tôi chỉ trả lời các câu hỏi về lịch sử Việt Nam. Bạn muốn hỏi gì không?"
    return None


def route(question: str, requested_use_graph: bool = False) -> dict[str, bool]:
    # Graph (Neo4j) chưa implement — bỏ qua requested_use_graph trong MVP
    return {
        "use_vector": True,
        "use_graph": False,
    }
