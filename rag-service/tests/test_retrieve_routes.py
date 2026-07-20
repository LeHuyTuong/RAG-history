from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.services import retrieval_service


client = TestClient(app)


def _hit(score=0.81):
    return SimpleNamespace(
        score=score,
        payload={
            "sourceType": "DOCUMENT",
            "sourceId": 2,
            "documentId": 20,
            "title": "Tap 2",
            "slug": "tap-2",
            "pageNumber": 105,
            "chunkIndex": 9,
            "chunkText": "Nha Tran thanh lap nam 1225.",
        },
    )


def test_retrieve_endpoint_returns_hits_without_calling_llm(monkeypatch):
    captured = {}

    def fake_retrieve(question, top_k, source_ids, tag_ids):
        captured.update({
            "question": question,
            "top_k": top_k,
            "source_ids": source_ids,
            "tag_ids": tag_ids,
        })
        return [_hit()]

    monkeypatch.setattr(retrieval_service, "retrieve", fake_retrieve)

    response = client.post(
        "/rag/retrieve",
        json={
            "question": "Nha Tran thanh lap nam nao?",
            "topK": 3,
            "sourceIds": [2],
            "tagIds": [7],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "question": "Nha Tran thanh lap nam nao?",
        "topK": 3,
        "hits": [
            {
                "sourceType": "DOCUMENT",
                "sourceId": 2,
                "articleId": None,
                "documentId": 20,
                "title": "Tap 2",
                "slug": "tap-2",
                "pageNumber": 105,
                "chunkIndex": 9,
                "score": 0.81,
                "chunkText": "Nha Tran thanh lap nam 1225.",
            }
        ],
    }
    assert captured == {
        "question": "Nha Tran thanh lap nam nao?",
        "top_k": 3,
        "source_ids": [2],
        "tag_ids": [7],
    }


def test_retrieve_endpoint_uses_default_top_k(monkeypatch):
    captured = {}

    def fake_retrieve(question, top_k, source_ids, tag_ids):
        captured["top_k"] = top_k
        return []

    monkeypatch.setattr(retrieval_service, "retrieve", fake_retrieve)
    monkeypatch.setattr("app.config.settings.default_top_k", 5)

    response = client.post("/rag/retrieve", json={"question": "Noi dung gi?"})

    assert response.status_code == 200
    assert response.json()["hits"] == []
    assert captured["top_k"] == 5


def test_retrieve_endpoint_maps_errors_to_500(monkeypatch):
    def fake_retrieve(question, top_k, source_ids, tag_ids):
        raise RuntimeError("qdrant down")

    monkeypatch.setattr(retrieval_service, "retrieve", fake_retrieve)

    response = client.post("/rag/retrieve", json={"question": "Noi dung gi?"})

    assert response.status_code == 500
    assert response.json()["detail"] == "Retrieve failed: qdrant down"
