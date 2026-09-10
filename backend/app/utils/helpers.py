"""
helpers.py
-----------
General-purpose utility functions used across the application.
"""

from __future__ import annotations

from bson import ObjectId


def to_str_id(document: dict) -> dict:
    """
    Convert MongoDB _id (ObjectId) to a string 'id' field.
    Returns a new dict — does not mutate the input.
    """
    if document is None:
        return document
    doc = dict(document)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def to_str_ids(documents: list[dict]) -> list[dict]:
    """Convert _id to string id for a list of documents."""
    return [to_str_id(doc) for doc in documents]


def is_valid_object_id(value: str) -> bool:
    """Check whether a string is a valid MongoDB ObjectId."""
    return ObjectId.is_valid(value)


def ensure_object_id(value: str) -> ObjectId:
    """
    Convert a string to ObjectId.
    Raises ValueError if the string is not a valid ObjectId.
    """
    if not ObjectId.is_valid(value):
        raise ValueError(f"Invalid ObjectId: {value}")
    return ObjectId(value)


def safe_int(value, default: int = 0) -> int:
    """Safely convert a value to int, returning default on failure."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value, default: float = 0.0) -> float:
    """Safely convert a value to float, returning default on failure."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def truncate_string(text: str, max_length: int = 200) -> str:
    """Truncate a string to max_length, appending '...' if truncated."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."
