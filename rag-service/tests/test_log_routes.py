from fastapi.testclient import TestClient

from app.main import app
from app.services import query_log_service


client = TestClient(app)


def test_list_logs_returns_service_result(monkeypatch):
    captured = {}

    def fake_list_logs(**kwargs):
        captured.update(kwargs)
        return [{"id": "1", "question": "Nhà Trần thành lập năm nào?", "answer": "Năm 1225."}]

    monkeypatch.setattr(query_log_service, "list_logs", fake_list_logs)

    response = client.get("/rag/logs", params={"limit": 5, "usedGraph": True})

    assert response.status_code == 200
    assert response.json() == [{"id": "1", "question": "Nhà Trần thành lập năm nào?", "answer": "Năm 1225."}]
    assert captured == {
        "limit": 5,
        "question": None,
        "used_vector": None,
        "used_graph": True,
        "used_web": None,
        "transport": None,
    }


def test_list_logs_default_limit(monkeypatch):
    captured = {}
    monkeypatch.setattr(query_log_service, "list_logs", lambda **kwargs: captured.update(kwargs) or [])

    response = client.get("/rag/logs")

    assert response.status_code == 200
    assert response.json() == []
    assert captured["limit"] == 20


def test_list_logs_rejects_limit_out_of_range():
    response = client.get("/rag/logs", params={"limit": 500})

    assert response.status_code == 422
