from app.config import Settings


def test_settings_accepts_llm_api_key_alias(monkeypatch):
    monkeypatch.setenv("QDRANT_URL", "http://qdrant.test")
    monkeypatch.setenv("QDRANT_API_KEY", "qdrant-key")
    monkeypatch.setenv("LLM_API_KEY", "google-from-llm-alias")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    settings = Settings(_env_file=None)

    assert settings.google_api_key == "google-from-llm-alias"


def test_settings_prefers_google_api_key_when_present(monkeypatch):
    monkeypatch.setenv("QDRANT_URL", "http://qdrant.test")
    monkeypatch.setenv("QDRANT_API_KEY", "qdrant-key")
    monkeypatch.setenv("LLM_API_KEY", "google-from-llm-alias")
    monkeypatch.setenv("GOOGLE_API_KEY", "google-direct")

    settings = Settings(_env_file=None)

    assert settings.google_api_key == "google-direct"
