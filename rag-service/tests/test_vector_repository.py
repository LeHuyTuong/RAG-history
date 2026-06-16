import uuid
from types import SimpleNamespace

from app.vectorstore import vector_repository


def test_point_id_is_deterministic_uuid():
    first = vector_repository.point_id(42, 7)
    second = vector_repository.point_id(42, 7)

    assert first == second
    assert uuid.UUID(first).version == 5
    assert first != vector_repository.point_id(42, 8)


def test_upsert_sends_points_with_wait(monkeypatch):
    calls = []

    class FakeClient:
        def upsert(self, **kwargs):
            calls.append(kwargs)

    monkeypatch.setattr(vector_repository, "get_client", lambda: FakeClient())

    vector_repository.upsert("history", ["id-1"], [[0.1, 0.2]], [{"sourceId": 1}])

    assert calls[0]["collection_name"] == "history"
    assert calls[0]["wait"] is True
    assert calls[0]["points"][0].id == "id-1"
    assert calls[0]["points"][0].vector == [0.1, 0.2]
    assert calls[0]["points"][0].payload == {"sourceId": 1}


def test_search_builds_filter_for_source_and_tag(monkeypatch):
    calls = []

    class FakeClient:
        def query_points(self, **kwargs):
            calls.append(kwargs)
            return SimpleNamespace(points=["hit"])

    monkeypatch.setattr(vector_repository, "get_client", lambda: FakeClient())

    hits = vector_repository.search(
        collection="history",
        query_vector=[0.1],
        top_k=3,
        score_threshold=0.55,
        source_ids=[1, 2],
        tag_ids=[9],
    )

    assert hits == ["hit"]
    call = calls[0]
    assert call["collection_name"] == "history"
    assert call["query"] == [0.1]
    assert call["limit"] == 3
    assert call["score_threshold"] == 0.55
    assert call["with_payload"] is True
    assert [condition.key for condition in call["query_filter"].must] == ["sourceId", "tagIds"]
    assert call["query_filter"].must[0].match.any == [1, 2]
    assert call["query_filter"].must[1].match.any == [9]


def test_search_omits_filter_when_no_filters(monkeypatch):
    calls = []

    class FakeClient:
        def query_points(self, **kwargs):
            calls.append(kwargs)
            return SimpleNamespace(points=[])

    monkeypatch.setattr(vector_repository, "get_client", lambda: FakeClient())

    vector_repository.search("history", [0.1], 5)

    assert calls[0]["query_filter"] is None


def test_delete_by_source_id_uses_filter_selector(monkeypatch):
    calls = []

    class FakeClient:
        def delete(self, **kwargs):
            calls.append(kwargs)

    monkeypatch.setattr(vector_repository, "get_client", lambda: FakeClient())

    vector_repository.delete_by_source_id("history", 11)

    assert calls[0]["collection_name"] == "history"
    assert calls[0]["wait"] is True
    assert calls[0]["points_selector"].filter.must[0].key == "sourceId"
    assert calls[0]["points_selector"].filter.must[0].match.any == [11]
