from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.api import chat_routes
from app.services import llm_service, question_router_service, retrieval_service


client = TestClient(app)


def _hit(score=0.9):
    return SimpleNamespace(
        score=score,
        payload={
            "sourceType": "DOCUMENT",
            "sourceId": 2,
            "documentId": 20,
            "title": "Tap 2",
            "pageNumber": 105,
            "chunkIndex": 9,
            "chunkText": "Nha Tran thanh lap nam 1225.",
        },
    )


def test_health_endpoint():
    response = client.get("/rag/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "rag-history"}


def test_chat_success_returns_answer_citations_and_filters(monkeypatch):
    captured = {}
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})

    def fake_retrieve(question, top_k, source_ids, tag_ids):
        captured.update({
            "question": question,
            "top_k": top_k,
            "source_ids": source_ids,
            "tag_ids": tag_ids,
        })
        return [_hit()]

    monkeypatch.setattr(retrieval_service, "retrieve", fake_retrieve)
    monkeypatch.setattr(llm_service, "generate", lambda system, user, temperature: "Nha Tran thanh lap nam 1225 [C1].")

    response = client.post(
        "/rag/chat",
        json={
            "question": "Nha Tran thanh lap nam nao?",
            "topK": 3,
            "sourceIds": [2],
            "tagIds": [7],
            "temperature": 0.1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "Nha Tran thanh lap nam 1225 [C1]."
    assert body["usedVector"] is True
    assert body["usedGraph"] is False
    assert body["citations"][0]["documentId"] == 20
    assert body["citations"][0]["score"] == 0.9
    assert captured == {
        "question": "Nha Tran thanh lap nam nao?",
        "top_k": 3,
        "source_ids": [2],
        "tag_ids": [7],
    }


def test_chat_returns_rephrase_when_retrieval_has_no_hits(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])
    monkeypatch.setattr("app.services.web_fallback_service.search_wikipedia_vi", lambda query, max_chars=2000: None)

    response = client.post("/rag/chat", json={"question": "Cau hoi ngoai du lieu?"})

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == chat_routes._REPHRASE_MSG
    assert body["citations"] == []
    assert body["needsRephrase"] is True
    assert body["usedWeb"] is False


def test_chat_returns_no_data_when_llm_fails(monkeypatch):
    monkeypatch.setattr("app.services.faq_cache_service.lookup", lambda q: None)
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])

    def fail_generate(system, user, temperature):
        raise RuntimeError("provider down")

    monkeypatch.setattr(llm_service, "generate", fail_generate)

    response = client.post("/rag/chat", json={"question": "Nha Tran thanh lap nam nao?"})

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == chat_routes._NO_DATA_MSG
    assert body["citations"] == []
    assert body["usedVector"] is True
    assert body["usedGraph"] is False
    assert body["suggestions"] == []
    assert body["usedWeb"] is False
    assert body["needsRephrase"] is False


def test_chat_stream_success_emits_delta_citations_and_completed(monkeypatch):
    monkeypatch.setattr("app.services.faq_cache_service.lookup", lambda q: None)
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])
    monkeypatch.setattr(llm_service, "generate_stream", lambda system, user, temperature: iter([("answer", "Nha Tran "), ("answer", "1225 [C1].")]))

    with client.stream("POST", "/rag/chat/stream", json={"question": "Nha Tran thanh lap nam nao?"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "event: chat.created" in body
    assert 'event: chat.delta\ndata: {"text": "Nha Tran "}' in body
    assert 'event: chat.delta\ndata: {"text": "1225 [C1]."}' in body
    assert "event: chat.citations" in body
    assert '"pageNumber": 105' in body
    assert '"usedVector": true' in body
    assert '"usedGraph": false' in body
    assert '"usedWeb": false' in body
    assert '"needsRephrase": false' in body


def test_chat_stream_no_hits_emits_rephrase_answer(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])
    monkeypatch.setattr("app.services.web_fallback_service.search_wikipedia_vi", lambda query, max_chars=2000: None)

    with client.stream("POST", "/rag/chat/stream", json={"question": "Ngoai du lieu"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert chat_routes._REPHRASE_MSG[:30] in body
    assert "event: chat.citations" in body
    assert '"needsRephrase": true' in body
    assert '"usedWeb": false' in body


def _web_result():
    from app.services.web_fallback_service import WebResult
    return WebResult(
        title="Nhà Mạc",
        url="https://vi.wikipedia.org/wiki/Nh%C3%A0_M%E1%BA%A1c",
        extract="Nhà Mạc (chữ Nôm: 茹莫, Hán tự: 莫朝, Mạc triều) là triều đại quân chủ trong lịch sử Việt Nam, bắt đầu khi Mạc Đăng Dung phế truất vua Lê Cung Hoàng năm 1527 và kết thúc năm 1677.",
    )


def test_chat_web_fallback_success(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])
    monkeypatch.setattr("app.services.web_fallback_service.search_wikipedia_vi", lambda query, max_chars=2000: _web_result())
    monkeypatch.setattr(llm_service, "generate", lambda system, user, temperature: "Nhà Mạc được thành lập năm 1527 [W1].")

    response = client.post("/rag/chat", json={"question": "Nha Mac thanh lap nam nao?"})

    assert response.status_code == 200
    body = response.json()
    assert body["usedWeb"] is True
    assert body["usedVector"] is False
    assert body["usedGraph"] is False
    assert body["needsRephrase"] is False
    assert len(body["citations"]) == 1
    assert body["citations"][0]["sourceType"] == "URL"
    assert body["citations"][0]["sourceUrl"] == "https://vi.wikipedia.org/wiki/Nh%C3%A0_M%E1%BA%A1c"
    assert body["citations"][0]["title"] == "Nhà Mạc"


def fail_generate(system, user, temperature):
    raise RuntimeError("LLM down")

def test_chat_web_fallback_llm_failure_falls_back_to_raw_extract(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])
    monkeypatch.setattr("app.services.web_fallback_service.search_wikipedia_vi", lambda query, max_chars=2000: _web_result())
    monkeypatch.setattr(llm_service, "generate", fail_generate)

    response = client.post("/rag/chat", json={"question": "Nha Mac thanh lap nam nao?"})

    assert response.status_code == 200
    body = response.json()
    assert body["usedWeb"] is True
    assert "Nhà Mạc" in body["answer"]
    assert len(body["citations"]) == 1
    assert body["citations"][0]["sourceType"] == "URL"


def test_chat_web_fallback_stream_success(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])
    monkeypatch.setattr("app.services.web_fallback_service.search_wikipedia_vi", lambda query, max_chars=2000: _web_result())
    monkeypatch.setattr(
        llm_service, "generate_stream",
        lambda system, user, temperature: iter([("answer", "Nhà Mạc "), ("answer", "năm 1527.")]),
    )

    with client.stream("POST", "/rag/chat/stream", json={"question": "Nha Mac thanh lap nam nao?"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "event: chat.created" in body
    assert 'event: chat.delta\ndata: {"text": "Nhà Mạc "}' in body
    assert 'event: chat.delta\ndata: {"text": "năm 1527."}' in body
    assert '"sourceUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_M%E1%BA%A1c"' in body
    assert '"usedWeb": true' in body
    assert '"usedVector": false' in body
    assert '"needsRephrase": false' in body


def test_sse_preserves_vietnamese_text():
    event = chat_routes._sse("chat.delta", {"text": "Nhà Trần"})

    assert event == 'event: chat.delta\ndata: {"text": "Nhà Trần"}\n\n'
