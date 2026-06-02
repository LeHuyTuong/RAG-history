"""
Extract text từ nhiều nguồn (PDF, DOCX, TXT, URL, rawContent).
Trả về list[PageText] để chunk_service xử lý tiếp.
Giữ page_number riêng cho từng trang PDF vì citation cần số trang (docs/14).
"""
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PageText:
    """Đơn vị text sau extract. page_number=None với nguồn không có khái niệm trang."""
    page_number: int | None
    text: str


def extract(
    raw_content: str | None = None,
    file_path: str | None = None,
    source_url: str | None = None,
) -> list[PageText]:
    """
    Ưu tiên: rawContent > filePath > sourceUrl.
    rawContent dùng cho article/manual input — Spring Boot gửi thẳng text, không cần đọc file.
    """
    if raw_content:
        return [PageText(page_number=None, text=raw_content.strip())]
    if file_path:
        return _extract_file(file_path)
    if source_url:
        return _extract_url(source_url)
    raise ValueError("One of raw_content, file_path, or source_url must be provided")


def _extract_file(file_path: str) -> list[PageText]:
    path = Path(file_path)
    if not path.exists():
        raise ValueError(f"File not found: {file_path}")
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(str(path))
    if suffix == ".docx":
        return _extract_docx(str(path))
    if suffix in (".txt", ".md"):
        text = path.read_text(encoding="utf-8")
        return [PageText(page_number=None, text=text.strip())]
    raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(file_path: str) -> list[PageText]:
    """Mỗi trang PDF → 1 PageText riêng để chunk_service giữ đúng số trang cho citation."""
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(PageText(page_number=i, text=text))
    return pages


def _extract_docx(file_path: str) -> list[PageText]:
    from docx import Document
    doc = Document(file_path)
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [PageText(page_number=None, text=text.strip())]


def _extract_url(url: str) -> list[PageText]:
    """Bỏ script/nav/footer trước khi lấy text để giảm noise cho embedding."""
    import httpx
    from bs4 import BeautifulSoup
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return [PageText(page_number=None, text=text)]
