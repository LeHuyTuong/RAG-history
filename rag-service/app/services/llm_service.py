"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi Google GenAI SDK, trả về answer string. Không biết gì về Qdrant hay chunks —
chỉ nhận text vào và trả text ra.

Key rotation: dùng pool key từ settings.api_key_pool (LLM_API_KEY + GOOGLE_API_KEY_2..5,
mỗi biến có thể chứa nhiều key ngăn cách bằng dấu phẩy). Khi 1 key hết quota
ngày (RPD 429) thì loại vĩnh viễn khỏi pool (_key_index chỉ tiến tới, dùng
chung cho mọi request đồng thời, có lock để tránh 2 request cùng lúc double-
advance làm nhảy qua nhầm 1 key còn tốt). Khi dính RPM/TPM (tạm thời) thì
round-robin thử NGAY các key khác còn sống trong pool trước — vì các key là
tài khoản riêng nên rate limit của key này không ảnh hưởng key khác; chỉ khi
mọi key trong 1 vòng đều bị RPM mới sleep rồi thử lại vòng kế. Tránh chat bị
500 khi build graph / ingest đang chiếm quota của key chính, và tránh việc
nhiều request đồng thời cùng dồn vào 1 key rồi cùng sleep-chờ trong khi các
key khác trong pool đang rảnh hoàn toàn.

