"""Opaque cursor pagination helpers (id-based, not page numbers)."""

import base64
import json

from rest_framework.request import Request

DEFAULT_LIMIT = 25
MAX_LIMIT = 100


def parse_limit(request: Request, default: int = DEFAULT_LIMIT) -> int:
    raw = request.query_params.get("limit") or request.query_params.get("pageSize")
    try:
        value = int(raw) if raw else default
    except (TypeError, ValueError):
        value = default
    return min(MAX_LIMIT, max(1, value))


def encode_cursor(value) -> str:
    payload = json.dumps({"id": value}, separators=(",", ":"), default=str)
    return base64.urlsafe_b64encode(payload.encode()).decode()


def decode_cursor(raw: str | None):
    if not raw:
        return None
    try:
        padded = raw + "=" * (-len(raw) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        return data.get("id")
    except Exception:
        return None


def paginate_queryset(qs, request: Request, *, lookup: str = "pk"):
    limit = parse_limit(request)
    cursor = decode_cursor(request.query_params.get("cursor"))
    qs = qs.order_by(f"-{lookup}")
    if cursor is not None:
        qs = qs.filter(**{f"{lookup}__lt": cursor})
    rows = list(qs[: limit + 1])
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor(getattr(rows[-1], lookup)) if has_more and rows else None
    return rows, next_cursor, limit


def paginate_sequence(items: list, request: Request, *, id_getter):
    limit = parse_limit(request)
    cursor = decode_cursor(request.query_params.get("cursor"))
    if cursor is not None:
        start = 0
        found = False
        for index, item in enumerate(items):
            if str(id_getter(item)) == str(cursor):
                start = index + 1
                found = True
                break
        items = items[start:] if found else items
    page = items[:limit]
    has_more = len(items) > limit
    next_cursor = encode_cursor(id_getter(page[-1])) if has_more and page else None
    return page, next_cursor, limit
