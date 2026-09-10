"""
cleaner.py
-------------
Cleaning takes rows that already PASSED validation and normalizes
them into a consistent shape. This never runs on invalid rows --
by the time data gets here, we already know it's usable.

Example:
    "VERY SLOW CHECKOUT!!!"  ->  "very slow checkout"
    "08/20/2026"              ->  "2026-08-20"
"""

import re
from datetime import datetime


def normalize_text(text: str) -> str:
    """Lowercases, strips extra punctuation noise, and collapses whitespace."""
    text = text.strip().lower()
    text = re.sub(r"[!]{2,}", "", text)     # "!!!"  ->  ""
    text = re.sub(r"\s+", " ", text)         # multiple spaces/newlines -> one space
    return text.strip()


def normalize_date(raw_date: str) -> str:
    """Converts common date formats into YYYY-MM-DD. Falls back to the raw value if unrecognized."""
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw_date.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw_date.strip()


def clean_row(row: dict) -> dict:
    """
    Takes one already-valid row and returns a cleaned version.
    Only call this on rows where validate_row() returned is_valid=True.
    """
    return {
        "customer_id": row["customer_id"].strip(),
        "rating": int(row["rating"]),
        "feedback": normalize_text(row["feedback"]),
        "date": normalize_date(row["date"]),
    }


def clean_rows(valid_rows: list[dict]) -> list[dict]:
    """Cleans a list of already-valid rows. Simple wrapper for readability in pipeline.py."""
    return [clean_row(row) for row in valid_rows]
