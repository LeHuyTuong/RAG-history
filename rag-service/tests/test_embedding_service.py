from types import SimpleNamespace

from app.services import embedding_service


class FakeEmbedding:
    def __init__(self, values):
        self.values = values


class FakeModels:
    def __init__(self):
        self.calls = []

    def embed_content(self, model, contents, config):
        self.calls.append({
            "model": model,
            "contents": list(contents),
            "task_type": config.task_type,
            "output_dimensionality": config.output_dimensionality,
        })
        return SimpleNamespace(
            embeddings=[
                FakeEmbedding([float(len(self.calls)), float(index)])
                for index, _ in enumerate(contents)
            ]
        )


def test_embed_documents_batches_requests_and_uses_document_task(monkeypatch):
    models = FakeModels()
    monkeypatch.setattr(embedding_service, "_get_client", lambda: SimpleNamespace(models=models))
    monkeypatch.setattr(embedding_service.settings, "embedding_model", "embed-test")
    monkeypatch.setattr(embedding_service.settings, "embedding_dim", 3)

    vectors = embedding_service.embed_documents([f"text-{index}" for index in range(101)])

    assert len(vectors) == 101
    assert [len(call["contents"]) for call in models.calls] == [100, 1]
    assert {call["task_type"] for call in models.calls} == {"RETRIEVAL_DOCUMENT"}
    assert {call["model"] for call in models.calls} == {"embed-test"}
    assert {call["output_dimensionality"] for call in models.calls} == {3}


def test_embed_query_uses_query_task(monkeypatch):
    models = FakeModels()
    monkeypatch.setattr(embedding_service, "_get_client", lambda: SimpleNamespace(models=models))

    vector = embedding_service.embed_query("Nha Tran thanh lap nam nao?")

    assert vector == [1.0, 0.0]
    assert models.calls[0]["task_type"] == "RETRIEVAL_QUERY"
