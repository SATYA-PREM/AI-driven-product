"""
date_utils.py
--------------
Date parsing, formatting, and validation utilities.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


# Common date formats we attempt to parse
DATE_FORMATS: list[str] = [
    "%Y-%m-%d",       # 2026-08-20
    "%m/%d/%Y",       # 08/20/2026
    "%d/%m/%Y",       # 20/08/2026
    "%Y/%m/%d",       # 2026/08/20
    "%Y-%m-%dT%H:%M:%S",      # ISO with time
    "%Y-%m-%dT%H:%M:%SZ",     # ISO with Z
    "%Y-%m-%d %H:%M:%S",      # datetime with space
    "%m-%d-%Y",       # 08-20-2026
    "%d-%m-%Y",       # 20-08-2026
    "%b %d, %Y",      # Aug 20, 2026
    "%B %d, %Y",      # August 20, 2026
]

# Standard output format
ISO_DATE_FORMAT: str = "%Y-%m-%d"


def now_utc() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def parse_date(raw_date: str) -> Optional[str]:
    """
    Try to parse a date string using common formats.
    Returns ISO format (YYYY-MM-DD) on success, None on failure.
    """
    if not raw_date or not raw_date.strip():
        return None

    cleaned = raw_date.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).strftime(ISO_DATE_FORMAT)
        except ValueError:
            continue

    return None


def normalize_date(raw_date: str) -> str:
    """
    Normalize a date string to YYYY-MM-DD format.
    Falls back to the raw (stripped) value if no format matches.
    """
    parsed = parse_date(raw_date)
    return parsed if parsed else raw_date.strip()


def is_valid_date(raw_date: str) -> bool:
    """Check whether a date string can be parsed into a known format."""
    return parse_date(raw_date) is not None
