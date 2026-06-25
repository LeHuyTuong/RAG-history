"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi Google GenAI SDK, trả về answer string. Không biết gì về Qdrant hay chunks —
chỉ nhận text vào và trả text ra.

Flow trong /rag/chat:
  prompt_service  →  (system_prompt, user_message)
    → generate(system_prompt, user_message, temperature)
      1. _get_client()                        — singleton genai.Client
      2. client.models.generate_content(...)  — gọi Gemma qua Google AI Studio
      3. response.text.strip()               — trích text thuần
  → answer  →  citation_service

Dùng singleton client để tái sử dụng HTTP connection giữa các request.
Raise ValueError nếu LLM trả rỗng — chat_routes bắt exception này
và fallback về _NO_DATA_MSG thay vì crash 500.
"""
from google import genai
from google.genai import types

from app.config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


def generate(system_prompt: str, user_message: str, temperature: float = 0.2) -> str:
    response = _get_client().models.generate_content(
        model=settings.llm_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise ValueError("LLM returned empty response")
    return text


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2):
    models = _get_client().models
    stream_fn = getattr(models, "generate_content_stream", None)
    if stream_fn is None:
        yield from _chunk_text(generate(system_prompt, user_message, temperature))
        return

    has_text = False
    for chunk in stream_fn(
        model=settings.llm_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        ),
    ):
        text = getattr(chunk, "text", None) or ""
        if text:
            has_text = True
            yield text

    if not has_text:
        raise ValueError("LLM returned empty stream")


def suggest_questions(question: str, answer: str) -> list[str]:
    """Sinh 3 câu hỏi gợi ý liên quan dựa trên cặp question-answer vừa trả lời."""
    prompt = (
        f"Câu hỏi: {question}\n"
        f"Câu trả lời: {answer[:600]}\n\n"
        "Dựa trên cuộc trò chuyện về lịch sử Việt Nam trên, hãy đề xuất đúng 3 câu hỏi "
        "tiếp theo mà người dùng có thể muốn tìm hiểu thêm. "
        "Chỉ liệt kê 3 câu hỏi, mỗi câu một dòng, không đánh số, không giải thích."
    )
    try:
        response = _get_client().models.generate_content(
            model=settings.llm_model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        text = (response.text or "").strip()
        lines = [ln.strip().lstrip("-•*").strip() for ln in text.splitlines() if ln.strip()]
        return [ln for ln in lines if len(ln) > 10][:3]
    except Exception:  # noqa: BLE001
        return []


def _chunk_text(text: str, chunk_size: int = 48):
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
