#!/usr/bin/env python3
"""
Bulk loader: nạp bài viết Wikipedia tiếng Việt vào Qdrant bằng embedding LOCAL.

Tại sao KHÔNG đi qua HTTP /rag/ingest (sourceUrl):
  - extract_service._extract_url() dùng BeautifulSoup scrape thô HTML wiki,
    lẫn menu/infobox/tham khảo → nhiều noise cho embedding.
  - MediaWiki API (prop=extracts&explaintext) trả TOÀN VĂN đã làm sạch sẵn,
    không cần tự strip HTML.

Tại sao KHÔNG dùng embedding_service.py (Gemini) của rag-service:
  - Người dùng muốn tránh gọi Google API (quota/chi phí) — dùng model local
    qua fastembed (chạy ONNX, offline sau lần tải model đầu tiên).
  - Vector từ model local KHÔNG tương thích với vector Gemini đã có trong
    collection 'history_chunks' (2 model khác nhau → 2 không gian vector
    khác nhau, dù cùng số chiều thì so cosine similarity vẫn vô nghĩa).
    Do đó bài wiki được lưu vào 1 collection HOÀN TOÀN RIÊNG:
    WIKI_COLLECTION = "wiki_chunks_local" — không đụng dữ liệu cũ.
  - Lưu ý: /rag/chat hiện KHÔNG tự động search collection này (ngoài scope
    ban đầu — cần sửa retrieval_service.py để gộp kết quả 2 collection).

Model: intfloat/multilingual-e5-large (1024-dim) qua fastembed — multilingual,
chất lượng tốt cho tiếng Việt. E5 yêu cầu prefix "passage: " cho document
lúc embed (xem ghi chú "Prefixes for queries/documents: necessary" trong
fastembed model card).

Script TÁI DÙNG app.services.chunk_service.chunk() (sliding window 800/120)
và app.vectorstore.vector_repository.{point_id, delete_by_source_id, upsert}
(các hàm này không phụ thuộc dim/model nào — chỉ thao tác Qdrant thô).

Namespace sourceId: bám theo _validate_source_namespace (ingest_service.py)
dùng cho collection Gemini — ở đây áp dụng cho nhất quán, KHÔNG bắt buộc vì
collection tách biệt. WIKI_SOURCE_ID_MIN = 2_000_000 để không trùng CMS post
(dải post.id + 1_000_000) nếu sau này gộp chung.

Manifest (scripts/wiki_manifest.csv) map title -> sourceId ổn định:
  - Tựa đã có trong manifest -> tái dùng ID cũ, mặc định BỎ QUA nếu đã
    ingest trước (dùng --overwrite để nạp lại/refresh).
  - Tựa mới -> cấp ID kế tiếp từ WIKI_SOURCE_ID_MIN.

Idempotent: trước khi nạp 1 bài, xóa toàn bộ vector cũ của sourceId đó
(delete_by_source_id) rồi upsert lại — không tạo bản sao khi refresh.

Cách chạy (cần .env có QDRANT_URL + QDRANT_API_KEY, KHÔNG cần Google API key):
  # xem trước, KHÔNG tải model / gọi Qdrant (vẫn gọi Wikipedia API để đếm chunk):
  python rag-service/scripts/import_wiki.py --titles "Nhà Trần,Trần Hưng Đạo" --dry-run

  # nạp thử 1 bài, giới hạn 30 chunk cho rẻ (lần đầu sẽ tải model ~2.2GB):
  python rag-service/scripts/import_wiki.py --titles "Nhà Trần" --limit-chunks 30

  # nạp cả 1 thể loại wiki:
  python rag-service/scripts/import_wiki.py --category "Nhà Trần"

  # nạp lại (refresh) một bài đã có trong manifest:
  python rag-service/scripts/import_wiki.py --titles "Nhà Trần" --overwrite

  # dùng dump local thay vì gọi live API cho từng bài (tránh 429 khi ingest
  # số lượng lớn) — tải dump 1 lần tại https://dumps.wikimedia.org/viwiki/latest/
  # (file viwiki-latest-pages-articles.xml.bz2, ~1GB nén):
  python rag-service/scripts/import_wiki.py --category "Nhà Trần,Nhà Lý" \\
      --dump /Volumes/SSD/RAG-history-pdfs/viwiki-latest-pages-articles.xml.bz2
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

# --- đường dẫn ---
SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent
DEFAULT_MANIFEST = SCRIPTS_DIR / "wiki_manifest.csv"

WIKI_COLLECTION = "wiki_chunks_local"   # collection RIÊNG, không đụng 'history_chunks' (Gemini)
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
EMBEDDING_DIM = 1024

WIKI_SOURCE_ID_MIN = 2_000_000  # dải riêng cho wiki, tách khỏi CMS post (offset 1_000_000)
MANIFEST_FIELDS = ["sourceId", "title", "url", "lastIngestedAt"]

_API = "https://vi.wikipedia.org/w/api.php"
_HEADERS = {"User-Agent": "RAG-History-WikiImporter/1.0 (non-commercial research project; local bulk ingest script)"}

# fallback khi chạy --dry-run mà chưa có .env/settings (khớp default trong config.py)
_DEFAULT_CHUNK_SIZE = 800
_DEFAULT_CHUNK_OVERLAP = 120


# ---------------------------------------------------------------------------
# .env loader (copy từ load_dataset.py để không phụ thuộc python-dotenv)
# ---------------------------------------------------------------------------

def load_dotenv_into_environ(env_file: Path) -> bool:
    """Đọc 1 file .env (KEY=VALUE) vào os.environ. Không ghi đè biến đã set sẵn."""
    if not env_file.is_file():
        return False
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)
    return True


def resolve_env_file(explicit: str | None) -> Path | None:
    candidates = [Path(explicit)] if explicit else [
        Path.cwd() / ".env",
        REPO_ROOT / ".env",
        RAG_SERVICE_DIR / ".env",
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


# ---------------------------------------------------------------------------
# MediaWiki API
# ---------------------------------------------------------------------------

_FILE_NAMESPACES = ("file:", "image:", "tập tin:", "hình:")


def _clean_wikitext(wikitext: str) -> str:
    """Chuyển wikitext thô thành plain text đọc được: bỏ template/comment
    (mwparserfromhell.strip_code), và bỏ THÊM 2 loại rác mà strip_code() để
    lại nguyên: link ảnh/file (để lại 'thumb|chú thích...') và <ref>...</ref>
    (chú thích nguồn, không cần cho embedding)."""
    import mwparserfromhell
    parsed = mwparserfromhell.parse(wikitext)
    for link in parsed.filter_wikilinks():
        if str(link.title).strip().lower().startswith(_FILE_NAMESPACES):
            try:
                parsed.remove(link)
            except ValueError:
                pass
    for tag in parsed.filter_tags(matches=lambda t: t.tag.lower() in ("ref", "references")):
        try:
            parsed.remove(tag)
        except ValueError:
            pass
    return parsed.strip_code(normalize=True, collapse=True).strip()


def extract_from_dump(dump_path: Path, wanted_titles: set[str]) -> dict[str, str]:
    """Đọc TOÀN BỘ nội dung các bài trong `wanted_titles` từ dump XML chính
    thức của Wikipedia (viwiki-latest-pages-articles.xml.bz2, tải từ
    dumps.wikimedia.org) — thay cho việc gọi live API 254 lần (nguồn gây
    429 kéo dài ở các lần chạy trước). Chỉ cần 1 lượt quét toàn file,
    không quan trọng quét bao nhiêu title vì đằng nào cũng phải đọc hết
    dump 1 lần (không có index theo tên bài trong file plain dump này).

    Dùng bz2 streaming + ElementTree.iterparse để không load cả file (vài
    GB sau giải nén) vào RAM — clear() từng <page> sau khi xử lý xong."""
    import bz2
    from xml.etree.ElementTree import iterparse

    remaining = set(wanted_titles)
    found: dict[str, str] = {}
    with bz2.open(dump_path, "rb") as f:
        context = iter(iterparse(f, events=("start", "end")))
        _, root = next(context)
        title = None
        ns = None
        for event, elem in context:
            if event != "end":
                continue
            tag = elem.tag.rsplit("}", 1)[-1]
            if tag == "title":
                title = elem.text
            elif tag == "ns":
                ns = elem.text
            elif tag == "text" and ns == "0" and title in remaining:
                found[title] = elem.text or ""
                remaining.discard(title)
            elif tag == "page":
                title = None
                ns = None
                elem.clear()
                root.clear()
                if not remaining:
                    break
    return found


def fetch_article_fulltext(title: str, client: httpx.Client, retries: int = 5) -> tuple[str, str, str] | None:
    """Trả (canonical_title, url, text) hoặc None nếu bài không tồn tại/rỗng.
    Retry với backoff khi Wikipedia trả 429 (rate limit) — quan trọng khi
    --category liệt kê hàng chục/hàng trăm bài fetch liên tiếp.

    Dùng prop=revisions (trả wikitext thô, lưu sẵn trong DB) thay vì
    prop=extracts (bắt server RENDER trang) — extracts tốn tài nguyên hơn
    nhiều nên bị Wikimedia rate-limit chặt hơn hẳn, dễ gây 429 kéo dài khi
    fetch hàng trăm bài liên tiếp."""
    r = _get_with_retry(client, {
        "action": "query", "prop": "revisions", "rvprop": "content",
        "rvslots": "main", "redirects": 1,
        "titles": title, "format": "json", "utf8": 1,
    }, retries=retries)
    pages = r.json().get("query", {}).get("pages", {})
    page = next(iter(pages.values()), {})
    if "missing" in page or not page.get("revisions"):
        return None
    canonical_title = page.get("title", title)
    wikitext = page["revisions"][0]["slots"]["main"]["*"]
    text = _clean_wikitext(wikitext)
    if not text:
        return None
    url = "https://vi.wikipedia.org/wiki/" + canonical_title.replace(" ", "_")
    return canonical_title, url, text


def _get_with_retry(client: httpx.Client, params: dict, retries: int = 5) -> httpx.Response:
    """GET với retry/backoff khi Wikipedia trả 429 — dùng chung cho mọi lời gọi
    MediaWiki API, vì cả fetch bài lẫn liệt kê thể loại đều có thể bị rate-limit
    khi gọi liên tiếp (nhiều bài / nhiều thể loại trong 1 lần chạy)."""
    for attempt in range(1, retries + 1):
        r = client.get(_API, params=params)
        if r.status_code == 429:
            if attempt == retries:
                r.raise_for_status()
            wait = float(r.headers.get("Retry-After", 5 * attempt))
            print(f"    ! Wikipedia 429 (lần {attempt}/{retries}) → chờ {wait:.0f}s", file=sys.stderr)
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r
    return r  # unreachable, giữ để type-checker hài lòng


def _to_category_title(name: str) -> str:
    lower = name.lower()
    if lower.startswith("category:") or lower.startswith("thể loại:"):
        return name
    return f"Thể loại:{name}"


def _fetch_categorymembers_raw(cmtitle: str, client: httpx.Client, limit: int) -> list[dict]:
    """Trả TẤT CẢ member (bài viết ns=0 lẫn thể loại con ns=14) của 1 thể loại,
    có phân trang. Dùng chung cho cả liệt kê phẳng lẫn đệ quy subcategory."""
    members: list[dict] = []
    cmcontinue: str | None = None
    while len(members) < limit:
        params = {
            "action": "query", "list": "categorymembers", "cmtitle": cmtitle,
            "cmlimit": min(500, limit - len(members)), "format": "json", "utf8": 1,
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        r = _get_with_retry(client, params)
        data = r.json()
        batch = data.get("query", {}).get("categorymembers", [])
        members.extend(batch)
        cmcontinue = data.get("continue", {}).get("cmcontinue")
        if not cmcontinue or not batch:
            break
    return members


def fetch_category_titles(category: str, client: httpx.Client, cm_limit: int,
                           max_depth: int = 0) -> list[str]:
    """Liệt kê tựa bài (namespace 0 = bài viết) trong 1 thể loại wiki.

    max_depth=0: chỉ lấy bài trực tiếp trong thể loại (hành vi cũ).
    max_depth>0: ĐỆ QUY thêm vào thể loại con (ns=14) tới độ sâu này — vd
    'Nhà Nguyễn' có thể có con 'Vua nhà Nguyễn', 'Chiến tranh thời Nguyễn'...
    mà bài chỉ gắn thẻ ở thể loại con sẽ bị bỏ sót nếu không đệ quy.

    Chặn 2 rủi ro của category graph trên Wikipedia: (1) CYCLE — thể loại A
    chứa B, B chứa lại A — chặn bằng visited-set; (2) NỔ QUY MÔ — thể loại
    gốc quá rộng kéo theo hàng nghìn thể loại con không liên quan — chặn
    bằng cm_limit (tổng số bài, dừng ngay khi đạt) + max_depth (giới hạn số
    tầng con được đi vào)."""
    seen_titles: dict[str, None] = {}
    visited_cats: set[str] = set()
    queue: list[tuple[str, int]] = [(category, 0)]
    while queue and len(seen_titles) < cm_limit:
        cat, depth = queue.pop(0)
        norm = cat.strip().lower()
        if norm in visited_cats:
            continue
        visited_cats.add(norm)
        members = _fetch_categorymembers_raw(_to_category_title(cat), client, cm_limit - len(seen_titles))
        for m in members:
            if m.get("ns") == 0:
                seen_titles.setdefault(m["title"], None)
            elif m.get("ns") == 14 and depth < max_depth:
                subcat = m["title"].split(":", 1)[-1]  # bỏ prefix "Thể loại:"/"Category:"
                queue.append((subcat, depth + 1))
    return list(seen_titles)


# ---------------------------------------------------------------------------
# Tra thể loại HOÀN TOÀN OFFLINE (page.sql.gz + linktarget.sql.gz +
# categorylinks.sql.gz — 3 file dump chính thức, tải cùng thư mục với --dump)
#
# Tại sao cần thêm 3 file này dù đã có --dump (nội dung bài):
#   --dump (pages-articles.xml.bz2) chỉ chứa TOÀN VĂN bài viết, KHÔNG có
#   thông tin "bài nào thuộc thể loại nào" — thông tin đó phải tra qua live
#   API (list=categorymembers), chính là nguồn gây 429 kéo dài ở các lần
#   ingest trước. 3 file dump này (page/linktarget/categorylinks) là các
#   bảng MySQL chứa đúng thông tin đó, cho phép tra offline 100%.
#
# Schema (đã soi trực tiếp CREATE TABLE trong dump thật, KHÔNG đoán từ tài
# liệu cũ — 2 lần: lần 1 tưởng cl_target_id trỏ vào bảng `category`, test
# thực tế ra 0 kết quả vì MediaWiki đã chuẩn hóa categorylinks dùng chung
# bảng `linktarget` — bảng target dùng chung cho pagelinks/templatelinks/
# categorylinks..., KHÔNG phải bảng `category` — nên phải join qua đây):
#   page:          page_id(0), page_namespace(1), page_title(2), ...
#   linktarget:    lt_id(0), lt_namespace(1), lt_title(2)  — thể loại có ns=14
#   categorylinks: cl_from(0)=page_id, cl_sortkey(1), cl_timestamp(2),
#                  cl_sortkey_prefix(3), cl_type(4)='page'/'subcat'/'file',
#                  cl_collation_id(5), cl_target_id(6)=linktarget.lt_id
#
# Dữ liệu nạp vào SQLite (không giữ trong RAM Python — categorylinks có thể
# vài triệu dòng, máy có thể đã dùng gần hết RAM) để tra bằng SQL có index,
# nhanh và nhẹ RAM dù dump gốc nặng.
# ---------------------------------------------------------------------------

def _iter_sql_rows(gz_path: Path, table: str):
    """Đọc dump SQL kiểu mysqldump của 1 bảng, yield từng row dạng list[str|None].
    Không cần MySQL/thư viện ngoài — chỉ parse cấu trúc
    'INSERT INTO `table` VALUES (...),(...);' (mỗi statement thường nằm
    trên 1 dòng rất dài trong dump của Wikimedia)."""
    import gzip
    prefix = f"INSERT INTO `{table}` VALUES "
    with gzip.open(gz_path, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.startswith(prefix):
                continue
            body = line[len(prefix):].rstrip()
            if body.endswith(";"):
                body = body[:-1]
            yield from _parse_sql_value_tuples(body)


def _parse_sql_value_tuples(text: str):
    """Yield list[str|None] cho từng tuple (...) trong 1 chuỗi
    '(...),(...),(...)' — tôn trọng chuỗi có escape backslash bên trong
    (giá trị binary/garbled của cl_sortkey có thể chứa dấu ' nếu không xử
    lý đúng escape sẽ tách sai ranh giới tuple)."""
    i, n = 0, len(text)
    while i < n:
        if text[i] == "(":
            start = i + 1
            depth = 1
            i += 1
            in_str = False
            while i < n and depth > 0:
                c = text[i]
                if in_str:
                    if c == "\\":
                        i += 2
                        continue
                    if c == "'":
                        in_str = False
                elif c == "'":
                    in_str = True
                elif c == "(":
                    depth += 1
                elif c == ")":
                    depth -= 1
                i += 1
            yield _split_sql_fields(text[start:i - 1])
        else:
            i += 1


_SQL_ESCAPES = {"n": "\n", "t": "\t", "0": "\0", "r": "\r", "'": "'", '"': '"', "\\": "\\", "Z": "\x1a"}


def _split_sql_fields(inner: str) -> list[str | None]:
    """Tách 1 tuple SQL '1,2,'text',NULL' thành list field (string thô cho
    số/NULL, đã unescape cho chuỗi trong nháy đơn). Chỉ cần đủ dùng cho các
    field ta thực sự đọc (id, ns, title, type) — không cần chính xác tuyệt
    đối với mọi ký tự nhị phân hiếm gặp ở field bỏ qua (cl_sortkey)."""
    fields: list[str | None] = []
    i, n = 0, len(inner)
    while i < n:
        c = inner[i]
        if c == "'":
            i += 1
            buf = []
            while i < n:
                c2 = inner[i]
                if c2 == "\\" and i + 1 < n:
                    buf.append(_SQL_ESCAPES.get(inner[i + 1], inner[i + 1]))
                    i += 2
                    continue
                if c2 == "'":
                    i += 1
                    break
                buf.append(c2)
                i += 1
            fields.append("".join(buf))
            while i < n and inner[i] in ", ":
                i += 1
        else:
            start = i
            while i < n and inner[i] != ",":
                i += 1
            token = inner[start:i].strip()
            fields.append(None if token == "NULL" else token)
            if i < n and inner[i] == ",":
                i += 1
    return fields


def build_offline_category_index(dump_dir: Path, db_path: Path) -> None:
    """ETL 1 lần: nạp page.sql.gz + linktarget.sql.gz + categorylinks.sql.gz
    vào 1 file SQLite để tra thể loại + đệ quy subcategory hoàn toàn offline.
    Idempotent — bỏ qua nếu db_path đã tồn tại (xóa file để build lại)."""
    import sqlite3

    if db_path.exists():
        print(f"  (đã có index offline tại {db_path.name}, bỏ qua ETL)")
        return

    page_sql = dump_dir / "viwiki-latest-page.sql.gz"
    linktarget_sql = dump_dir / "viwiki-latest-linktarget.sql.gz"
    categorylinks_sql = dump_dir / "viwiki-latest-categorylinks.sql.gz"
    for p in (page_sql, linktarget_sql, categorylinks_sql):
        if not p.exists():
            raise FileNotFoundError(
                f"Thiếu {p.name} — tải từ https://dumps.wikimedia.org/viwiki/latest/{p.name}"
            )

    tmp_path = db_path.with_suffix(".tmp")
    if tmp_path.exists():
        tmp_path.unlink()
    conn = sqlite3.connect(str(tmp_path))
    conn.execute("PRAGMA synchronous=OFF")
    conn.execute("PRAGMA journal_mode=MEMORY")
    conn.execute("CREATE TABLE page (id INTEGER PRIMARY KEY, ns INTEGER, title TEXT)")
    conn.execute("CREATE TABLE linktarget (id INTEGER PRIMARY KEY, ns INTEGER, title TEXT)")
    conn.execute("CREATE TABLE categorylinks (from_page INTEGER, target_cat INTEGER, type TEXT)")

    def _load(gz_path: Path, table: str, build_row, batch_size: int = 50_000, keep=None) -> int:
        batch = []
        total = 0
        for fields in _iter_sql_rows(gz_path, table):
            row = build_row(fields)
            if keep is not None and not keep(row):
                continue
            batch.append(row)
            total += 1
            if len(batch) >= batch_size:
                cols = len(batch[0])
                conn.executemany(f"INSERT INTO {table} VALUES ({','.join('?' * cols)})", batch)
                batch.clear()
        if batch:
            cols = len(batch[0])
            conn.executemany(f"INSERT INTO {table} VALUES ({','.join('?' * cols)})", batch)
        return total

    print("  Nạp page.sql.gz...")
    n = _load(page_sql, "page", lambda f: (int(f[0]), int(f[1]), f[2]))
    print(f"    → {n:,} trang")

    print("  Nạp linktarget.sql.gz (chỉ giữ ns=14 = thể loại)...")
    n = _load(linktarget_sql, "linktarget", lambda f: (int(f[0]), int(f[1]), f[2]),
              keep=lambda row: row[1] == 14)
    print(f"    → {n:,} thể loại")

    print("  Nạp categorylinks.sql.gz (file lớn nhất, có thể mất vài phút)...")
    n = _load(categorylinks_sql, "categorylinks", lambda f: (int(f[0]), int(f[6]), f[4]))
    print(f"    → {n:,} liên kết")

    print("  Tạo index...")
    conn.execute("CREATE INDEX idx_linktarget_title ON linktarget(title)")
    conn.execute("CREATE INDEX idx_categorylinks_target ON categorylinks(target_cat)")
    conn.commit()
    conn.close()
    tmp_path.rename(db_path)
    print(f"  ✓ Index offline sẵn sàng tại {db_path.name}")


def resolve_category_titles_offline(db_path: Path, category: str, cm_limit: int,
                                     max_depth: int = 0) -> list[str]:
    """Tương đương fetch_category_titles() nhưng tra hoàn toàn offline qua
    SQLite index (build_offline_category_index) — không gọi live API. Cùng
    logic chống cycle (visited-set) + giới hạn quy mô (cm_limit) như bản
    live API, để không nổ quy mô khi thể loại gốc quá rộng."""
    import sqlite3
    conn = sqlite3.connect(str(db_path))

    def cat_id_of(name: str) -> int | None:
        """Trả lt_id (linktarget) của thể loại — đây là ID mà
        categorylinks.target_cat thực sự trỏ vào (không phải category.cat_id)."""
        title = name.split(":", 1)[-1].strip().replace(" ", "_")
        row = conn.execute(
            "SELECT id FROM linktarget WHERE ns = 14 AND title = ?", (title,)
        ).fetchone()
        return row[0] if row else None

    seen_titles: dict[str, None] = {}
    visited_cats: set[str] = set()
    queue: list[tuple[str, int]] = [(category, 0)]
    while queue and len(seen_titles) < cm_limit:
        cat, depth = queue.pop(0)
        norm = cat.strip().lower()
        if norm in visited_cats:
            continue
        visited_cats.add(norm)
        cid = cat_id_of(cat)
        if cid is None:
            continue
        rows = conn.execute(
            "SELECT from_page, type FROM categorylinks WHERE target_cat = ?", (cid,)
        ).fetchall()
        candidate_ids = [pid for pid, typ in rows if typ in ("page", "subcat")]
        if not candidate_ids:
            continue
        placeholders = ",".join("?" * len(candidate_ids))
        title_rows = conn.execute(
            f"SELECT id, ns, title FROM page WHERE id IN ({placeholders})", candidate_ids
        ).fetchall()
        title_by_id = {pid: (ns, title.replace("_", " ")) for pid, ns, title in title_rows}
        for pid, typ in rows:
            info = title_by_id.get(pid)
            if not info:
                continue
            ns, title = info
            if typ == "page" and ns == 0:
                seen_titles.setdefault(title, None)
                if len(seen_titles) >= cm_limit:
                    break
            elif typ == "subcat" and depth < max_depth:
                queue.append((title, depth + 1))
    conn.close()
    return list(seen_titles)


# ---------------------------------------------------------------------------
# Manifest (title -> sourceId ổn định)
# ---------------------------------------------------------------------------

def load_manifest(path: Path) -> dict[str, dict]:
    rows: dict[str, dict] = {}
    if path.is_file():
        with path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rows[row["title"]] = row
    return rows


def save_manifest(path: Path, manifest: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS)
        writer.writeheader()
        for row in sorted(manifest.values(), key=lambda r: int(r["sourceId"])):
            writer.writerow(row)


def next_source_id(manifest: dict[str, dict]) -> int:
    used = {int(r["sourceId"]) for r in manifest.values()}
    candidate = WIKI_SOURCE_ID_MIN
    while candidate in used:
        candidate += 1
    return candidate


def _register_article(manifest: dict[str, dict], canonical_title: str, url: str, text: str,
                       existing: dict | None = None) -> dict:
    """Gán sourceId cho 1 bài (tái dùng ID cũ nếu đã có trong manifest, cấp ID
    mới nếu chưa) và trả về dict {title, url, text, source_id, is_new} cho
    bước chunk/embed/upsert. Đặt trước 1 slot tạm trong manifest ngay khi cấp
    ID mới để next_source_id() không cấp trùng cho bài kế tiếp trong batch."""
    row = manifest.get(canonical_title) or existing
    if row:
        source_id = int(row["sourceId"])
        is_new = False
    else:
        source_id = next_source_id(manifest)
        is_new = True
        manifest[canonical_title] = {
            "sourceId": str(source_id), "title": canonical_title,
            "url": url, "lastIngestedAt": "",
        }
    return {"title": canonical_title, "url": url, "text": text,
            "source_id": source_id, "is_new": is_new}


# ---------------------------------------------------------------------------
# Embedding LOCAL (fastembed, ONNX, không gọi API ngoài)
# ---------------------------------------------------------------------------

def make_local_embed_fn():
    """Load model multilingual-e5-large qua fastembed (tải ~2.2GB lần đầu,
    cache tại ~/.cache/fastembed/ sau đó). E5 cần prefix 'passage: ' cho
    document — không có prefix thì chất lượng retrieval giảm rõ rệt."""
    from fastembed import TextEmbedding
    model = TextEmbedding(model_name=EMBEDDING_MODEL)

    def embed_documents(texts: list[str]) -> list[list[float]]:
        prefixed = [f"passage: {t}" for t in texts]
        return [vec.tolist() for vec in model.embed(prefixed)]

    return embed_documents


def ensure_wiki_collection(client, collection: str) -> None:
    """Tạo collection riêng cho vector local nếu chưa có — dim=EMBEDDING_DIM,
    KHÔNG dùng app.vectorstore.qdrant_client.ensure_collection() vì hàm đó
    tạo collection theo settings.embedding_dim (768, khóa cứng cho Gemini)."""
    from qdrant_client.models import Distance, PayloadSchemaType, VectorParams
    if not client.collection_exists(collection):
        client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
    client.create_payload_index(
        collection_name=collection, field_name="sourceId",
        field_schema=PayloadSchemaType.INTEGER,
    )


# ---------------------------------------------------------------------------
# Payload (bám cấu trúc ingest_service._build_payload, thêm embeddingModel
# để phân biệt vector local vs Gemini nếu sau này gộp collection)
# ---------------------------------------------------------------------------

def build_payload(source_id: int, title: str, url: str, chunk_index: int,
                   text: str, created_at: str) -> dict:
    return {
        "sourceId": source_id,
        "sourceType": "ARTICLE",
        "articleId": source_id,
        "documentId": None,
        "sourceUrl": url,
        "filePath": None,
        "chunkIndex": chunk_index,
        "pageNumber": None,
        "chunkText": text,
        "title": title,
        "categoryId": None,
        "categoryName": None,
        "slug": None,
        "tagIds": [],
        "eventIds": [],
        "periodIds": [],
        "embeddingModel": EMBEDDING_MODEL,
        "createdAt": created_at,
    }


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Nạp bài viết Wikipedia tiếng Việt vào Qdrant (embedding local, fastembed).")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--titles", default=None, help="danh sách tựa bài, ngăn cách bằng dấu phẩy")
    src.add_argument("--titles-file", default=None, help="file text, mỗi dòng 1 tựa bài")
    src.add_argument("--category", default=None, help="thể loại wiki, có thể liệt kê nhiều ngăn cách bằng dấu phẩy, vd 'Nhà Trần,Nhà Lý'")
    parser.add_argument("--cm-limit", type=int, default=500, help="số bài tối đa lấy từ --category (tính CHUNG cả thể loại con nếu dùng --category-depth)")
    parser.add_argument("--category-depth", type=int, default=0,
                        help="đi sâu bao nhiêu tầng thể loại con (0 = chỉ bài trực tiếp, hành vi cũ; 1 = thêm 1 tầng con, ...)")
    parser.add_argument("--dump", default=None,
                        help="đường dẫn file viwiki-latest-pages-articles.xml.bz2 (tải từ dumps.wikimedia.org). "
                             "Nếu có: lấy NỘI DUNG bài từ file này (1 lượt quét, KHÔNG gọi live API).")
    parser.add_argument("--offline-category", action="store_true",
                        help="tra thể loại/subcategory HOÀN TOÀN OFFLINE qua SQLite index, không gọi live "
                             "API Wikipedia chút nào. Cần 3 file cùng thư mục với --dump: "
                             "viwiki-latest-page.sql.gz, viwiki-latest-linktarget.sql.gz, "
                             "viwiki-latest-categorylinks.sql.gz (tải từ dumps.wikimedia.org/viwiki/latest/).")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="đường dẫn wiki_manifest.csv")
    parser.add_argument("--chunk-size", type=int, default=_DEFAULT_CHUNK_SIZE)
    parser.add_argument("--chunk-overlap", type=int, default=_DEFAULT_CHUNK_OVERLAP)
    parser.add_argument("--limit-chunks", type=int, default=None, help="giới hạn số chunk MỖI bài (test rẻ)")
    parser.add_argument("--embed-batch", type=int, default=32, help="số chunk mỗi lần embed cùng lúc (giới hạn RAM)")
    parser.add_argument("--collection", default=WIKI_COLLECTION, help="ghi đè tên collection")
    parser.add_argument("--env-file", default=None, help="chỉ định file .env (chỉ cần QDRANT_URL/QDRANT_API_KEY)")
    parser.add_argument("--overwrite", action="store_true",
                        help="nạp lại bài đã có trong manifest (mặc định: bỏ qua bài đã ingest trước)")
    parser.add_argument("--resume", action="store_true",
                        help="bỏ qua chunk đã có trong Qdrant (dùng khi 1 bài bị gián đoạn giữa chừng)")
    parser.add_argument("--dry-run", action="store_true",
                        help="chỉ lấy bài + đếm chunk, KHÔNG tải model / gọi Qdrant")
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    manifest = load_manifest(manifest_path)

    with httpx.Client(timeout=30, headers=_HEADERS, follow_redirects=True) as wiki_client:
        if args.category:
            seen_titles: dict[str, None] = {}
            cats = [c.strip() for c in args.category.split(",") if c.strip()]
            if args.offline_category:
                if not args.dump:
                    print("ERROR: --offline-category cần đi kèm --dump (cùng thư mục chứa 3 file .sql.gz).",
                          file=sys.stderr)
                    return 1
                dump_dir = Path(args.dump).parent
                db_path = dump_dir / "viwiki-category-index.sqlite"
                print(f"Đang chuẩn bị index thể loại offline tại '{db_path.name}'...")
                build_offline_category_index(dump_dir, db_path)
                for cat in cats:
                    print(f"Đang tra thể loại offline '{cat}'...")
                    cat_titles = resolve_category_titles_offline(db_path, cat, args.cm_limit, args.category_depth)
                    print(f"  → {len(cat_titles)} bài")
                    for t in cat_titles:
                        seen_titles.setdefault(t, None)
            else:
                for i, cat in enumerate(cats):
                    if i > 0:
                        time.sleep(3.0)  # throttle giữa các thể loại, tránh 429
                    print(f"Đang liệt kê bài trong thể loại '{cat}'...")
                    cat_titles = fetch_category_titles(cat, wiki_client, args.cm_limit, args.category_depth)
                    print(f"  → {len(cat_titles)} bài")
                    for t in cat_titles:
                        seen_titles.setdefault(t, None)
            titles = list(seen_titles)
            print(f"Tổng cộng (đã bỏ trùng): {len(titles)} bài")
        elif args.titles_file:
            titles = [t.strip() for t in Path(args.titles_file).read_text(encoding="utf-8").splitlines() if t.strip()]
        else:
            titles = [t.strip() for t in args.titles.split(",") if t.strip()]

        if not titles:
            print("ERROR: không có tựa bài nào để nạp.", file=sys.stderr)
            return 1

        # --- fetch full text cho từng bài, quyết định skip/mới trước khi đụng embedding ---
        pending_titles = []  # tựa cần lấy nội dung (đã lọc bài đã ingest trước)
        for raw_title in titles:
            existing = manifest.get(raw_title)
            if existing and not args.overwrite:
                print(f"-- '{raw_title}': đã ingest trước ({existing['lastIngestedAt']}) — bỏ qua (--overwrite để nạp lại)")
                continue
            pending_titles.append(raw_title)

        articles: list[dict] = []  # {title, url, text, source_id, is_new}

        if args.dump:
            print(f"\nĐang quét dump '{args.dump}' để lấy nội dung {len(pending_titles)} bài "
                  f"(1 lượt, không gọi live API)...")
            dump_texts = extract_from_dump(Path(args.dump), set(pending_titles))
            print(f"  → tìm thấy {len(dump_texts)}/{len(pending_titles)} bài trong dump")
            for raw_title in pending_titles:
                wikitext = dump_texts.get(raw_title)
                if wikitext is None:
                    print(f"-- '{raw_title}': KHÔNG có trong dump (có thể là redirect/bài mới) — bỏ qua", file=sys.stderr)
                    continue
                text = _clean_wikitext(wikitext)
                if not text:
                    print(f"-- '{raw_title}': nội dung rỗng sau khi lọc — bỏ qua", file=sys.stderr)
                    continue
                url = "https://vi.wikipedia.org/wiki/" + raw_title.replace(" ", "_")
                articles.append(_register_article(manifest, raw_title, url, text))
        else:
            for raw_title in pending_titles:
                fetched = fetch_article_fulltext(raw_title, wiki_client)
                time.sleep(1.5)  # throttle giữa các lần gọi Wikipedia API, tránh 429 khi có nhiều bài
                if fetched is None:
                    print(f"-- '{raw_title}': KHÔNG tìm thấy bài / rỗng — bỏ qua", file=sys.stderr)
                    continue
                canonical_title, url, text = fetched
                articles.append(_register_article(manifest, canonical_title, url, text, existing=manifest.get(raw_title)))

    if not articles:
        print("Không có bài nào cần nạp.")
        return 0

    # --- chunk (tái dùng chunk_service của rag-service) ---
    sys.path.insert(0, str(RAG_SERVICE_DIR))
    from app.services.chunk_service import chunk as chunk_fn
    from app.services.extract_service import PageText

    print("\n== Kế hoạch nạp ==")
    plan: list[tuple[dict, list]] = []
    total_chunks = 0
    for art in articles:
        chunks = chunk_fn([PageText(page_number=None, text=art["text"])], args.chunk_size, args.chunk_overlap)
        if args.limit_chunks is not None:
            chunks = chunks[: args.limit_chunks]
        plan.append((art, chunks))
        total_chunks += len(chunks)
        tag = "MỚI" if art["is_new"] else "refresh"
        print(f"  sourceId={art['source_id']} [{tag}]  {len(chunks):>4} chunk  | {art['title']}")
    print(f"\nTổng cộng: {total_chunks} chunk, model={EMBEDDING_MODEL} (dim={EMBEDDING_DIM}), collection='{args.collection}'.")

    if args.dry_run:
        print("\n[DRY RUN] không tải model / gọi Qdrant, không ghi manifest.")
        return 0

    # --- chỉ tới đây mới cần .env (QDRANT_URL/QDRANT_API_KEY) + tải model ---
    env_file = resolve_env_file(args.env_file)
    if env_file and load_dotenv_into_environ(env_file):
        print(f"env        : {env_file}")
    else:
        print("env        : (không tìm thấy .env — dựa vào biến môi trường sẵn có)")

    try:
        from app.vectorstore.qdrant_client import get_client
        from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR khi import app/ (thiếu .env hay deps?): {exc}", file=sys.stderr)
        return 1
    client = get_client()

    print(f"Đang tải model {EMBEDDING_MODEL} (lần đầu có thể mất vài phút, ~2.2GB)...")
    embed_documents = make_local_embed_fn()
    print("Model sẵn sàng.")

    ensure_wiki_collection(client, args.collection)

    created_at = datetime.now(timezone.utc).isoformat()
    grand_total = 0
    t_start = time.time()

    for art, chunks in plan:
        sid = art["source_id"]
        title = art["title"]
        url = art["url"]
        print(f"\n>> sourceId={sid} | {title}")

        if not args.resume:
            delete_by_source_id(args.collection, sid)

        doc_count = 0
        skipped = 0
        try:
            for i in range(0, len(chunks), args.embed_batch):
                batch = chunks[i: i + args.embed_batch]
                if args.resume:
                    all_ids = [point_id(sid, c.chunk_index) for c in batch]
                    existing_ids = {str(p.id) for p in client.retrieve(
                        collection_name=args.collection, ids=all_ids,
                        with_payload=False, with_vectors=False,
                    )}
                    to_process = [c for c in batch if point_id(sid, c.chunk_index) not in existing_ids]
                    skipped += len(batch) - len(to_process)
                else:
                    to_process = batch

                if to_process:
                    texts = [c.text for c in to_process]
                    vectors = embed_documents(texts)
                    ids = [point_id(sid, c.chunk_index) for c in to_process]
                    payloads = [build_payload(sid, title, url, c.chunk_index, c.text, created_at)
                                for c in to_process]
                    upsert(args.collection, ids, vectors, payloads)
                    doc_count += len(to_process)

                label = f"   ... đã nạp {doc_count} chunk"
                if skipped:
                    label += f" (bỏ qua {skipped} chunk đã có)"
                print(label, end="\r", flush=True)
        except Exception as exc:  # noqa: BLE001
            print(f"\n   ERROR khi nạp '{title}': {exc}", file=sys.stderr)
            print("   (chạy lại với --resume để tiếp tục từ chunk còn thiếu)", file=sys.stderr)
            save_manifest(manifest_path, manifest)
            return 1

        grand_total += doc_count
        summary = f"   ✓ {title}: {doc_count} chunk -> Qdrant"
        if skipped:
            summary += f"  ({skipped} chunk đã có, bỏ qua)"
        print(summary)

        manifest[title] = {
            "sourceId": str(sid), "title": title, "url": url,
            "lastIngestedAt": created_at,
        }

    save_manifest(manifest_path, manifest)
    elapsed = time.time() - t_start
    print(f"\n== XONG: {grand_total} chunk vào collection '{args.collection}' trong {elapsed:.0f}s ==")
    print(f"Manifest   : {manifest_path}")
    print(f"Lưu ý: /rag/chat KHÔNG tự search collection '{args.collection}' — cần sửa retrieval_service.py "
          f"nếu muốn gộp kết quả với collection Gemini.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
