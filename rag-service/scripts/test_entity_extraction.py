#!/usr/bin/env python3
"""
PROTOTYPE: test chất lượng trích entity + relationship của Gemma trên chunk thật.
Chưa ghi Neo4j — chỉ in JSON ra để kiểm tra trước khi build pipeline.

Usage (từ rag-service/):
    .venv/bin/python scripts/test_entity_extraction.py --doc-id 1 --limit 5
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

RAG_SERVICE_DIR = Path(__file__).resolve().parent.parent


def load_env():
    for cand in [RAG_SERVICE_DIR.parent / ".env", RAG_SERVICE_DIR / ".env"]:
        if cand.is_file():
            for line in cand.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


EXTRACT_PROMPT = """Bạn là chuyên gia trích xuất tri thức lịch sử Việt Nam.
Từ đoạn văn dưới đây, hãy trích các THỰC THỂ và QUAN HỆ giữa chúng.

Loại thực thể (entity type): Người, Triều_đại, Địa_điểm, Sự_kiện, Chức_vụ, Tổ_chức.
Loại quan hệ (relation): dùng động từ ngắn gọn tiếng Việt IN_HOA_CÓ_GẠCH_DƯỚI, ví dụ:
  LẬP, PHONG_CHỨC, ĐÁNH_BẠI, KẾ_VỊ, CON_CỦA, THUỘC_TRIỀU, DIỄN_RA_TẠI, XẢY_RA_NĂM.

Chỉ trích thông tin CÓ THẬT trong đoạn văn, KHÔNG suy diễn thêm.
Trả về JSON thuần (không markdown, không giải thích) theo đúng cấu trúc:
{
  "entities": [{"name": "...", "type": "..."}],
  "relations": [{"source": "...", "relation": "...", "target": "...", "context": "trích dẫn ngắn"}]
}

Đoạn văn:
\"\"\"
{chunk}
\"\"\"
"""


def extract_entities(client, model, chunk_text: str) -> dict:
    from google.genai import types
    prompt = EXTRACT_PROMPT.replace("{chunk}", chunk_text[:2000])
    resp = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=16384),
    )
    text = (resp.text or "").strip()
    # Gemma đôi khi bọc trong ```json ... ```
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text.strip())
    except Exception as exc:
        return {"_parse_error": str(exc), "_raw": text[:500]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--doc-id", type=int, default=1)
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    load_env()
    sys.path.insert(0, str(RAG_SERVICE_DIR))
    from app.config import settings
    from qdrant_client import QdrantClient
    from google import genai

    qc = QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])
    # documentId chưa có index → scroll rồi lọc trong Python
    points = []
    offset = None
    while len(points) < args.limit:
        batch, offset = qc.scroll(
            settings.qdrant_collection, offset=offset, limit=200,
            with_payload=True, with_vectors=False,
        )
        for p in batch:
            if p.payload.get("documentId") == args.doc_id and len(p.payload.get("chunkText", "")) > 300:
                points.append(p)
                if len(points) >= args.limit:
                    break
        if offset is None:
            break
    print(f"Lấy {len(points)} chunk từ documentId={args.doc_id}\n")

    client = genai.Client(api_key=settings.google_api_key)
    model = settings.llm_model
    print(f"Model trích: {model}\n" + "=" * 70)

    for i, p in enumerate(points, 1):
        chunk = p.payload.get("chunkText", "")
        page = p.payload.get("pageNumber")
        print(f"\n[CHUNK {i}] trang {page} | {len(chunk)} ký tự")
        print(f"  Text: {chunk[:200].strip()}...")
        result = extract_entities(client, model, chunk)
        print(f"  → Trích được:")
        print("   ", json.dumps(result, ensure_ascii=False, indent=2).replace("\n", "\n    "))
        print("-" * 70)


if __name__ == "__main__":
    main()
