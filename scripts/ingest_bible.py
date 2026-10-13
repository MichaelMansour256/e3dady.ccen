"""Ingest Arabic Bible verses into Supabase pgvector.

Input JSON is an array of objects with book, chapter, verse, text, and optional
book_en/testament/text_plain fields. Use only a legally obtained Van Dyck
dataset. Example:
  python scripts/ingest_bible.py data/bible.json
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

BATCH_SIZE = 100
ARABIC_MARKS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")


def plain_arabic(value: str) -> str:
    value = ARABIC_MARKS.sub("", value)
    return re.sub(r"\s+", " ", value).strip()


def load_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data["verses"] if isinstance(data, dict) else data


def post(url: str, headers: dict[str, str], payload: Any) -> Any:
    request = urllib.request.Request(
        url, data=json.dumps(payload, ensure_ascii=False).encode(),
        headers={**headers, "Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read())


def embeddings(texts: list[str], key: str) -> list[list[float]]:
    result = post(
        f"{os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')}/embeddings",
        {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": os.getenv("NEXT_PUBLIC_SITE_URL", ""),
            "X-Title": "E3dady Bible RAG",
        },
        {"model": os.getenv("OPENROUTER_EMBEDDING_MODEL", "openai/text-embedding-3-small"), "input": texts},
    )
    return [item["embedding"] for item in sorted(result["data"], key=lambda item: item["index"])]


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/ingest_bible.py path/to/bible.json|csv")
    source = Path(sys.argv[1])
    url, key, openrouter_key = os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"), os.getenv("OPENROUTER_API_KEY")
    if not url or not key or not openrouter_key:
        raise SystemExit("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENROUTER_API_KEY.")
    rows = load_rows(source)
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "resolution=merge-duplicates"}
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        texts = [str(row.get("text") or row.get("text_ar") or "").strip() for row in batch]
        vectors = embeddings(texts, openrouter_key)
        records = []
        for row, text, vector in zip(batch, texts, vectors):
            if not text:
                continue
            book = str(row["book"]).strip()
            chapter, verse = int(row["chapter"]), str(row["verse"]).strip()
            testament = str(row.get("testament") or ("NT" if int(row.get("book_nr", 0)) >= 40 else "OT")).upper()
            records.append({
                "id": f"{row.get('book_nr', book)}-{chapter}-{verse}",
                "book": book, "book_en": row.get("book_en"), "chapter": chapter, "verse": verse,
                "testament": testament, "text_ar": text,
                "text_ar_plain": row.get("text_plain") or plain_arabic(text), "embedding": vector,
            })
        post(f"{url}/rest/v1/bible_verses", headers, records)
        print(f"Upserted {min(start + BATCH_SIZE, len(rows))}/{len(rows)} verses")


if __name__ == "__main__":
    main()
