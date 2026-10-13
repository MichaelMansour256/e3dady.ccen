"""Ingest Arabic Bible verses into Supabase pgvector.

Input JSON is an array of objects with book, chapter, verse, text, and optional
book_en/testament/text_plain fields. Use only a legally obtained Van Dyck
dataset. Example:
  python scripts/ingest_bible.py data/bible.json
"""
from __future__ import annotations

import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

BATCH_SIZE = 500
ARABIC_MARKS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")
ARABIC_NORMALIZATION = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه"})
CHAPTER_COUNTS = [
    50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42,
    150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14,
    4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1,
    13, 5, 5, 3, 5, 1, 1, 1, 22,
]


def plain_arabic(value: str) -> str:
    value = ARABIC_MARKS.sub("", value)
    value = value.translate(ARABIC_NORMALIZATION)
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
        body = response.read()
        return json.loads(body) if body else None


def load_getbible_rows() -> list[dict[str, Any]]:
    bulk_request = urllib.request.Request(
        "https://api.getbible.net/v2/arabicsv.json",
        headers={"User-Agent": "e3dady-bible-rag-ingester/1.0"},
    )
    try:
        with urllib.request.urlopen(bulk_request, timeout=180) as response:
            payload = json.loads(response.read())
        if payload.get("translation") != "Smith and Van Dyke" or payload.get("lang") != "ar":
            raise RuntimeError("Bulk Bible source is not the expected Arabic Smith and Van Dyke translation.")
        rows = [
            {
                "book_nr": book_nr,
                "book": book.get("name") or str(book_nr),
                "chapter": chapter["chapter"],
                "verse": verse["verse"],
                "text": verse["text"],
                "testament": "NT" if book_nr >= 40 else "OT",
            }
            for book_nr, book in enumerate(payload.get("books", []), start=1)
            for chapter in book.get("chapters", [])
            for verse in chapter.get("verses", [])
        ]
        if len(rows) >= 30000:
            print(f"Loaded {len(rows)} verses from the bulk Smith and Van Dyck dataset", file=sys.stderr)
            return rows
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        print("Bulk Bible download failed; falling back to chapter requests", file=sys.stderr)

    def fetch_chapter(item: tuple[int, int]) -> list[dict[str, Any]]:
        book_nr, chapter = item
        endpoint = f"https://api.getbible.net/v2/arabicsv/{book_nr}/{chapter}.json"
        request = urllib.request.Request(
            endpoint,
            headers={"User-Agent": "e3dady-bible-rag-ingester/1.0"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = json.loads(response.read())
        except urllib.error.HTTPError as error:
            raise RuntimeError(
                f"Bible source request failed for book {book_nr}, chapter {chapter}: "
                f"HTTP {error.code}"
            ) from error
        return [{
            "book_nr": book_nr,
            "book": payload.get("book_name") or str(book_nr),
            "chapter": chapter,
            "verse": verse["verse"],
            "text": verse["text"],
            "testament": "NT" if book_nr >= 40 else "OT",
        } for verse in payload.get("verses", [])]

    chapters = [
        (book_nr, chapter)
        for book_nr, chapter_count in enumerate(CHAPTER_COUNTS, start=1)
        for chapter in range(1, chapter_count + 1)
    ]
    rows: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = [executor.submit(fetch_chapter, item) for item in chapters]
        for index, future in enumerate(as_completed(futures), start=1):
            rows.extend(future.result())
            if index % 50 == 0 or index == len(futures):
                print(f"Loaded {index}/{len(futures)} chapters", file=sys.stderr)
    return sorted(rows, key=lambda row: (int(row["book_nr"]), int(row["chapter"]), int(row["verse"])))


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
    if len(sys.argv) not in {2, 3} or not sys.argv[1]:
        raise SystemExit("Usage: python scripts/ingest_bible.py path/to/bible.json|csv|--getbible [--text-only]")
    text_only = len(sys.argv) == 3 and sys.argv[2] == "--text-only"
    url, key, openrouter_key = os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"), os.getenv("OPENROUTER_API_KEY")
    if not url or not key or (not openrouter_key and not text_only):
        raise SystemExit("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENROUTER_API_KEY (unless using --text-only).")
    rows = load_getbible_rows() if sys.argv[1] == "--getbible" else load_rows(Path(sys.argv[1]))
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "resolution=merge-duplicates"}
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        texts = [str(row.get("text") or row.get("text_ar") or "").strip() for row in batch]
        vectors = [None] * len(texts) if text_only else embeddings(texts, openrouter_key)
        model = os.getenv("OPENROUTER_EMBEDDING_MODEL", "openai/text-embedding-3-small")
        dimensions = len(vectors[0]) if vectors and vectors[0] else 0
        if not text_only and dimensions != 1536:
            raise SystemExit(
                f"Embedding model returned {dimensions} dimensions; Supabase expects 1536. "
                "Choose a compatible OPENROUTER_EMBEDDING_MODEL or migrate the vector column."
            )
        records = []
        for row, text, vector in zip(batch, texts, vectors):
            if not text:
                continue
            book = str(row["book"]).strip()
            chapter, verse = int(row["chapter"]), str(row["verse"]).strip()
            testament = str(row.get("testament") or ("NT" if int(row.get("book_nr", 0)) >= 40 else "OT")).upper()
            record = {
                "id": f"{row.get('book_nr', book)}-{chapter}-{verse}",
                "book": book, "book_en": row.get("book_en"), "chapter": chapter, "verse": verse,
                "testament": testament, "text_ar": text,
                "text_ar_plain": row.get("text_plain") or plain_arabic(text), "embedding": vector,
            }
            if os.getenv("BIBLE_RAG_STORE_METADATA", "").lower() in {"1", "true", "yes"}:
                record["embedding_model"] = model
                record["embedding_dimensions"] = dimensions
            records.append(record)
        post(f"{url}/rest/v1/bible_verses", headers, records)
        print(f"Upserted {min(start + BATCH_SIZE, len(rows))}/{len(rows)} verses")


if __name__ == "__main__":
    main()
