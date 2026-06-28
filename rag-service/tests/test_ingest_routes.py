from fastapi.testclient import TestClient

from app.main import app
from app.schemas.ingest import IngestedChunk, RagIngestResponse
from app.services import ingest_service
from app.vectorstore import vector_repository


client = TestClient(app)


def test_ingest_endpoint_returns_service_response(monkeypatch):
    def fake_ingest(req):
        assert req.sourceId == 7
        assert req.rawContent == "Noi dung"
        return RagIngestResponse(
            sourceId=req.sourceId,
            status="COMPLETED",
            collection="history",
            embeddingModel="gemini-embedding-001",
            chunks=[IngestedChunk(chunkIndex=0, qdrantPointId="point-1", contentHash="hash")],
        )

    monkeypatch.setattr(ingest_service, "ingest", fake_ingest)

    response = client.post(
        "/rag/ingest",
        json={"sourceId": 7, "sourceType": "MANUAL_INPUT", "title": "Manual", "rawContent": "Noi dung"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"
    assert response.json()["chunks"][0]["qdrantPointId"] == "point-1"


def test_ingest_endpoint_maps_value_error_to_400(monkeypatch):
    def fake_ingest(req):
        raise ValueError("bad input")

    monkeypatch.setattr(ingest_service, "ingest", fake_ingest)

    response = client.post(
        "/rag/ingest",
        json={"sourceId": 7, "sourceType": "DOCUMENT", "title": "Doc", "filePath": "/missing.pdf"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "bad input"


def test_ingest_endpoint_maps_unexpected_error_to_500(monkeypatch):
    def fake_ingest(req):
        raise RuntimeError("qdrant down")

    monkeypatch.setattr(ingest_service, "ingest", fake_ingest)

    response = client.post(
        "/rag/ingest",
        json={"sourceId": 7, "sourceType": "DOCUMENT", "title": "Doc", "filePath": "/tmp/a.pdf"},
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "Ingest failed: qdrant down"


def test_delete_endpoint_deletes_vectors_by_source_id(monkeypatch):
    calls = []
    monkeypatch.setattr(vector_repository, "delete_by_source_id", lambda collection, source_id: calls.append((collection, source_id)))

    response = client.delete("/rag/delete", params={"sourceId": 15})

    assert response.status_code == 200
    assert response.json() == {"status": "deleted", "sourceId": 15}
    assert calls == [("test_history_chunks", 15)]
