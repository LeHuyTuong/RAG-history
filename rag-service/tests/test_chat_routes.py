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


def test_chat_returns_no_data_when_retrieval_has_no_hits(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])

    response = client.post("/rag/chat", json={"question": "Cau hoi ngoai du lieu?"})

    assert response.status_code == 200
    assert response.json()["answer"] == chat_routes._NO_DATA_MSG
    assert response.json()["citations"] == []


def test_chat_returns_no_data_when_llm_fails(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])

    def fail_generate(system, user, temperature):
        raise RuntimeError("provider down")

    monkeypatch.setattr(llm_service, "generate", fail_generate)

    response = client.post("/rag/chat", json={"question": "Nha Tran thanh lap nam nao?"})

    assert response.status_code == 200
    assert response.json() == {
        "answer": chat_routes._NO_DATA_MSG,
        "citations": [],
        "usedVector": True,
        "usedGraph": False,
    }


def test_chat_stream_success_emits_delta_citations_and_completed(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])
    monkeypatch.setattr(llm_service, "generate_stream", lambda system, user, temperature: iter(["Nha Tran ", "1225 [C1]."]))

    with client.stream("POST", "/rag/chat/stream", json={"question": "Nha Tran thanh lap nam nao?"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "event: chat.created" in body
    assert 'event: chat.delta\ndata: {"text": "Nha Tran "}' in body
    assert 'event: chat.delta\ndata: {"text": "1225 [C1]."}' in body
    assert "event: chat.citations" in body
    assert '"pageNumber": 105' in body
    assert 'event: chat.completed\ndata: {"usedVector": true, "usedGraph": false}' in body


def test_chat_stream_no_hits_emits_no_data_answer(monkeypatch):
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [])

    with client.stream("POST", "/rag/chat/stream", json={"question": "Ngoai du lieu"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert chat_routes._NO_DATA_MSG[:30] in body
    assert "event: chat.citations" in body
    assert 'event: chat.completed\ndata: {"usedVector": true, "usedGraph": false}' in body


def test_sse_preserves_vietnamese_text():
    event = chat_routes._sse("chat.delta", {"text": "Nhà Trần"})

    assert event == 'event: chat.delta\ndata: {"text": "Nhà Trần"}\n\n'