Raise ValueError nếu LLM trả rỗng — chat_routes bắt và fallback về _NO_DATA_MSG.
"""
import json
import logging
import threading
import time

import httpx
from google import genai
from google.genai import types

from app.config import settings
from app.services.model_registry import resolve_model

logger = logging.getLogger(__name__)

# Pool clients dùng chung cho generate / stream / suggest — khởi tạo lazy
_clients: list[genai.Client] | None = None
_key_index = 0
_index_lock = threading.Lock()


def _advance_past_daily_exhausted(idx: int) -> None:
    """Loại vĩnh viễn key `idx` khỏi pool (dùng chung, khóa để nhiều request
    đồng thời phát hiện cùng 1 key hết quota không double-advance)."""
    global _key_index
    with _index_lock:
        if _key_index == idx:
            logger.warning("Key %d hết quota ngày, loại khỏi pool.", idx)
            _key_index = idx + 1


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


def _invoke(fn, max_rounds: int = 4):
    """
    Gọi fn(client) với key rotation: hết RPD ngày → loại key vĩnh viễn, thử key
    kế trong CÙNG vòng; dính RPM/TPM → round-robin sang key khác còn sống ngay,
    không sleep; chỉ sleep khi cả vòng (mọi key còn sống) đều bị RPM.
    fn nhận 1 genai.Client, trả về kết quả. Lỗi khác (không phải quota) → raise ngay.
    """
    clients = _get_clients()
    n = len(clients)
    last_exc: Exception | None = None
    for _round in range(max_rounds):
        with _index_lock:
            start = _key_index
        if start >= n:
            raise RuntimeError("Tất cả API key đã hết quota ngày (RPD). Chờ reset 00:00 UTC (07:00 VN).")
        rpm_delay: float | None = None
        for idx in range(start, n):
            try:
                return fn(clients[idx])
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                if _is_daily_quota_error(exc):
                    _advance_past_daily_exhausted(idx)
                    continue
                if _is_rate_limit(exc):
                    delay = _parse_retry_delay(exc)
                    logger.warning("Rate limit key %d, thử key khác trong pool. Lỗi: %s", idx, str(exc)[:120])
                    rpm_delay = max(rpm_delay or 0.0, delay)
                    continue
                raise
        if rpm_delay is None:
            break
        logger.warning("Mọi key còn sống đều rate-limit, sleep %.1fs rồi thử lại vòng kế.", rpm_delay)
        time.sleep(rpm_delay)
    if last_exc:
        raise last_exc
    raise RuntimeError("LLM call thất bại sau nhiều lần thử.")


def _groq_generate(system_prompt: str, user_message: str, temperature: float, model: str) -> str:
    """Non-streaming Groq call — dùng cho /chat endpoint."""
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY chưa được cấu hình")

    url = settings.groq_base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "stream": False,
    }
    try:
        with httpx.Client(timeout=120) as cli:
            resp = cli.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            text = (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
            if not text:
                raise ValueError("Groq returned empty response")
            return text
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            logger.warning("Groq rate-limited (429) cho model %s", model)
        raise


def _groq_stream(system_prompt: str, user_message: str, temperature: float, model: str):
    """Stream từ Groq (OpenAI-compatible), yield (kind, text) tuples.

    kind='answer' — token câu trả lời.
    Không có key rotation (Groq free tier ~30 RPM, đủ cho demo nội bộ).
    """
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY chưa được cấu hình")

    url = settings.groq_base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "stream": True,
    }
    try:
        with httpx.Client(timeout=120) as cli:
            with cli.stream("POST", url, headers=headers, json=payload) as resp:
                for line in resp.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    raw = line[len("data: "):]
                    if raw.strip() == "[DONE]":
                        break
                    try:
                        obj = json.loads(raw)
                    except Exception:
                        continue
                    delta = obj.get("choices", [{}])[0].get("delta", {})
                    tok = delta.get("content") or ""
                    if tok:
                        yield ("answer", tok)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            logger.warning("Groq rate-limited (429) cho model %s", model)
        raise

    # Groq không hỗ trợ thinking split — không yield chat.thinking


def generate(system_prompt: str, user_message: str, temperature: float = 0.2, model: str | None = None) -> str:
    provider, real_model = resolve_model(model)
    if provider == "groq":
        return _groq_generate(system_prompt, user_message, temperature, real_model)

    def call(client: genai.Client) -> str:
        response = client.models.generate_content(
            model=real_model,
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


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2, model: str | None = None):
    """
    Yields (kind, text) tuples:
      kind='thinking' — reasoning token từ ThinkingConfig (ẩn với người dùng cuối nếu muốn)
      kind='answer'   — token câu trả lời thực sự

    Multi-provider routing: nếu model là Groq → _groq_stream; nếu là Google →
    key rotation Google path.

    Key rotation chỉ áp dụng TRƯỚC token đầu tiên (không retry giữa chừng → lặp nội dung).
    Giống _invoke: RPD (hết quota ngày) loại key vĩnh viễn; RPM/TPM (tạm thời) round-robin
    thử ngay key khác còn sống trong pool, chỉ sleep khi cả vòng đều bị RPM.
    SDK không hỗ trợ stream → fallback generate() với kind='answer'.
    """
    provider, real_model = resolve_model(model)
    if provider == "groq":
        yield from _groq_stream(system_prompt, user_message, temperature, real_model)
        return

    clients = _get_clients()
    n = len(clients)
    max_rounds = 4

    for _round in range(max_rounds):
        with _index_lock:
            start = _key_index
        if start >= n:
            raise RuntimeError("Tất cả API key đã hết quota ngày (RPD).")
        round_rpm_delay: float | None = None
        for idx in range(start, n):
            done, delay = yield from _stream_one_key(
                clients[idx], idx, system_prompt, user_message, temperature, real_model,
            )
            if done:
                return
            if delay is not None:
                round_rpm_delay = max(round_rpm_delay or 0.0, delay)
        if round_rpm_delay is None:
            break
        logger.warning("Stream: mọi key còn sống đều rate-limit, sleep %.1fs rồi thử lại vòng kế.", round_rpm_delay)
        time.sleep(round_rpm_delay)
    raise RuntimeError("LLM call thất bại sau nhiều lần thử.")


def _stream_one_key(client, idx, system_prompt, user_message, temperature, model):
    """Thử stream với 1 client. `yield from` forward token ra ngoài ngay khi có,
    đồng thời trả (done, rpm_delay) qua giá trị return của generator:
    done=True nghĩa là generate_stream() nên return hẳn (đã xong, hoặc lỗi xảy
    ra sau khi đã lỡ yield token nên không thể retry key khác); done=False
    nghĩa là chưa yield gì và nên thử key kế (rpm_delay khác None nếu lý do là
    rate-limit tạm thời, None nếu là hết quota ngày).
    """
    stream_fn = getattr(client.models, "generate_content_stream", None)
    if stream_fn is None:
        try:
            resp = client.models.generate_content(
                model=model or settings.llm_model,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                ),
            )
            text = (resp.text or "").strip()
            if text:
                for t in _chunk_text(text):
                    yield ("answer", t)
            else:
                raise ValueError("LLM returned empty response")
        except Exception:
            raise
        return (True, None)

    has_text = False
    thought_buf = []
    try:
        for chunk in stream_fn(
            model=model or settings.llm_model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                # LƯU Ý: model Gemma (gemma-*-it) KHÔNG hỗ trợ thinking_config →
                # nếu bật sẽ bị 400 "Thinking budget is not supported for this model"
                # khiến stream vỡ và trả "chưa đủ dữ liệu". Chỉ bật lại khi đổi sang
                # model thinking (vd gemini-2.5-*). Để gọn, hiện tắt hẳn.
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
                    # BỎ THINKING: phần reasoning (thought=True) KHÔNG stream ra FE,
                    # chỉ gom lại để fallback nếu model lỡ không sinh câu trả lời nào.
                    if getattr(part, "thought", False):
                        thought_buf.append(text)
                        continue
                    has_text = True
                    yield ("answer", text)
            else:
                # Fallback: SDK cũ không có parts
                text = getattr(chunk, "text", None) or ""
                if text:
                    has_text = True
                    yield ("answer", text)

        if not has_text:
            # Model chỉ sinh reasoning, không có câu trả lời → tránh bong bóng trống:
            # dùng tạm nội dung reasoning thay vì báo rỗng.
            if thought_buf:
                for t in thought_buf:
                    yield ("answer", t)
                return (True, None)
            raise ValueError("LLM returned empty stream")
        return (True, None)
    except Exception as exc:  # noqa: BLE001
        if has_text:
            raise
        if _is_daily_quota_error(exc):
            _advance_past_daily_exhausted(idx)
            return (False, None)
        if _is_rate_limit(exc):
            delay = _parse_retry_delay(exc)
            logger.warning("Stream rate limit key %d, thử key khác trong pool. Lỗi: %s", idx, str(exc)[:120])
            return (False, delay)
        raise


def suggest_questions(question: str, answer: str, model: str | None = None) -> list[str]:
    """Sinh 3 câu hỏi gợi ý liên quan dựa trên cặp question-answer vừa trả lời.

    Luôn dùng Google default model (settings.llm_model) — gợi ý là tính năng phụ,
    không đáng tốn RPM Groq."""
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


def suggest_questions_from_docs(context: str, n: int = 4) -> list[str]:
    prompt = (
        f"Dựa trên các đoạn sử liệu sau:\n\n{context[:4000]}\n\n"
        f"Hãy đề xuất đúng {n} câu hỏi mà người đọc có thể muốn tìm hiểu. "
        "Mỗi câu một dòng, không đánh số, không giải thích."
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
        return [ln for ln in lines if len(ln) > 10][:n]
    except Exception:
        return []


def _chunk_text(text: str, chunk_size: int = 48):
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
