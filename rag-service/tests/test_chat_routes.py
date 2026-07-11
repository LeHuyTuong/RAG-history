from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.api import chat_routes
from app.services import llm_service, question_router_service, query_log_service, retrieval_service


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
    monkeypatch.setattr(llm_service, "generate", lambda system, user, temperature, model=None: "Nha Tran thanh lap nam 1225 [C1].")

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

    def fail_generate(system, user, temperature, model=None):
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
    monkeypatch.setattr(llm_service, "generate_stream", lambda system, user, temperature, model=None: iter([("answer", "Nha Tran "), ("answer", "1225 [C1].")]))

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


def test_chat_stream_logs_graph_facts_without_leaking_internal_event(monkeypatch):
    """graph_facts phải vào doc log (_stream_with_log) nhưng KHÔNG được xuất
    hiện trên wire SSE — event `_internal.graph_facts` chỉ là kênh nội bộ."""
    monkeypatch.setattr("app.services.faq_cache_service.lookup", lambda q: None)
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": True})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])
    monkeypatch.setattr(
        "app.services.graph_service.retrieve_graph_context",
        lambda question: ["Đinh Bộ Lĩnh là con của Đinh Công Trứ"],
    )
    monkeypatch.setattr(llm_service, "generate_stream", lambda system, user, temperature, model=None: iter([("answer", "Nha Tran 1225 [C1].")]))

    logged = {}
    monkeypatch.setattr(query_log_service, "log_query", lambda doc: logged.update(doc))

    with client.stream("POST", "/rag/chat/stream", json={"question": "Con cua Dinh Bo Linh la ai?", "useGraph": True}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "_internal.graph_facts" not in body  # không leak ra transport
    assert '"usedGraph": true' in body
    assert logged["graphFacts"] == ["Đinh Bộ Lĩnh là con của Đinh Công Trứ"]
    assert logged["usedGraph"] is True


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


def test_chat_ws_success_emits_same_events_as_sse(monkeypatch):
    monkeypatch.setattr("app.services.faq_cache_service.lookup", lambda q: None)
    monkeypatch.setattr(question_router_service, "route", lambda question, use_graph: {"use_vector": True, "use_graph": False})
    monkeypatch.setattr(retrieval_service, "retrieve", lambda **kwargs: [_hit()])
    monkeypatch.setattr(llm_service, "generate_stream", lambda system, user, temperature, model=None: iter([("answer", "Nha Tran "), ("answer", "1225 [C1].")]))

    events = []
    with client.websocket_connect("/rag/chat/ws") as ws:
        ws.send_json({"question": "Nha Tran thanh lap nam nao?"})
        while True:
            msg = ws.receive_json()
            events.append(msg)
            if msg["event"] in ("chat.completed", "chat.error"):
                break

    names = [e["event"] for e in events]
    assert names[0] == "chat.created"
    deltas = [e["data"]["text"] for e in events if e["event"] == "chat.delta"]
    assert deltas == ["Nha Tran ", "1225 [C1]."]
    assert "chat.citations" in names
    completed = next(e for e in events if e["event"] == "chat.completed")
    assert completed["data"]["usedVector"] is True
    assert completed["data"]["usedGraph"] is False
    assert completed["data"]["usedWeb"] is False


def test_chat_ws_invalid_request_closes_gracefully():
    with client.websocket_connect("/rag/chat/ws") as ws:
        ws.send_json({"not_a_question": 123})
        msg = ws.receive_json()
        assert msg["event"] == "chat.error"


def test_mock_stream_source_bypasses_llm_for_both_transports(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "stream_source", "mock")
    monkeypatch.setattr(settings, "stream_mock_tokens", 5)
    monkeypatch.setattr(settings, "stream_mock_delay_ms", 0)

    # Nếu mock hoạt động đúng, retrieval/LLM KHÔNG được gọi → gán để nổ nếu bị gọi.
    def _boom(*a, **k):
        raise AssertionError("mock source không được gọi retrieval/LLM")

    monkeypatch.setattr(retrieval_service, "retrieve", _boom)
    monkeypatch.setattr(llm_service, "generate_stream", _boom)

    # SSE
    with client.stream("POST", "/rag/chat/stream", json={"question": "bất kỳ"}) as response:
        sse_body = "".join(response.iter_text())
    assert response.status_code == 200
    assert sse_body.count("event: chat.delta") == 5
    assert "event: chat.completed" in sse_body

    # WS
    events = []
    with client.websocket_connect("/rag/chat/ws") as ws:
        ws.send_json({"question": "bất kỳ"})
        while True:
            msg = ws.receive_json()
            events.append(msg)
            if msg["event"] in ("chat.completed", "chat.error"):
                break
    deltas = [e for e in events if e["event"] == "chat.delta"]
    assert len(deltas) == 5


def test_ollama_stream_source_bypasses_retrieval_and_gemma(monkeypatch):
    from app.config import settings
    from app.api import chat_routes as cr

    monkeypatch.setattr(settings, "stream_source", "ollama")

    # Không gọi Ollama thật: giả nguồn token local. Đồng thời chặn retrieval/LLM.
    def fake_ollama(question):
        yield ("chat.delta", {"text": "Nha Tran "})
        yield ("chat.delta", {"text": "1225."})
        yield ("chat.citations", {"citations": []})
        yield ("chat.completed", {"usedVector": False, "usedGraph": False, "usedWeb": False, "needsRephrase": False})

    monkeypatch.setattr(cr, "_ollama_stream_event_tuples", fake_ollama)

    def _boom(*a, **k):
        raise AssertionError("ollama source không được gọi retrieval/Gemma")

    monkeypatch.setattr(retrieval_service, "retrieve", _boom)
    monkeypatch.setattr(llm_service, "generate_stream", _boom)

    with client.stream("POST", "/rag/chat/stream", json={"question": "bất kỳ"}) as response:
        sse_body = "".join(response.iter_text())
    assert response.status_code == 200
    assert sse_body.count("event: chat.delta") == 2
    assert "event: chat.completed" in sse_body


def test_groq_stream_source_bypasses_retrieval_and_gemma(monkeypatch):
    from app.config import settings
    from app.api import chat_routes as cr

    monkeypatch.setattr(settings, "stream_source", "groq")

    # Không gọi Groq thật: giả nguồn token. Đồng thời chặn retrieval/LLM để
    # đảm bảo nhánh groq không lẫn qua pipeline RAG/Gemma.
    def fake_groq(question):
        yield ("chat.delta", {"text": "Nha Tran "})
        yield ("chat.delta", {"text": "1225."})
        yield ("chat.citations", {"citations": []})
        yield ("chat.completed", {"usedVector": False, "usedGraph": False, "usedWeb": False, "needsRephrase": False})

    monkeypatch.setattr(cr, "_groq_stream_event_tuples", fake_groq)

    def _boom(*a, **k):
        raise AssertionError("groq source không được gọi retrieval/Gemma")

    monkeypatch.setattr(retrieval_service, "retrieve", _boom)
    monkeypatch.setattr(llm_service, "generate_stream", _boom)

    with client.stream("POST", "/rag/chat/stream", json={"question": "bất kỳ"}) as response:
        sse_body = "".join(response.iter_text())
    assert response.status_code == 200
    assert sse_body.count("event: chat.delta") == 2
    assert "event: chat.completed" in sse_body


def test_groq_stream_source_reports_missing_key_gracefully(monkeypatch):
    from app.config import settings
    from app.api import chat_routes as cr

    monkeypatch.setattr(settings, "stream_source", "groq")
    monkeypatch.setattr(cr, "_load_groq_env", lambda: (None, "llama-3.1-8b-instant"))

    with client.stream("POST", "/rag/chat/stream", json={"question": "bất kỳ"}) as response:
        sse_body = "".join(response.iter_text())
    assert response.status_code == 200
    assert "GROQ_API_KEY" in sse_body
    assert "event: chat.completed" in sse_body
