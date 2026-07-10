"""
Wikipedia tiếng Việt fallback — tìm kiếm khi RAG không có đủ dữ liệu nội bộ.

Vai trò: gọi MediaWiki API của vi.wikipedia.org, lấy extract intro trang top,
trả về WebResult để chat_routes tổng hợp câu trả lời bằng LLM.

Luồng:
  search_wikipedia_vi(question)
    → search API → lấy title top hit
    → extract API → lấy plain text intro
    → WebResult(title, url, extract)
"""
import httpx
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)
_API = "https://vi.wikipedia.org/w/api.php"
_HEADERS = {"User-Agent": "RAG-History/1.0 (contact: <email>)"}


@dataclass
class WebResult:
    title: str
    url: str
    extract: str


def search_wikipedia_vi(query: str, max_chars: int = 2000) -> WebResult | None:
    """Tra Wikipedia VI: search → lấy extract intro của trang top. None nếu không có/lỗi."""
    try:
        with httpx.Client(timeout=15, headers=_HEADERS, follow_redirects=True) as c:
            # 1) search title
            r = c.get(_API, params={
                "action": "query", "list": "search", "srsearch": query,
                "srlimit": 3, "format": "json", "utf8": 1,
            })
            hits = r.json().get("query", {}).get("search", [])
            if not hits:
                return None
            title = hits[0]["title"]
            # 2) lấy extract intro (plain text)
            r2 = c.get(_API, params={
                "action": "query", "prop": "extracts", "exintro": 1,
                "explaintext": 1, "redirects": 1, "titles": title, "format": "json",
            })
            pages = r2.json().get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            extract = (page.get("extract") or "").strip()
            if not extract:
                return None
            url = "https://vi.wikipedia.org/wiki/" + title.replace(" ", "_")
            return WebResult(title=title, url=url, extract=extract[:max_chars])
    except Exception as exc:
        logger.warning("Wikipedia fallback failed: %s", exc)
        return None
