from types import SimpleNamespace

from app.services.prompt_service import build_user_message


def test_build_user_message_formats_context_blocks_with_citation_ids():
    hits = [
        SimpleNamespace(
            score=0.87654,
            payload={
                "title": "Tap 2",
                "sourceType": "DOCUMENT",
                "sourceId": 2,
                "pageNumber": 105,
                "chunkIndex": 9,
                "chunkText": "Nha Tran thanh lap nam 1225.",
            },
        ),
        SimpleNamespace(score=None, payload={"chunkText": "Bang chung khac."}),
    ]

    prompt = build_user_message("Nha Tran thanh lap nam nao?", hits)

    assert "[C1]" in prompt
    assert "sourceType=DOCUMENT; sourceId=2; title=Tap 2; chunkIndex=9, pageNumber=105; score=0.8765" in prompt
    assert "Nha Tran thanh lap nam 1225." in prompt
    assert "[C2]" in prompt
    assert "Không rõ tiêu đề" in prompt
    assert "QUESTION:\nNha Tran thanh lap nam nao?" in prompt
