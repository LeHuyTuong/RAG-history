from types import SimpleNamespace

import pytest

from app.services import llm_service


class FakeModels:
    def __init__(self, text=" Tra loi co citation [C1]. ", stream_chunks=None):
        self.text = text
        self.stream_chunks = stream_chunks if stream_chunks is not None else ["A", "B"]
        self.calls = []

    def generate_content(self, model, contents, config):
        self.calls.append({
            "kind": "generate",
            "model": model,
            "contents": contents,
            "system_instruction": config.system_instruction,
            "temperature": config.temperature,
        })
        return SimpleNamespace(text=self.text)

    def generate_content_stream(self, model, contents, config):
        self.calls.append({
            "kind": "stream",
            "model": model,
            "contents": contents,
            "system_instruction": config.system_instruction,
            "temperature": config.temperature,
        })
        for text in self.stream_chunks:
            yield SimpleNamespace(text=text)


class FakeModelsWithoutStream:
    def __init__(self, text):
        self.text = text
        self.calls = []

    def generate_content(self, model, contents, config):
        self.calls.append({
            "kind": "generate",
            "model": model,
            "contents": contents,
            "system_instruction": config.system_instruction,
            "temperature": config.temperature,
        })
        return SimpleNamespace(text=self.text)


def test_generate_calls_google_model_and_strips_text(monkeypatch):
    models = FakeModels()
    monkeypatch.setattr(llm_service, "_get_client", lambda: SimpleNamespace(models=models))
    monkeypatch.setattr(llm_service.settings, "llm_model", "gemma-test")

    answer = llm_service.generate("system", "user", temperature=0.3)

    assert answer == "Tra loi co citation [C1]."
    assert models.calls == [{
        "kind": "generate",
        "model": "gemma-test",
        "contents": "user",
        "system_instruction": "system",
        "temperature": 0.3,
    }]


def test_generate_raises_when_model_returns_empty_text(monkeypatch):
    models = FakeModels(text="   ")
    monkeypatch.setattr(llm_service, "_get_client", lambda: SimpleNamespace(models=models))

    with pytest.raises(ValueError, match="LLM returned empty response"):
        llm_service.generate("system", "user")


def test_generate_stream_uses_native_streaming_when_available(monkeypatch):
    models = FakeModels(stream_chunks=["Xin ", "", "chao"])
    monkeypatch.setattr(llm_service, "_get_client", lambda: SimpleNamespace(models=models))
    monkeypatch.setattr(llm_service.settings, "llm_model", "gemma-stream")

    chunks = list(llm_service.generate_stream("system", "user", temperature=0.1))

    assert chunks == ["Xin ", "chao"]
    assert models.calls[0]["kind"] == "stream"
    assert models.calls[0]["model"] == "gemma-stream"


def test_generate_stream_falls_back_to_non_streaming_generation(monkeypatch):
    models = FakeModelsWithoutStream(text="abcdef")
    monkeypatch.setattr(llm_service, "_get_client", lambda: SimpleNamespace(models=models))

    chunks = list(llm_service.generate_stream("system", "user"))

    assert chunks == ["abcdef"]
    assert models.calls[0]["kind"] == "generate"


def test_generate_stream_raises_when_stream_has_no_text(monkeypatch):
    models = FakeModels(stream_chunks=["", None])
    monkeypatch.setattr(llm_service, "_get_client", lambda: SimpleNamespace(models=models))

    with pytest.raises(ValueError, match="LLM returned empty stream"):
        list(llm_service.generate_stream("system", "user"))
