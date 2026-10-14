"""Resumable OpenRouter embedding backfill for existing Bible rows.

This script only reads rows whose embedding is NULL and PATCHes the vector
back to the same primary key. It never recreates or deletes Bible records.

Examples:
  python scripts/backfill_bible_embeddings.py --limit 10
  python scripts/backfill_bible_embeddings.py
  python scripts/backfill_bible_embeddings.py --dry-run
  python scripts/backfill_bible_embeddings.py --verify
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/text-embedding-3-small"
EXPECTED_DIMENSIONS = 1536
PROVIDER_BATCH_SIZE = 64
READ_BATCH_SIZE = 100
MAX_RETRIES = 4
WRITE_WORKERS = 8
PROVIDER_WORKERS = 4


def env(name: str, required: bool = True) -> str:
    value = os.getenv(name, "").strip()
    if required and not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def request_json(
    url: str,
    *,
    headers: dict[str, str],
    method: str = "GET",
    payload: Any | None = None,
) -> tuple[int, bytes, dict[str, str]]:
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode()
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.status, response.read(), dict(response.headers.items())


def with_retry(operation: str, callback):
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            return callback()
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error
            status = getattr(error, "code", None)
            if status is not None and status not in {408, 409, 429, 500, 502, 503, 504}:
                raise
            if attempt == MAX_RETRIES - 1:
                break
            delay = min(30, 2**attempt)
            print(f"{operation} transient failure; retrying in {delay}s", flush=True)
            time.sleep(delay)
    raise RuntimeError(f"{operation} failed after {MAX_RETRIES} attempts") from last_error


def supabase_headers(key: str) -> dict[str, str]:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def count_rows(base_url: str, key: str, filter_expression: str) -> int:
    url = (
        f"{base_url}/rest/v1/bible_verses?select=id&{filter_expression}"
        "&limit=1"
    )
    headers = {**supabase_headers(key), "Prefer": "count=exact"}
    _, _, response_headers = with_retry(
        "Supabase count",
        lambda: request_json(url, headers=headers, method="HEAD"),
    )
    content_range = response_headers.get("Content-Range", "")
    try:
        return int(content_range.rsplit("/", 1)[1])
    except (IndexError, ValueError) as error:
        raise RuntimeError("Supabase did not return a usable Content-Range count") from error


def read_missing(base_url: str, key: str, limit: int) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode({
        "select": "id,text_ar",
        "embedding": "is.null",
        "order": "id.asc",
        "limit": str(limit),
    })
    url = f"{base_url}/rest/v1/bible_verses?{query}"
    status, body, _ = with_retry(
        "Supabase read",
        lambda: request_json(url, headers=supabase_headers(key)),
    )
    if status != 200:
        raise RuntimeError(f"Supabase read returned HTTP {status}")
    rows = json.loads(body)
    if not isinstance(rows, list):
        raise RuntimeError("Supabase returned an invalid verse list")
    return rows


def create_embeddings(
    base_url: str,
    key: str,
    model: str,
    texts: list[str],
) -> list[list[float]]:
    url = f"{base_url}/embeddings"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("NEXT_PUBLIC_SITE_URL", ""),
        "X-Title": "E3dady Bible RAG",
    }
    payload = {"model": model, "input": texts}

    def call() -> list[list[float]]:
        status, body, _ = request_json(url, headers=headers, method="POST", payload=payload)
        if status != 200:
            raise RuntimeError(f"OpenRouter embeddings returned HTTP {status}")
        response = json.loads(body)
        items = response.get("data")
        if not isinstance(items, list) or len(items) != len(texts):
            raise RuntimeError("OpenRouter returned an incomplete embedding batch")
        items = sorted(items, key=lambda item: item.get("index", -1))
        vectors = [item.get("embedding") for item in items]
        if any(not isinstance(vector, list) or len(vector) != EXPECTED_DIMENSIONS for vector in vectors):
            raise RuntimeError(
                f"OpenRouter returned an incompatible vector; expected {EXPECTED_DIMENSIONS} dimensions"
            )
        return vectors

    return with_retry("OpenRouter embedding batch", call)


def persist_one(base_url: str, key: str, row_id: str, vector: list[float]) -> None:
    encoded_id = urllib.parse.quote(row_id, safe="")
    url = f"{base_url}/rest/v1/bible_verses?id=eq.{encoded_id}"
    payload = {"embedding": vector}
    headers = {**supabase_headers(key), "Prefer": "return=representation"}
    status, body, _ = with_retry(
        f"Supabase write {row_id}",
        lambda: request_json(url, headers=headers, method="PATCH", payload=payload),
    )
    if status not in {200, 204}:
        raise RuntimeError(f"Supabase write returned HTTP {status} for {row_id}")
    if status == 200:
        updated = json.loads(body)
        if not isinstance(updated, list) or not updated:
            raise RuntimeError(f"Supabase did not update verse {row_id}")


def embed_batch(
    base_url: str,
    key: str,
    model: str,
    batch: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[list[float]]]:
    texts = [str(row.get("text_ar") or "").strip() for row in batch]
    if any(not text for text in texts):
        raise RuntimeError("A verse with a missing text_ar value was returned")
    return batch, create_embeddings(base_url, key, model, texts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Maximum verses to process; 0 means all")
    parser.add_argument("--dry-run", action="store_true", help="Validate configuration and show counts only")
    parser.add_argument("--verify", action="store_true", help="Show total, embedded, and missing counts")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    supabase_url = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    supabase_key = env("SUPABASE_SERVICE_ROLE_KEY")
    openrouter_key = env("OPENROUTER_API_KEY")
    openrouter_url = os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    model = os.getenv("OPENROUTER_EMBEDDING_MODEL", DEFAULT_MODEL)

    total = count_rows(supabase_url, supabase_key, "id=not.is.null")
    missing = count_rows(supabase_url, supabase_key, "embedding=is.null")
    embedded = count_rows(supabase_url, supabase_key, "embedding=not.is.null")
    print(f"model={model} expected_dimensions={EXPECTED_DIMENSIONS}")
    print(f"total={total} embedded={embedded} missing={missing}")

    if args.verify or args.dry_run:
        return
    if not missing:
        print("Nothing to backfill.")
        return

    target = min(missing, args.limit) if args.limit > 0 else missing
    processed = successful = failed = 0
    failed_ids: list[str] = []

    while processed < target:
        rows = read_missing(supabase_url, supabase_key, min(READ_BATCH_SIZE, target - processed))
        if not rows:
            break
        batches = [
            rows[start:start + PROVIDER_BATCH_SIZE]
            for start in range(0, len(rows), PROVIDER_BATCH_SIZE)
        ]
        with ThreadPoolExecutor(max_workers=PROVIDER_WORKERS) as provider_executor:
            provider_futures = [
                provider_executor.submit(embed_batch, openrouter_url, openrouter_key, model, batch)
                for batch in batches
            ]
            with ThreadPoolExecutor(max_workers=WRITE_WORKERS) as write_executor:
                for provider_future in as_completed(provider_futures):
                    try:
                        batch, vectors = provider_future.result()
                    except Exception as error:  # noqa: BLE001 - report every batch ID
                        batch = batches[provider_futures.index(provider_future)]
                        failed_ids.extend(str(row["id"]) for row in batch)
                        failed += len(batch)
                        processed += len(batch)
                        print(
                            f"FAILED batch size={len(batch)}: {type(error).__name__}",
                            flush=True,
                        )
                        continue
                    futures = {
                        write_executor.submit(
                            persist_one, supabase_url, supabase_key, str(row["id"]), vector
                        ): str(row["id"])
                        for row, vector in zip(batch, vectors)
                    }
                    for future in as_completed(futures):
                        row_id = futures[future]
                        processed += 1
                        try:
                            future.result()
                            successful += 1
                        except Exception as error:  # noqa: BLE001 - report each failed ID and continue
                            failed += 1
                            failed_ids.append(row_id)
                            print(f"FAILED id={row_id}: {type(error).__name__}", flush=True)
            print(f"processed={processed}/{target} successful={successful} failed={failed}", flush=True)

    remaining = count_rows(supabase_url, supabase_key, "embedding=is.null")
    print(f"complete processed={processed} successful={successful} failed={failed} remaining={remaining}")
    if failed_ids:
        print(f"failed_ids={','.join(failed_ids)}")
        raise SystemExit(2)


if __name__ == "__main__":
    main()
