"""
Route UI model ID → (provider, real_model_id) cho multi-provider LLM support.

Provider hiện tại: "google" (Google GenAI SDK) và "groq" (OpenAI-compatible API).

Registry map:
  - key = model ID từ dropdown admin setting rag.llm_model (hoặc từ req.model)
  - value = (provider, real_model_id)

Guard: model không tồn tại trong registry → ("google", settings.llm_model)
để không bao giờ gửi model-id sai provider gây 404.
"""

from app.config import settings


def resolve_model(ui_model: str | None) -> tuple[str, str]:
    if ui_model is None:
        return "google", settings.llm_model

    entry = _REGISTRY.get(ui_model)
    if entry is not None:
        return entry

    return "google", settings.llm_model


_REGISTRY: dict[str, tuple[str, str]] = {
    # Google models — real_id là model-id của Google GenAI
    "gemma-4-26b":   ("google", "gemma-4-26b-a4b-it"),
    "gemma-4-31b":   ("google", "gemma-4-31b-it"),
    "gemini-2.0-flash": ("google", "gemini-2.0-flash"),

    # Groq models — real_id là model-id gửi lên api.groq.com
    "gpt-oss-120b":   ("groq", "openai/gpt-oss-120b"),
    "gpt-oss-20b":    ("groq", "openai/gpt-oss-20b"),
    "llama-3.3-70b":  ("groq", "llama-3.3-70b-versatile"),
}
