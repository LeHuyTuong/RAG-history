#!/usr/bin/env python3
"""
Build genealogy (RoyalPerson) from Wikipedia → Neo4j Aura.

Usage:
  .venv/bin/python scripts/build_genealogy.py --dynasty all --recreate
  .venv/bin/python scripts/build_genealogy.py --dynasty ly --dry-run
  .venv/bin/python scripts/build_genealogy.py --dynasty ly --recreate --skip-crosscheck
"""
from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import time
from pathlib import Path

import httpx

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

SCRIPTS_DIR = Path(__file__).resolve().parent
RAG_SERVICE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = RAG_SERVICE_DIR.parent

_API = "https://vi.wikipedia.org/w/api.php"
_HEADERS = {"User-Agent": "RAG-History/1.0 (genealogy-build; history-rag)"}
_REQUEST_DELAY = 1.5  # seconds between Wikipedia API calls
_last_request_time: float = 0.0

LY_KINGS = [
    ("Lý Thái Tổ", 1),
    ("Lý Thái Tông", 2),
    ("Lý Thánh Tông", 3),
    ("Lý Nhân Tông", 4),
    ("Lý Thần Tông", 5),
    ("Lý Anh Tông", 6),
    ("Lý Cao Tông", 7),
    ("Lý Huệ Tông", 8),
    ("Lý Chiêu Hoàng", 9),
]

TRAN_KINGS = [
    ("Trần Thái Tông", 1),
    ("Trần Thánh Tông", 2),
    ("Trần Nhân Tông", 3),
    ("Trần Anh Tông", 4),
    ("Trần Minh Tông", 5),
    ("Trần Hiến Tông", 6),
    ("Trần Dụ Tông", 7),
    ("Trần Nghệ Tông", 8),
    ("Trần Duệ Tông", 9),
    ("Trần Phế Đế", 10),
    ("Trần Thuận Tông", 11),
    ("Trần Thiếu Đế", 12),
]

# Maps húy/miếu-hiệu variants → canonical RoyalPerson name
PARENT_NAME_MAP = {
    "Lý Công Uẩn": "Lý Thái Tổ",
    "Lý Phật Mã": "Lý Thái Tông",
    "Lý Nhật Tôn": "Lý Thánh Tông",
    "Lý Càn Đức": "Lý Nhân Tông",
    "Lý Dương Hoán": "Lý Thần Tông",
    "Lý Thiên Tộ": "Lý Anh Tông",
    "Lý Long Trát": "Lý Cao Tông",
    "Lý Sảm": "Lý Huệ Tông",
    "Lý Phật Kim": "Lý Chiêu Hoàng",
    "Lý Nguyên Hoàng": "Lý Thái Tổ",
    "Lý Đức Chính": "Lý Thái Tổ",
    "Trần Cảnh": "Trần Thái Tông",
    "Trần Hoảng": "Trần Thánh Tông",
    "Trần Khâm": "Trần Nhân Tông",
    "Trần Thuyên": "Trần Anh Tông",
    "Trần Mạnh": "Trần Minh Tông",
    "Trần Vượng": "Trần Hiến Tông",
    "Trần Hạo": "Trần Dụ Tông",
    "Trần Phủ": "Trần Nghệ Tông",
    "Trần Kính": "Trần Duệ Tông",
    "Trần Nhật Kiệt": "Trần Phế Đế",
    "Trần Hiện": "Trần Phế Đế",
    "Trần Ngung": "Trần Thuận Tông",
    "Trần Yên": "Trần Thiếu Đế",
}

DYNASTIES = {
    "ly": ("Nhà Lý", LY_KINGS),
    "tran": ("Nhà Trần", TRAN_KINGS),
}


def load_env():
    for cand in [REPO_ROOT / ".env", RAG_SERVICE_DIR / ".env"]:
        if cand.is_file():
            for line in cand.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


