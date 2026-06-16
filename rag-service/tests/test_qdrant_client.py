from app.vectorstore import qdrant_client


def test_ensure_collection_returns_when_collection_exists(monkeypatch):
    calls = []

    class FakeClient:
        def collection_exists(self, collection):
            calls.append(("exists", collection))
            return True

        def create_collection(self, **kwargs):
            calls.append(("create", kwargs))

    monkeypatch.setattr(qdrant_client, "get_client", lambda: FakeClient())

    qdrant_client.ensure_collection("history")

    assert calls == [("exists", "history")]


def test_ensure_collection_creates_collection_and_payload_indexes(monkeypatch):
    calls = []

    class FakeClient:
        def collection_exists(self, collection):
            calls.append(("exists", collection))
            return False

        def create_collection(self, **kwargs):
            calls.append(("create", kwargs))

        def create_payload_index(self, **kwargs):
            calls.append(("index", kwargs))

    monkeypatch.setattr(qdrant_client, "get_client", lambda: FakeClient())
    monkeypatch.setattr(qdrant_client.settings, "embedding_dim", 768)

    qdrant_client.ensure_collection("history")

    assert calls[0] == ("exists", "history")
    assert calls[1][0] == "create"
    assert calls[1][1]["collection_name"] == "history"
    assert calls[1][1]["vectors_config"].size == 768
    assert [call[1]["field_name"] for call in calls[2:]] == ["sourceId", "tagIds"]
