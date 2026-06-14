"""
Bước 2/4 trong chat pipeline: build prompt từ câu hỏi + chunks retrieved.

Vai trò: chuyển list[ScoredPoint] từ Qdrant thành text prompt có cấu trúc
để LLM đọc và trả lời. Không gọi LLM — chỉ format text.

Flow trong /rag/chat:
  retrieval_service  →  [ScoredPoint, ...]
    → load_system_prompt()         — đọc system_prompt.txt (prompt không hard-code trong code)
    → build_user_message(q, hits)  — ghép câu hỏi + context chunks
  → llm_service.generate(system_prompt, user_message)

Mỗi chunk được format thành [C1], [C2]... để LLM có thể trích dẫn
trong câu trả lời (citation inline). citation_service sau đó map [C1] →
Citation object dựa trên cùng payload đó.

Prompt đặt trong file .txt (không hard-code trong Python) theo quy định docs/08
— admin có thể chỉnh prompt mà không cần sửa code.
"""
from pathlib import Path

from qdrant_client.models import ScoredPoint

_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "system_prompt.txt"


def load_system_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_user_message(question: str, hits: list[ScoredPoint]) -> str:
    context = "\n\n".join(_format_hit(i, hit) for i, hit in enumerate(hits, start=1))
    return (
        "CONTEXT:\n"
        f"{context}\n\n"
        "QUESTION:\n"
        f"{question}\n\n"
        "Yêu cầu: Trả lời dựa trên CONTEXT. Nếu không đủ nguồn, nói rõ là dữ liệu chưa đủ."
    )


def _format_hit(index: int, hit: ScoredPoint) -> str:
    """Format 1 Qdrant hit thành block [C{index}] để LLM nhận dạng và trích dẫn."""
    payload = hit.payload or {}
    title = payload.get("title") or "Không rõ tiêu đề"
    source_type = payload.get("sourceType") or "UNKNOWN"
    source_id = payload.get("sourceId")
    page_number = payload.get("pageNumber")
    chunk_index = payload.get("chunkIndex")
    chunk_text = payload.get("chunkText") or ""
    score = round(float(hit.score), 4) if hit.score is not None else None

    location = f"chunkIndex={chunk_index}"
    if page_number is not None:
        location = f"{location}, pageNumber={page_number}"

    return (
        f"[C{index}]\n"
        f"sourceType={source_type}; sourceId={source_id}; title={title}; "
        f"{location}; score={score}\n"
        f"{chunk_text}"
    )
