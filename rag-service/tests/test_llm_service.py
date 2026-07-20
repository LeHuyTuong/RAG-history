from types import SimpleNamespace

import pytest

from app.services import llm_service


@pytest.fixture(autouse=True)
def _reset_key_rotation_state():
    """_key_index/_clients là global dùng chung — reset trước/sau mỗi test để
    test key-rotation (đẩy _key_index tới) không rò rỉ sang test khác."""
    llm_service._key_index = 0
    llm_service._clients = None
    yield
    llm_service._key_index = 0
    llm_service._clients = None


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
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [SimpleNamespace(models=models)])
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
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [SimpleNamespace(models=models)])

    with pytest.raises(ValueError, match="LLM returned empty response"):
        llm_service.generate("system", "user")


def test_generate_stream_uses_native_streaming_when_available(monkeypatch):
    models = FakeModels(stream_chunks=["Xin ", "", "chao"])
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [SimpleNamespace(models=models)])
    monkeypatch.setattr(llm_service.settings, "llm_model", "gemma-stream")

    chunks = list(llm_service.generate_stream("system", "user", temperature=0.1))

    assert chunks == [("answer", "Xin "), ("answer", "chao")]
    assert models.calls[0]["kind"] == "stream"
    assert models.calls[0]["model"] == "gemma-stream"


def test_generate_stream_falls_back_to_non_streaming_generation(monkeypatch):
    models = FakeModelsWithoutStream(text="abcdef")
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [SimpleNamespace(models=models)])

    chunks = list(llm_service.generate_stream("system", "user"))

    assert chunks == [("answer", "abcdef")]
    assert models.calls[0]["kind"] == "generate"


def test_generate_stream_raises_when_stream_has_no_text(monkeypatch):
    models = FakeModels(stream_chunks=["", None])
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [SimpleNamespace(models=models)])

    with pytest.raises(ValueError, match="LLM returned empty stream"):
        list(llm_service.generate_stream("system", "user"))


def test_invoke_round_robins_to_next_key_on_rate_limit_instead_of_sleeping(monkeypatch):
    """Bug đã sửa: dính RPM ở key 0 phải thử NGAY key 1 (còn sống), không sleep
    rồi lặp lại trên chính key 0 — vì 2 key là 2 tài khoản riêng, RPM của key
    này không liên quan quota của key kia."""
    rate_limit_exc = Exception("429 RESOURCE_EXHAUSTED ... retry in 5s")
    key0 = SimpleNamespace(models=SimpleNamespace(
        generate_content=lambda model, contents, config: (_ for _ in ()).throw(rate_limit_exc)
    ))
    key1_models = FakeModels(text="tu key thu hai")
    key1 = SimpleNamespace(models=key1_models)
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [key0, key1])
    sleep_calls = []
    monkeypatch.setattr(llm_service.time, "sleep", lambda s: sleep_calls.append(s))

    answer = llm_service.generate("system", "user")

    assert answer == "tu key thu hai"
    assert key1_models.calls, "key 1 phải được gọi (round-robin sang ngay)"
    assert sleep_calls == [], "không được sleep khi vẫn còn key khác sống"


def test_invoke_sleeps_only_when_every_live_key_is_rate_limited(monkeypatch):
    """Chỉ sleep khi đã thử hết mọi key trong 1 vòng mà vẫn dính RPM."""
    rate_limit_exc = Exception("429 RESOURCE_EXHAUSTED ... retry in 3s")
    calls = {"key0": 0, "key1": 0}

    def key0_call(model, contents, config):
        calls["key0"] += 1
        if calls["key0"] == 1:
            raise rate_limit_exc
        return SimpleNamespace(text="key0 vong 2")

    def key1_call(model, contents, config):
        calls["key1"] += 1
        raise rate_limit_exc

    key0 = SimpleNamespace(models=SimpleNamespace(generate_content=key0_call))
    key1 = SimpleNamespace(models=SimpleNamespace(generate_content=key1_call))
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [key0, key1])
    sleep_calls = []
    monkeypatch.setattr(llm_service.time, "sleep", lambda s: sleep_calls.append(s))

    answer = llm_service.generate("system", "user")

    assert answer == "key0 vong 2"
    assert sleep_calls == [5.0]  # 3s parse + 2s buffer, chỉ 1 lần sleep cho cả vòng
    assert calls == {"key0": 2, "key1": 1}


def test_invoke_advances_past_daily_exhausted_key_permanently(monkeypatch):
    daily_exc = Exception("429 RESOURCE_EXHAUSTED ... PerDay ...")
    key0 = SimpleNamespace(models=SimpleNamespace(
        generate_content=lambda model, contents, config: (_ for _ in ()).throw(daily_exc)
    ))
    key1_models = FakeModels(text="key thu hai tra loi")
    key1 = SimpleNamespace(models=key1_models)
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [key0, key1])

    answer = llm_service.generate("system", "user")

    assert answer == "key thu hai tra loi"
    assert llm_service._key_index == 1, "key hết quota ngày phải bị loại vĩnh viễn khỏi pool"


def test_generate_stream_round_robins_on_rate_limit_before_first_token(monkeypatch):
    rate_limit_exc = Exception("429 RESOURCE_EXHAUSTED ... retry in 1s")

    class FailingStreamModels:
        def generate_content_stream(self, model, contents, config):
            raise rate_limit_exc

    key0 = SimpleNamespace(models=FailingStreamModels())
    key1_models = FakeModels(stream_chunks=["Xin", "chao"])
    key1 = SimpleNamespace(models=key1_models)
    monkeypatch.setattr(llm_service, "_get_clients", lambda: [key0, key1])
    sleep_calls = []
    monkeypatch.setattr(llm_service.time, "sleep", lambda s: sleep_calls.append(s))

    chunks = list(llm_service.generate_stream("system", "user"))

    assert chunks == [("answer", "Xin"), ("answer", "chao")]
    assert sleep_calls == [], "không được sleep khi vẫn còn key khác sống"
