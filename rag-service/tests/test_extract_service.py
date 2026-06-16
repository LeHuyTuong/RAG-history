from types import SimpleNamespace

import httpx
import pypdf
import pytest

from app.services.extract_service import extract


def test_extract_prefers_raw_content_over_other_inputs():
    pages = extract(raw_content="  Noi dung thu cong  ", file_path="/missing.pdf", source_url="https://example.test")

    assert len(pages) == 1
    assert pages[0].page_number is None
    assert pages[0].text == "Noi dung thu cong"


def test_extract_requires_at_least_one_input():
    with pytest.raises(ValueError, match="One of raw_content"):
        extract()


def test_extract_reads_text_file(tmp_path):
    path = tmp_path / "history.txt"
    path.write_text("  Trieu Tran thanh lap nam 1225.  ", encoding="utf-8")

    pages = extract(file_path=str(path))

    assert len(pages) == 1
    assert pages[0].text == "Trieu Tran thanh lap nam 1225."


def test_extract_rejects_missing_or_unsupported_files(tmp_path):
    with pytest.raises(ValueError, match="File not found"):
        extract(file_path=str(tmp_path / "missing.pdf"))

    path = tmp_path / "history.bin"
    path.write_bytes(b"nope")
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract(file_path=str(path))


def test_extract_url_strips_boilerplate(monkeypatch):
    html = """
    <html>
      <body>
        <header>Menu</header>
        <main><h1>Hoa Lu</h1><p>Kinh do cua Dai Co Viet.</p></main>
        <script>ignored()</script>
        <footer>Footer</footer>
      </body>
    </html>
    """

    def fake_get(url, follow_redirects, timeout):
        assert url == "https://example.test/hoa-lu"
        assert follow_redirects is True
        assert timeout == 30
        return SimpleNamespace(text=html, raise_for_status=lambda: None)

    monkeypatch.setattr(httpx, "get", fake_get)

    pages = extract(source_url="https://example.test/hoa-lu")

    assert "Hoa Lu" in pages[0].text
    assert "Kinh do cua Dai Co Viet" in pages[0].text
    assert "Menu" not in pages[0].text
    assert "ignored" not in pages[0].text


def test_extract_pdf_returns_one_page_text_per_non_empty_page(monkeypatch, tmp_path):
    class FakePage:
        def __init__(self, text):
            self.text = text

        def extract_text(self):
            return self.text

    class FakeReader:
        def __init__(self, file_path):
            assert file_path.endswith("history.pdf")
            self.pages = [
                FakePage(" Trang 1 co noi dung lich su. "),
                FakePage("   "),
                FakePage("Trang 3 co bang chung khac."),
            ]

    monkeypatch.setattr(pypdf, "PdfReader", FakeReader)
    path = tmp_path / "history.pdf"
    path.write_bytes(b"%PDF-1.4 fake")

    pages = extract(file_path=str(path))

    assert [(page.page_number, page.text) for page in pages] == [
        (1, "Trang 1 co noi dung lich su."),
        (3, "Trang 3 co bang chung khac."),
    ]
