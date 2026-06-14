"""
Cấu hình tập trung của RAG service — đọc từ .env qua pydantic-settings.

Vai trò: single source of truth cho mọi giá trị cấu hình (URL, API key,
tham số pipeline). Không hard-code bất kỳ giá trị nào trong service layer.

Cách dùng trong các service/module khác:
  from app.config import settings
  settings.qdrant_url, settings.default_top_k, ...
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Qdrant Cloud — kết nối qua HTTPS + API key
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection: str = "history_chunks"

    # Google AI Studio — dùng chung 1 key cho cả embedding (Gemini) và LLM (Gemma)
    google_api_key: str
    llm_model: str = "gemma-3-27b-it"
    embedding_model: str = "gemini-embedding-001"
    # embedding_dim phải khớp với collection đã tạo trong Qdrant — đổi model thì phải tạo lại collection
    embedding_dim: int = 768

    # Giá trị mặc định cho pipeline — request có thể override
    default_chunk_size: int = 800
    default_chunk_overlap: int = 120
    default_top_k: int = 5
    score_threshold: float = 0.5


settings = Settings()
