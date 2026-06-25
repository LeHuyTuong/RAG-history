"""
Cấu hình tập trung của RAG service — đọc từ .env qua pydantic-settings.

Vai trò: single source of truth cho mọi giá trị cấu hình (URL, API key,
tham số pipeline). Không hard-code bất kỳ giá trị nào trong service layer.

Cách dùng trong các service/module khác:
  from app.config import settings
  settings.qdrant_url, settings.default_top_k, ...
"""
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str:
    """Tìm .env từ thư mục hiện tại lên tối đa 3 cấp (hỗ trợ chạy từ repo root hoặc rag-service/)."""
    for parent in [Path.cwd(), *Path.cwd().parents[:3]]:
        candidate = parent / ".env"
        if candidate.is_file():
            return str(candidate)
    return ".env"  # fallback — để pydantic-settings báo lỗi rõ nếu không tìm thấy


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_find_env_file(), extra="ignore")

    # Qdrant Cloud — kết nối qua HTTPS + API key
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection: str = "history_chunks"

    # Google AI Studio — dùng chung key pool cho cả embedding (Gemini) và LLM (Gemma)
    # Key rotation: khi key 1 hết quota ngày thì tự động chuyển sang key 2, 3...
    google_api_key: str = Field(validation_alias=AliasChoices("GOOGLE_API_KEY", "LLM_API_KEY"))
    google_api_key_2: str | None = Field(default=None, validation_alias=AliasChoices("GOOGLE_API_KEY_2", "LLM_API_KEY_2"))
    google_api_key_3: str | None = Field(default=None, validation_alias=AliasChoices("GOOGLE_API_KEY_3", "LLM_API_KEY_3"))
    google_api_key_4: str | None = Field(default=None, validation_alias=AliasChoices("GOOGLE_API_KEY_4", "LLM_API_KEY_4"))
    google_api_key_5: str | None = Field(default=None, validation_alias=AliasChoices("GOOGLE_API_KEY_5", "LLM_API_KEY_5"))
    llm_model: str = "gemma-4-31b-it"
    embedding_model: str = "gemini-embedding-001"
    # embedding_dim phải khớp với collection đã tạo trong Qdrant — đổi model thì phải tạo lại collection
    embedding_dim: int = 768

    # Giá trị mặc định cho pipeline — request có thể override
    default_chunk_size: int = 800
    default_chunk_overlap: int = 120
    default_top_k: int = 5
    score_threshold: float = Field(default=0.55, validation_alias=AliasChoices("MIN_SCORE", "SCORE_THRESHOLD"))


settings = Settings()
