"""
Tests for query_log_service: no-op khi tắt/chưa cấu hình, insert đúng doc,
nuốt lỗi khi insert thất bại — log KHÔNG BAO GIỜ được làm sập chat.
"""
from __future__ import annotations

import pytest

from app.services import query_log_service


class FakeCollection:
    def __init__(self, raise_on_insert: bool = False):
        self.raise_on_insert = raise_on_insert
        self.inserted: list[dict] = []

    def insert_one(self, doc: dict):
        if self.raise_on_insert:
            raise RuntimeError("mongo down")
        self.inserted.append(doc)


class FakeCursor:
    def __init__(self, docs: list[dict]):
        self._docs = docs

    def sort(self, field, direction):
        return self

    def limit(self, n):
        return self

    def __iter__(self):
        return iter(self._docs)


class FakeFindCollection:
    def __init__(self, docs: list[dict], raise_on_find: bool = False):
        self.docs = docs
        self.raise_on_find = raise_on_find
        self.last_query: dict | None = None

    def find(self, query: dict):
        self.last_query = query
        if self.raise_on_find:
            raise RuntimeError("mongo down")
        return FakeCursor(self.docs)


@pytest.fixture(autouse=True)
def _reset_client(monkeypatch):
    """Đảm bảo mỗi test không dùng chung client module-level đã cache."""
    monkeypatch.setattr(query_log_service, "_client", None)
    yield
    monkeypatch.setattr(query_log_service, "_client", None)


def test_log_query_noop_when_mongo_url_missing(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", None)
    monkeypatch.setattr("app.config.settings.query_log_enabled", True)

    called = []
    monkeypatch.setattr(query_log_service, "_collection", lambda: called.append(True))

    query_log_service.log_query({"question": "abc"})

    assert called == []  # _collection() không hề được gọi


def test_log_query_noop_when_disabled(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", "mongodb://fake")
    monkeypatch.setattr("app.config.settings.query_log_enabled", False)

    called = []
    monkeypatch.setattr(query_log_service, "_collection", lambda: called.append(True))

    query_log_service.log_query({"question": "abc"})

    assert called == []


def test_log_query_inserts_doc_when_enabled(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", "mongodb://fake")
    monkeypatch.setattr("app.config.settings.query_log_enabled", True)

    fake = FakeCollection()
    monkeypatch.setattr(query_log_service, "_collection", lambda: fake)

    doc = {"question": "Nhà Trần thành lập năm nào?", "answer": "Năm 1225."}
    query_log_service.log_query(doc)

    assert fake.inserted == [doc]


def test_log_query_swallows_insert_exception(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", "mongodb://fake")
    monkeypatch.setattr("app.config.settings.query_log_enabled", True)

    fake = FakeCollection(raise_on_insert=True)
    monkeypatch.setattr(query_log_service, "_collection", lambda: fake)

    # Không được raise ra ngoài — nuốt lỗi để chat không bị sập.
    query_log_service.log_query({"question": "abc"})


def test_close_clears_client(monkeypatch):
    fake_client = FakeCollection()  # chỉ cần có .close()
    fake_client.close = lambda: None
    monkeypatch.setattr(query_log_service, "_client", fake_client)

    query_log_service.close()

    assert query_log_service._client is None


def test_close_noop_when_no_client(monkeypatch):
    monkeypatch.setattr(query_log_service, "_client", None)
    query_log_service.close()  # không raise
    assert query_log_service._client is None


def test_list_logs_noop_when_mongo_url_missing(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", None)

    called = []
    monkeypatch.setattr(query_log_service, "_collection", lambda: called.append(True))

    assert query_log_service.list_logs() == []
    assert called == []


def test_list_logs_builds_filter_query_and_serializes_id(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", "mongodb://fake")

    fake = FakeFindCollection(docs=[{"_id": "abc123", "question": "Nhà Trần?"}])
    monkeypatch.setattr(query_log_service, "_collection", lambda: fake)

    result = query_log_service.list_logs(
        limit=10, question="Trần", used_vector=True, used_graph=False,
        used_web=None, transport="sse",
    )

    assert fake.last_query == {
        "question": {"$regex": "Trần", "$options": "i"},
        "usedVector": True,
        "usedGraph": False,
        "transport": "sse",
    }
    assert result == [{"id": "abc123", "question": "Nhà Trần?"}]


def test_list_logs_swallows_find_exception(monkeypatch):
    monkeypatch.setattr("app.config.settings.mongo_url", "mongodb://fake")

    fake = FakeFindCollection(docs=[], raise_on_find=True)
    monkeypatch.setattr(query_log_service, "_collection", lambda: fake)

    assert query_log_service.list_logs() == []
