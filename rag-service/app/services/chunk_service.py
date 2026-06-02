import hashlib
from dataclasses import dataclass

from app.services.extract_service import PageText


@dataclass
class ChunkData:
    chunk_index: int
    text: str
    page_number: int | None
    content_hash: str


def chunk(pages: list[PageText], chunk_size: int, chunk_overlap: int) -> list[ChunkData]:
    chunks: list[ChunkData] = []
    global_index = 0
    for page in pages:
        page_chunks = _chunk_text(
            text=page.text,
            page_number=page.page_number,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            start_index=global_index,
        )
        global_index += len(page_chunks)
        chunks.extend(page_chunks)
    return chunks


def _chunk_text(
    text: str,
    page_number: int | None,
    chunk_size: int,
    chunk_overlap: int,
    start_index: int,
) -> list[ChunkData]:
    chunks: list[ChunkData] = []
    text = text.strip()
    if not text:
        return chunks

    step = max(1, chunk_size - chunk_overlap)
    pos = 0
    idx = start_index
    while pos < len(text):
        end = min(pos + chunk_size, len(text))
        chunk_text = text[pos:end].strip()
        if chunk_text:
            content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()[:16]
            chunks.append(ChunkData(
                chunk_index=idx,
                text=chunk_text,
                page_number=page_number,
                content_hash=content_hash,
            ))
            idx += 1
        pos += step
    return chunks
