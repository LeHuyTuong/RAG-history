from app.services.question_router_service import route


def test_route_uses_vector_and_graph_when_requested_or_relationship_keyword():
    # "cha" (father) matches _GRAPH_HINT_RE → use_graph=True even without explicit request
    assert route("Ai la cha cua Tran Canh?") == {
        "use_vector": True,
        "use_graph": True,
    }


def test_route_ignores_graph_when_no_relationship_keyword():
    assert route("Nha Tran thanh lap nam nao?") == {
        "use_vector": True,
        "use_graph": False,
    }