def strip_wiki_markup(text: str) -> str:
    text = re.sub(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", r"\1", text)
    text = re.sub(r"'''?|''", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_year(text: str) -> int | None:
    if not text:
        return None
    text = strip_wiki_markup(text)
    match = re.search(r"(\d{3,4})", text)
    if match:
        return int(match.group(1))
    return None


def _rate_limit():
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < _REQUEST_DELAY:
        time.sleep(_REQUEST_DELAY - elapsed)
    _last_request_time = time.time()


def fetch_wikitext(page_title: str, retries: int = 3) -> str | None:
    params = {
        "action": "parse",
        "page": page_title,
        "prop": "wikitext",
        "format": "json",
        "utf8": 1,
    }
    for attempt in range(1, retries + 1):
        _rate_limit()
        try:
            with httpx.Client(timeout=20, headers=_HEADERS, follow_redirects=True) as c:
                r = c.get(_API, params=params)
                if r.status_code == 429:
                    wait = min(5 * attempt, 30)
                    logger.warning("Rate limited (attempt %d/%d) — waiting %ds", attempt, retries, wait)
                    time.sleep(wait)
                    continue
                data = r.json()
                if "parse" in data and "wikitext" in data["parse"]:
                    return data["parse"]["wikitext"]["*"]
                if "error" in data:
                    logger.warning("Wikipedia error for '%s': %s", page_title, data["error"].get("info", ""))
                    return None
                logger.warning("No wikitext for '%s'", page_title)
                return None
        except httpx.TimeoutException:
            logger.warning("Timeout fetching '%s'", page_title)
            if attempt < retries:
                time.sleep(5)
                continue
            return None
        except Exception as exc:
            logger.warning("HTTP error fetching '%s': %s", page_title, exc)
            if attempt < retries:
                time.sleep(5)
                continue
            return None
    return None


def parse_infobox(wikitext: str, page_title: str) -> dict:
    result = {
        "parent": None,
        "birth_year": None,
        "death_year": None,
        "reign_start": None,
        "reign_end": None,
        "temple_name": None,
        "raw_fields": {},
    }

    lines = wikitext.split("\n")
    in_infobox = False
    infobox_lines: list[str] = []
    brace_depth = 0

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("{{Thông tin") or (stripped.startswith("{{Infobox") and "monarch" in stripped.lower()):
            in_infobox = True
            brace_depth = stripped.count("{") - stripped.count("}")
            infobox_lines = [stripped]
            continue
        if in_infobox:
            infobox_lines.append(stripped)
            brace_depth += stripped.count("{") - stripped.count("}")
            if brace_depth <= 0:
                break

    if not infobox_lines:
        logger.info("No infobox found for '%s'", page_title)
        return result

    infobox_text = "\n".join(infobox_lines)

    for key in ("cha", "thân phụ", "thân sinh", "miếu hiệu", "sinh", "mất", "tại vị", "trị vì"):
        pattern = re.compile(
            rf"(?:^|\n)\|\s*{re.escape(key)}\s*=\s*(.+?)(?=\||\n\||$)",
            re.IGNORECASE | re.DOTALL,
        )
        match = pattern.search(infobox_text)
        if match:
            raw = match.group(1).strip()
            result["raw_fields"][key] = raw

    # Extract parent
    parent_raw = None
    for f in ("cha", "thân phụ", "thân sinh"):
        if f in result["raw_fields"]:
            parent_raw = result["raw_fields"][f]
            break

    if parent_raw:
        parent = strip_wiki_markup(parent_raw)
        parent = parent.strip().rstrip(".")
        result["parent"] = parent

    # Extract temple name
    if "miếu hiệu" in result["raw_fields"]:
        result["temple_name"] = strip_wiki_markup(result["raw_fields"]["miếu hiệu"]).strip()

    # Extract years from birth field
    if "sinh" in result["raw_fields"]:
        result["birth_year"] = extract_year(result["raw_fields"]["sinh"])

    if "mất" in result["raw_fields"]:
        result["death_year"] = extract_year(result["raw_fields"]["mất"])

    reign_key = "tại vị" if "tại vị" in result["raw_fields"] else "trị vì"
    if reign_key in result["raw_fields"]:
        reign_text = strip_wiki_markup(result["raw_fields"][reign_key])
        years = re.findall(r"(\d{3,4})", reign_text)
        if years:
            result["reign_start"] = int(years[0])
            if len(years) > 1:
                result["reign_end"] = int(years[-1])

    return result


def normalize_parent_name(raw_parent: str, page_title: str) -> str | None:
    if not raw_parent:
        return None

    # Direct map lookup
    if raw_parent in PARENT_NAME_MAP:
        return PARENT_NAME_MAP[raw_parent]

    # Maybe already a canonical name
    for canonical in list(PARENT_NAME_MAP.values()) + [k for k, _ in LY_KINGS] + [k for k, _ in TRAN_KINGS]:
        if raw_parent.lower() == canonical.lower():
            return canonical

    # Check if raw_parent is a known húy (reverse of PARENT_NAME_MAP)
    reverse_map = {v: k for k, v in PARENT_NAME_MAP.items()}

    # Try fuzzy: raw_parent may contain the canonical name somewhere
    for canonical in list(PARENT_NAME_MAP.values()) + [k for k, _ in LY_KINGS] + [k for k, _ in TRAN_KINGS]:
        for part in re.split(r"[,\s]+", raw_parent):
            if part.lower() == canonical.lower():
                return canonical

    return None


def crosscheck_with_graph(dynasty_label: str, driver, database: str):
    """Query existing graph for CHA_CON relationships involving Lý/Trần entities."""
    logger.info("Cross-checking with existing GraphRAG data...")
    try:
        with driver.session(database=database) as session:
            rows = session.run(
                "MATCH (a:Entity)-[r:REL]->(b:Entity) "
                "WHERE r.type CONTAINS 'CON' AND "
                "(a.name CONTAINS $d OR b.name CONTAINS $d) "
                "RETURN a.name AS src, r.type AS rel, b.name AS tgt "
                "LIMIT 30",
                d="Lý" if dynasty_label == "ly" else "Trần",
            )
            found = []
            for row in rows:
                found.append({"src": row["src"], "rel": row["rel"], "tgt": row["tgt"]})
            if found:
                logger.info("Found %d CHA_CON-like relations in GraphRAG:", len(found))
                for f in found[:15]:
                    logger.info("  %s -[%s]-> %s", f["src"], f["rel"], f["tgt"])
            else:
                logger.info("No matching CHA_CON relations found in GraphRAG for this dynasty.")
            return found
    except Exception as exc:
        logger.warning("GraphRAG cross-check failed: %s", exc)
        return []


def build_dynasty(dynasty_label: str, dry_run: bool, recreate: bool, skip_crosscheck: bool):
    if dynasty_label not in DYNASTIES:
        logger.error("Unknown dynasty '%s'. Use ly, tran, or all.", dynasty_label)
        return 1

    from neo4j import GraphDatabase

    dynasty_name, kings = DYNASTIES[dynasty_label]
    logger.info("=== Building: %s (%d kings) ===", dynasty_name, len(kings))

    # --- Phase 1: Fetch & parse Wikipedia ---
    king_data: list[dict] = []
    unresolved_parents: list[tuple[str, str]] = []
    for king_name, order in kings:
        logger.info("Fetching: %s ...", king_name)
        wikitext = fetch_wikitext(king_name)
        if not wikitext:
            logger.warning("  ✗ No wikitext for '%s' — will create node without details", king_name)
            king_data.append({
                "name": king_name,
                "dynasty": dynasty_name,
                "reign_order": order,
                "parent_raw": None,
                "parent_normalized": None,
                "birth_year": None,
                "death_year": None,
                "reign_start": None,
                "reign_end": None,
                "temple_name": None,
            })
            continue

        info = parse_infobox(wikitext, king_name)
        parent_normalized = None
        if info["parent"]:
            parent_normalized = normalize_parent_name(info["parent"], king_name)
            if not parent_normalized:
                unresolved_parents.append((king_name, info["parent"]))
                logger.info("  Parent '%s' (for %s) not mapped — potential gap", info["parent"], king_name)

        entry = {
            "name": king_name,
            "dynasty": dynasty_name,
            "reign_order": order,
            "parent_raw": info["parent"],
            "parent_normalized": parent_normalized,
            "birth_year": info["birth_year"],
            "death_year": info["death_year"],
            "reign_start": info["reign_start"],
            "reign_end": info["reign_end"],
            "temple_name": info["temple_name"],
        }
        king_data.append(entry)
        logger.info("  ✓ %s%s",
                     king_name,
                     f" → parent: {parent_normalized}" if parent_normalized else "")

    if unresolved_parents:
        logger.info("--- Unresolved parents (%d) ---", len(unresolved_parents))
        for king, parent_raw in unresolved_parents:
            logger.info("  %s: parent '%s' not mapped", king, parent_raw)

    # --- cross-check with GraphRAG ---
    if not skip_crosscheck:
        load_env()
        sys.path.insert(0, str(RAG_SERVICE_DIR))
        from app.config import settings
        try:
            driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
                connection_timeout=10.0,
                connection_acquisition_timeout=15.0,
                max_transaction_retry_time=5.0,
            )
            driver.verify_connectivity()
            crosscheck_with_graph(dynasty_label, driver, settings.neo4j_database)
            driver.close()
        except Exception as exc:
            logger.warning("Neo4j connectivity for cross-check failed: %s", exc)
            logger.info("Skipping cross-check (Neo4j may be cold-starting — retry later)")

    if dry_run:
        logger.info("--- DRY RUN: would write %d RoyalPerson nodes ---", len(king_data))
        return 0

    # --- Phase 2: Write to Neo4j Aura ---
    load_env()
    sys.path.insert(0, str(RAG_SERVICE_DIR))
    from app.config import settings
    from app.graph.graph_client import get_driver, close_driver

    try:
        driver = get_driver()
        driver.verify_connectivity()
        logger.info("Neo4j connected: %s", settings.neo4j_uri)
    except Exception as exc:
        logger.error("Neo4j connection failed (%s): %s", settings.neo4j_uri, exc)
        logger.error("Retry later — Aura may be cold-starting (~30-60s)")
        return 1

    database = settings.neo4j_database

    with driver.session(database=database) as session:
        if recreate:
            logger.info("Recreating: deleting existing :RoyalPerson nodes...")
            session.run("MATCH (p:RoyalPerson) DETACH DELETE p")
            logger.info("  Done.")

        # Constraint
        session.run(
            "CREATE CONSTRAINT royal_name IF NOT EXISTS "
            "FOR (p:RoyalPerson) REQUIRE (p.name, p.dynasty) IS UNIQUE"
        )

        # Write nodes
        for entry in king_data:
            session.run(
                """
                MERGE (p:RoyalPerson {name: $name, dynasty: $dynasty})
                SET p.reignOrder = $reign_order,
                    p.birthYear = $birth_year,
                    p.deathYear = $death_year,
                    p.reignStart = $reign_start,
                    p.reignEnd = $reign_end,
                    p.templeName = $temple_name,
                    p.sourceUrl = $source_url
                """,
                name=entry["name"],
                dynasty=entry["dynasty"],
                reign_order=entry["reign_order"],
                birth_year=entry["birth_year"],
                death_year=entry["death_year"],
                reign_start=entry["reign_start"],
                reign_end=entry["reign_end"],
                temple_name=entry["temple_name"],
                source_url=f"https://vi.wikipedia.org/wiki/{entry['name'].replace(' ', '_')}",
            )

        logger.info("  Wrote %d :RoyalPerson nodes", len(king_data))

        # Write CHA_CON relationships from parent info
        cha_con_count = 0
        for entry in king_data:
            if not entry["parent_normalized"]:
                continue
            # Find the parent node — it may be in the current batch (king's father)
            # or it may be a non-king person (not yet created)
            result = session.run(
                "MATCH (p:RoyalPerson {name: $pname, dynasty: $pdynasty}) "
                "MATCH (c:RoyalPerson {name: $cname, dynasty: $cdynasty}) "
                "MERGE (p)-[:CHA_CON]->(c) "
                "RETURN p.name AS parent_name",
                pname=entry["parent_normalized"],
                pdynasty=entry["dynasty"],
                cname=entry["name"],
                cdynasty=entry["dynasty"],
            )
            if result.single():
                cha_con_count += 1
            else:
                # Parent node doesn't exist — log as gap
                logger.info("  Gap: parent '%s' not found for '%s' (need to create)",
                            entry["parent_normalized"], entry["name"])

        logger.info("  Wrote %d :CHA_CON relationships", cha_con_count)

        # Write KE_VI relationships
        ke_vi_count = 0
        for i in range(len(kings) - 1):
            current_name = kings[i][0]
            next_name = kings[i + 1][0]
            result = session.run(
                "MATCH (a:RoyalPerson {name: $aname, dynasty: $dynasty}) "
                "MATCH (b:RoyalPerson {name: $bname, dynasty: $dynasty}) "
                "MERGE (a)-[:KE_VI]->(b) "
                "RETURN a.name AS aname, b.name AS bname",
                aname=current_name,
                bname=next_name,
                dynasty=dynasty_name,
            )
            if result.single():
                ke_vi_count += 1

        logger.info("  Wrote %d :KE_VI relationships", ke_vi_count)

    close_driver()
    logger.info("=== Done: %s ===", dynasty_name)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Build genealogy from Wikipedia → Neo4j Aura")
    parser.add_argument(
        "--dynasty", choices=list(DYNASTIES) + ["all"], default="all",
        help="Dynasty to build: ly, tran, or all (default: all)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Parse only, don't write to Neo4j")
    parser.add_argument("--recreate", action="store_true", help="Delete existing :RoyalPerson nodes before building")
    parser.add_argument("--skip-crosscheck", action="store_true", help="Skip GraphRAG cross-check")
    args = parser.parse_args()

    dynasties = list(DYNASTIES) if args.dynasty == "all" else [args.dynasty]

    for d in dynasties:
        rc = build_dynasty(d, args.dry_run, args.recreate, args.skip_crosscheck)
        if rc != 0:
            return rc

    if not args.dry_run:
        logger.info("Verification: MATCH (p:RoyalPerson) RETURN p.dynasty, count(*)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
