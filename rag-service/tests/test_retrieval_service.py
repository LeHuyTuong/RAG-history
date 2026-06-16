from app.services import retrieval_service


def test_retrieve_embeds_query_and_searches_configured_collection(monkeypatch):
    calls = {}

    def fake_embed_query(question):
        calls["question"] = question
        return [0.1, 0.2]

    monkeypatch.setattr(retrieval_service, "embed_query", fake_embed_query)

    def fake_search(collection, query_vector, top_k, score_threshold, source_ids, tag_ids):
        calls.update({
            "collection": collection,
            "query_vector": query_vector,
            "top_k": top_k,
            "score_threshold": score_threshold,
            "source_ids": source_ids,
            "tag_ids": tag_ids,
        })
        return ["hit-1"]

    monkeypatch.setattr(retrieval_service, "search", fake_search)
    monkeypatch.setattr(retrieval_service.settings, "qdrant_collection", "history_test")
    monkeypatch.setattr(retrieval_service.settings, "score_threshold", 0.42)

    hits = retrieval_service.retrieve("Nha Tran thanh lap nam nao?", top_k=4, source_ids=[2], tag_ids=[7])

    assert hits == ["hit-1"]
    assert calls == {
        "question": "Nha Tran thanh lap nam nao?",
        "collection": "history_test",
        "query_vector": [0.1, 0.2],
        "top_k": 4,
        "score_threshold": 0.42,
        "source_ids": [2],
        "tag_ids": [7],
    }
