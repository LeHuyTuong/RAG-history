#!/usr/bin/env python3
"""
Migrate graph từ Neo4j LOCAL (docker) → Neo4j CLOUD (Aura).

Đọc toàn bộ Entity + REL (+ Chunk markers) từ local, MERGE sang cloud theo batch.
MERGE nên chạy lại an toàn (idempotent) — không tạo trùng.

Cách dùng (chạy từ rag-service/):
  # target lấy từ .env (NEO4J_* = Aura). source mặc định local docker:
  .venv/bin/python scripts/migrate_graph_to_cloud.py \
      --source-uri bolt://localhost:7687 \
      --source-pass <mật_khẩu_local>

  # hoặc chỉ định target rõ ràng:
  .venv/bin/python scripts/migrate_graph_to_cloud.py \
      --source-uri bolt://localhost:7687 --source-pass <local> \
      --target-uri neo4j+ssc://xxxx.databases.neo4j.io --target-pass <aura>

Mặc định target = settings.neo4j_* (đọc từ .env). Cần .env trỏ Aura với mật khẩu ĐÚNG.
"""
from __future__ import annotations

import argparse
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate graph local → Aura cloud.")
    parser.add_argument("--source-uri", default="bolt://localhost:7687")
    parser.add_argument("--source-user", default="neo4j")
    parser.add_argument("--source-pass", required=True, help="mật khẩu Neo4j local")
    parser.add_argument("--target-uri", default=None, help="mặc định lấy từ .env NEO4J_URI (Aura)")
    parser.add_argument("--target-user", default=None)
    parser.add_argument("--target-pass", default=None)
    parser.add_argument("--batch", type=int, default=500)
    parser.add_argument("--wipe-target", action="store_true", help="xóa sạch target trước khi copy")
    args = parser.parse_args()

    load_env()
    sys.path.insert(0, str(RAG_SERVICE_DIR))
    from app.config import settings
    from neo4j import GraphDatabase

    target_uri = args.target_uri or settings.neo4j_uri
    target_user = args.target_user or settings.neo4j_user
    target_pass = args.target_pass or settings.neo4j_password
    target_db = settings.neo4j_database

    print(f"SOURCE : {args.source_uri}")
    print(f"TARGET : {target_uri} (db={target_db})")

    src = GraphDatabase.driver(args.source_uri, auth=(args.source_user, args.source_pass))
    tgt = GraphDatabase.driver(target_uri, auth=(target_user, target_pass))
    try:
        src.verify_connectivity()
    except Exception as exc:
        print(f"ERROR: không kết nối SOURCE local: {str(exc)[:150]}", file=sys.stderr)
        return 1
    try:
        tgt.verify_connectivity()
    except Exception as exc:
        print(f"ERROR: không kết nối TARGET Aura (kiểm tra mật khẩu .env): {str(exc)[:150]}", file=sys.stderr)
        return 1
    print("Kết nối 2 đầu OK ✓\n")

    # Schema trên target
    with tgt.session(database=target_db) as s:
        if args.wipe_target:
            print("!! --wipe-target: xóa sạch graph trên Aura")
            s.run("MATCH (n) DETACH DELETE n")
        s.run("CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE")
        s.run("CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.pointId IS UNIQUE")

    # 1) Entities
    with src.session(database="neo4j") as ss:
        entities = [dict(r["e"]) for r in ss.run("MATCH (e:Entity) RETURN e")]
    print(f"Entities: {len(entities)} → copy...")
    _batch_write(tgt, target_db, args.batch, entities,
                 "UNWIND $rows AS row MERGE (e:Entity {name: row.name}) SET e.type = row.type")

    # 2) Relations
    with src.session(database="neo4j") as ss:
        rels = [{"src": r["a"], "tgt": r["b"], "type": r["t"],
                 "context": r["ctx"], "page": r["pg"], "docId": r["doc"]}
                for r in ss.run(
                    "MATCH (a:Entity)-[r:REL]->(b:Entity) "
                    "RETURN a.name AS a, b.name AS b, r.type AS t, "
                    "r.context AS ctx, r.page AS pg, r.docId AS doc")]
    print(f"Relations: {len(rels)} → copy...")
    _batch_write(tgt, target_db, args.batch, rels,
                 "UNWIND $rows AS row "
                 "MERGE (a:Entity {name: row.src}) MERGE (b:Entity {name: row.tgt}) "
                 "MERGE (a)-[r:REL {type: row.type}]->(b) "
                 "SET r.context=row.context, r.page=row.page, r.docId=row.docId")

    # 3) Chunk markers (để có thể resume build trên cloud nếu cần)
    with src.session(database="neo4j") as ss:
        chunks = [dict(r["c"]) for r in ss.run("MATCH (c:Chunk) RETURN c")]
    print(f"Chunks: {len(chunks)} → copy...")
    _batch_write(tgt, target_db, args.batch, chunks,
                 "UNWIND $rows AS row MERGE (c:Chunk {pointId: row.pointId}) "
                 "SET c.docId=row.docId, c.page=row.page, c.processed=row.processed")

    # Verify
    with tgt.session(database=target_db) as s:
        n = s.run("MATCH (e:Entity) RETURN count(e) AS c").single()["c"]
        r = s.run("MATCH ()-[r:REL]->() RETURN count(r) AS c").single()["c"]
    print(f"\n✓ XONG. Aura giờ có: {n} entities, {r} relations")
    src.close()
    tgt.close()
    return 0


def _batch_write(driver, db, batch_size, rows, cypher):
    with driver.session(database=db) as s:
        for i in range(0, len(rows), batch_size):
            chunk = rows[i:i + batch_size]
            s.run(cypher, rows=chunk)
            print(f"  ... {min(i + batch_size, len(rows))}/{len(rows)}", end="\r", flush=True)
    print()


if __name__ == "__main__":
    sys.exit(main())
