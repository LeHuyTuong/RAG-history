from app.schemas.ingest import IngestMetadata, IngestSettings, RagIngestRequest
from app.services import ingest_service
from app.services.chunk_service import ChunkData
from app.services.extract_service import PageText


def _request() -> RagIngestRequest:
    return RagIngestRequest(
        sourceId=12,
        sourceType="DOCUMENT",
        title="Lich su Viet Nam tap 2",
        documentId=99,
        filePath="/tmp/history.pdf",
        metadata=IngestMetadata(
            categoryId=2,
            categoryName="Trieu dai",
            slug="lich-su-viet-nam-tap-2",
            tagIds=[7, 8],
            eventIds=[10],
            periodIds=[3],
        ),
        settings=IngestSettings(chunkSize=50, chunkOverlap=5),
    )


def test_ingest_completed_path_builds_payloads_and_reingests(monkeypatch):
    calls = []
    chunks = [
        ChunkData(chunk_index=0, text="Nha Tran thanh lap nam 1225.", page_number=21, content_hash="hash0"),
        ChunkData(chunk_index=1, text="Tran Canh len ngoi.", page_number=22, content_hash="hash1"),
    ]

    monkeypatch.setattr(ingest_service, "extract", lambda **kwargs: [PageText(21, "raw")])
    monkeypatch.setattr(ingest_service, "chunk", lambda pages, size, overlap: chunks)
    monkeypatch.setattr(ingest_service, "embed_documents", lambda texts: [[1.0], [2.0]])
    monkeypatch.setattr(ingest_service, "point_id", lambda source_id, chunk_index: f"{source_id}-{chunk_index}")
    monkeypatch.setattr(ingest_service, "ensure_collection", lambda collection: calls.append(("ensure", collection)))
    monkeypatch.setattr(ingest_service, "delete_by_source_id", lambda collection, source_id: calls.append(("delete", collection, source_id)))
    monkeypatch.setattr(
        ingest_service,
        "upsert",
        lambda collection, ids, vectors, payloads: calls.append(("upsert", collection, ids, vectors, payloads)),
    )
    monkeypatch.setattr(ingest_service.settings, "qdrant_collection", "history_test")

    response = ingest_service.ingest(_request())

    assert response.status == "COMPLETED"
    assert response.collection == "history_test"
    assert [chunk.qdrantPointId for chunk in response.chunks] == ["12-0", "12-1"]
    assert calls[0] == ("ensure", "history_test")
    assert calls[1] == ("delete", "history_test", 12)
    assert calls[2][0] == "upsert"
    assert calls[2][2] == ["12-0", "12-1"]
    payload = calls[2][4][0]
    assert payload["sourceId"] == 12
    assert payload["sourceType"] == "DOCUMENT"
    assert payload["documentId"] == 99
    assert payload["pageNumber"] == 21
    assert payload["chunkText"] == "Nha Tran thanh lap nam 1225."
    assert payload["tagIds"] == [7, 8]
    assert payload["periodIds"] == [3]


def test_ingest_empty_does_not_call_embedding_or_qdrant(monkeypatch):
    called = []

    monkeypatch.setattr(ingest_service, "extract", lambda **kwargs: [PageText(None, "   ")])
    monkeypatch.setattr(ingest_service, "chunk", lambda pages, size, overlap: [])
    monkeypatch.setattr(ingest_service, "embed_documents", lambda texts: called.append("embed"))
    monkeypatch.setattr(ingest_service, "ensure_collection", lambda collection: called.append("ensure"))
    monkeypatch.setattr(ingest_service, "delete_by_source_id", lambda collection, source_id: called.append("delete"))
    monkeypatch.setattr(ingest_service, "upsert", lambda collection, ids, vectors, payloads: called.append("upsert"))

    response = ingest_service.ingest(_request())

    assert response.status == "EMPTY"
    assert response.chunks == []
    assert called == []


def test_build_payload_flattens_optional_metadata():
    payload = ingest_service._build_payload(
        req=_request(),
        chunk_index=4,
        page_number=8,
        text="Bang chung lich su",
        created_at="2026-01-01T00:00:00+00:00",
    )

    assert payload == {
        "sourceId": 12,
        "sourceType": "DOCUMENT",
        "articleId": None,
        "documentId": 99,
        "sourceUrl": None,
        "filePath": "/tmp/history.pdf",
        "chunkIndex": 4,
        "pageNumber": 8,
        "chunkText": "Bang chung lich su",
        "title": "Lich su Viet Nam tap 2",
        "categoryId": 2,
        "categoryName": "Trieu dai",
        "slug": "lich-su-viet-nam-tap-2",
        "tagIds": [7, 8],
        "eventIds": [10],
        "periodIds": [3],
        "createdAt": "2026-01-01T00:00:00+00:00",
    }
