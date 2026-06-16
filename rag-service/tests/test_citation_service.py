from types import SimpleNamespace

from app.services.citation_service import to_citations


def test_to_citations_maps_payload_and_deduplicates_chunks():
    payload = {
        "sourceType": "DOCUMENT",
        "sourceId": "12",
        "articleId": None,
        "documentId": "99",
        "title": "Lich su Viet Nam",
        "slug": "lich-su-viet-nam",
        "pageNumber": "21",
        "chunkIndex": "3",
    }
    hits = [
        SimpleNamespace(payload=payload, score=0.91),
        SimpleNamespace(payload=payload, score=0.88),
        SimpleNamespace(payload={**payload, "chunkIndex": "4"}, score=0.77),
    ]

    citations = to_citations(hits)

    assert len(citations) == 2
    assert citations[0].sourceType == "DOCUMENT"
    assert citations[0].sourceId == 12
    assert citations[0].documentId == 99
    assert citations[0].pageNumber == 21
    assert citations[0].chunkIndex == 3
    assert citations[0].score == 0.91
    assert citations[1].chunkIndex == 4


def test_to_citations_uses_unknown_source_type_for_empty_payload():
    citations = to_citations([SimpleNamespace(payload=None, score=None)])

    assert len(citations) == 1
    assert citations[0].sourceType == "UNKNOWN"
    assert citations[0].score is None
