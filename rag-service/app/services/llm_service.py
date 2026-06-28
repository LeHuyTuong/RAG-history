"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi Google GenAI SDK, trả về answer string. Không biết gì về Qdrant hay chunks —
chỉ nhận text vào và trả text ra.

Key rotation: dùng pool key từ settings.api_key_pool (LLM_API_KEY + GOOGLE_API_KEY_2..5,
mỗi biến có thể chứa nhiều key ngăn cách bằng dấu phẩy). Khi 1 key hết
quota ngày (RPD 429) tự chuyển key tiếp; khi dính RPM/TPM thì chờ rồi thử lại cùng key.
Điều này tránh chat bị 500 khi build graph / ingest đang chiếm quota của key chính.

Raise ValueError nếu LLM trả rỗng — chat_routes bắt và fallback về _NO_DATA_MSG.
"""
import logging
import time

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# Pool clients dùng chung cho generate / stream / suggest — khởi tạo lazy
_clients: list[genai.Client] | None = None
_key_index = 0


def _build_clients() -> list[genai.Client]:
    return [genai.Client(api_key=k) for k in settings.api_key_pool]


def _get_clients() -> list[genai.Client]:
    global _clients
    if _clients is None:
        _clients = _build_clients()
    return _clients


def _is_daily_quota_error(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and (
        "PerDay" in msg or "per-day" in msg or "free_tier_requests" in msg
    )


def _is_rate_limit(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg or "429" in msg or "retry in" in msg


def _parse_retry_delay(exc: Exception) -> float:
    import re
    m = re.search(r"retry in (\d+(?:\.\d+)?)s", str(exc))
    return float(m.group(1)) + 2 if m else 20.0


def _invoke(fn, max_attempts: int = 12):
    """
    Gọi fn(client) với key rotation: hết RPD ngày → chuyển key; dính RPM → chờ + thử lại.
    fn nhận 1 genai.Client, trả về kết quả. Lỗi khác (không phải quota) → raise ngay.
    """
    global _key_index
    clients = _get_clients()
    last_exc: Exception | None = None
    for _ in range(max_attempts):
        if _key_index >= len(clients):
            raise RuntimeError("Tất cả API key đã hết quota ngày (RPD). Chờ reset 00:00 UTC (07:00 VN).")
        try:
            return fn(clients[_key_index])
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if _is_daily_quota_error(exc):
                logger.warning("Key %d hết quota ngày, chuyển key tiếp.", _key_index)
                _key_index += 1
                continue
            if _is_rate_limit(exc):
                delay = _parse_retry_delay(exc)
                logger.warning("Rate limit key %d, sleep %.1fs. Lỗi: %s", _key_index, delay, str(exc)[:120])
                time.sleep(delay)
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("LLM call thất bại sau nhiều lần thử.")


def generate(system_prompt: str, user_message: str, temperature: float = 0.2) -> str:
    def call(client: genai.Client) -> str:
        response = client.models.generate_content(
            model=settings.llm_model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
            ),
        )
        return (response.text or "").strip()

    text = _invoke(call)
    if not text:
        raise ValueError("LLM returned empty response")
    return text


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2):
    """
    Yields (kind, text) tuples:
      kind='thinking' — reasoning token từ ThinkingConfig (ẩn với người dùng cuối nếu muốn)
      kind='answer'   — token câu trả lời thực sự

    Key rotation chỉ áp dụng TRƯỚC token đầu tiên (không retry giữa chừng → lặp nội dung).
    SDK không hỗ trợ stream → fallback generate() với kind='answer'.
    """
    global _key_index
    clients = _get_clients()

    for _ in range(len(clients) + 2):
        if _key_index >= len(clients):
            raise RuntimeError("Tất cả API key đã hết quota ngày (RPD).")
        client = clients[_key_index]
        stream_fn = getattr(client.models, "generate_content_stream", None)
        if stream_fn is None:
            for t in _chunk_text(generate(system_prompt, user_message, temperature)):
                yield ("answer", t)
            return

        has_text = False
        try:
            for chunk in stream_fn(
                model=settings.llm_model,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                    thinking_config=types.ThinkingConfig(
                        include_thoughts=True,
                        thinking_budget=1024,  # ~8-15s thinking, đủ cho câu hỏi lịch sử phổ thông
                    ),
                ),
            ):
                # Dùng parts API để tách thinking vs answer
                parts = []
                try:
                    if chunk.candidates:
                        parts = chunk.candidates[0].content.parts or []
                except Exception:  # noqa: BLE001
                    pass

                if parts:
                    for part in parts:
                        text = getattr(part, "text", None) or ""
                        if not text:
                            continue
                        has_text = True
                        kind = "thinking" if getattr(part, "thought", False) else "answer"
                        yield (kind, text)
                else:
                    # Fallback: SDK cũ không có parts
                    text = getattr(chunk, "text", None) or ""
                    if text:
                        has_text = True
                        yield ("answer", text)

            if not has_text:
                raise ValueError("LLM returned empty stream")
            return
        except Exception as exc:  # noqa: BLE001
            if has_text:
                raise
            if _is_daily_quota_error(exc):
                logger.warning("Stream key %d hết quota ngày, chuyển key tiếp.", _key_index)
                _key_index += 1
                continue
            if _is_rate_limit(exc):
                delay = _parse_retry_delay(exc)
                logger.warning("Stream rate limit key %d, sleep %.1fs. Lỗi: %s", _key_index, delay, str(exc)[:120])
                time.sleep(delay)
                continue
            raise


def suggest_questions(question: str, answer: str) -> list[str]:
    """Sinh 3 câu hỏi gợi ý liên quan dựa trên cặp question-answer vừa trả lời."""
    prompt = (
        f"Câu hỏi: {question}\n"
        f"Câu trả lời: {answer[:600]}\n\n"
        "Dựa trên cuộc trò chuyện về lịch sử Việt Nam trên, hãy đề xuất đúng 3 câu hỏi "
        "tiếp theo mà người dùng có thể muốn tìm hiểu thêm. "
        "Chỉ liệt kê 3 câu hỏi, mỗi câu một dòng, không đánh số, không giải thích."
    )

    def call(client: genai.Client) -> str:
        response = client.models.generate_content(
            model=settings.llm_model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        return (response.text or "").strip()

    try:
        text = _invoke(call)
        lines = [ln.strip().lstrip("-•*").strip() for ln in text.splitlines() if ln.strip()]
        return [ln for ln in lines if len(ln) > 10][:3]
    except Exception:  # noqa: BLE001
        return []


def _chunk_text(text: str, chunk_size: int = 48):
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
