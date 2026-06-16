from app.services.chunk_service import chunk
from app.services.extract_service import PageText


def test_chunk_splits_text_with_overlap_and_hashes_are_stable():
    pages = [PageText(page_number=3, text="abcdefghij12345")]

    chunks = chunk(pages, chunk_size=10, chunk_overlap=2)

    assert [c.text for c in chunks] == ["abcdefghij", "ij12345"]
    assert [c.chunk_index for c in chunks] == [0, 1]
    assert [c.page_number for c in chunks] == [3, 3]
    assert chunks[0].content_hash == chunk(pages, 10, 2)[0].content_hash


def test_chunk_uses_global_indices_across_pages():
    pages = [
        PageText(page_number=1, text="alpha beta gamma"),
        PageText(page_number=2, text="delta epsilon"),
    ]

    chunks = chunk(pages, chunk_size=50, chunk_overlap=10)

    assert [c.chunk_index for c in chunks] == [0, 1]
    assert [c.page_number for c in chunks] == [1, 2]


def test_chunk_skips_empty_pages():
    pages = [
        PageText(page_number=1, text="   "),
        PageText(page_number=2, text="noi dung"),
    ]

    chunks = chunk(pages, chunk_size=20, chunk_overlap=5)

    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].page_number == 2
