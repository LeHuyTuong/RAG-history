"""
Trích entity + relationship từ text bằng Gemma — dùng cho ingest GraphRAG.

Vai trò: nhận 1 đoạn text, gọi Gemma sinh JSON {entities, relations}, parse an toàn.
Không biết gì về Neo4j hay Qdrant — chỉ text vào, dict ra. graph_client lo việc ghi.

Lưu ý kỹ thuật:
  - Model gemma-4-26b-a4b-it là reasoning model: sinh "thinking" trước (~4000 token),
    nên max_output_tokens phải đủ lớn (16384) nếu không text trả về sẽ RỖNG.
  - Gemma hay bọc JSON trong ```json ... ``` → phải strip trước khi json.loads.
"""
from __future__ import annotations

import json

from google import genai
from google.genai import types

from app.config import settings

# LƯU Ý QUAN TRỌNG: prompt phải NGẮN GỌN. Prompt dài + nhiều ví dụ khiến reasoning
# model (gemma-4-26b-a4b-it) "thinking" lan man tới hết token budget rồi trả RỖNG.
# Prompt terse giữ thinking ~1800-2400 token → nhanh (~60s) + ổn định.
_EXTRACT_PROMPT = """Trích thực thể + quan hệ lịch sử từ đoạn văn. Trả JSON thuần, không giải thích:
{"entities":[{"name":"...","type":"Người|Triều_đại|Địa_điểm|Sự_kiện|Chức_vụ|Tổ_chức"}],"relations":[{"source":"...","relation":"ĐỘNG_TỪ_IN_HOA","target":"...","context":"trích ngắn"}]}

Đoạn văn:
{chunk}
"""


def build_extract_fn(api_key: str):
    """Tạo hàm extract dùng 1 API key cụ thể (cho key rotation khi hết quota)."""
    client = genai.Client(api_key=api_key)

    def extract(chunk_text: str) -> dict:
        prompt = _EXTRACT_PROMPT.replace("{chunk}", chunk_text[:2000])
        resp = client.models.generate_content(
            model=settings.llm_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=10000,  # thinking (~2000) + JSON; prompt terse nên không runaway
            ),
        )
        return _parse(resp.text or "")

    return extract


def _parse(text: str) -> dict:
    """Parse JSON từ output của Gemma, strip markdown fence nếu có."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:]
    text = text.strip()
    if not text:
        return {"entities": [], "relations": [], "_empty": True}
    try:
        data = json.loads(text)
        return {
            "entities": data.get("entities", []) or [],
            "relations": data.get("relations", []) or [],
        }
    except json.JSONDecodeError as exc:
        return {"entities": [], "relations": [], "_parse_error": str(exc)}
