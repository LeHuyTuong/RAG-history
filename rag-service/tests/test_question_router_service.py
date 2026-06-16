from app.services.question_router_service import route


def test_route_always_uses_vector_and_ignores_graph_until_neo4j_is_implemented():
    assert route("Ai la cha cua Tran Canh?", requested_use_graph=True) == {
        "use_vector": True,
        "use_graph": False,
    }
