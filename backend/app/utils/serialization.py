"""
serialization.py
------------------
MongoDB document serialization and deserialization utilities.
"""

from __future__ import annotations

from datetime import datetime, timezone
from bson import ObjectId
from typing import Any


def serialize_document(doc: dict) -> dict:
    """
    Serialize a MongoDB document for API response:
    - Convert ObjectId _id to string id
    - Convert datetime objects to ISO strings
    - Recursively handle nested dicts and lists
    """
    if doc is None:
        return doc

    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_document(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_document(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item.isoformat() if isinstance(item, datetime)
                else item
                for item in value
            ]
        else:
            result[key] = value

    return result


def serialize_documents(docs: list[dict]) -> list[dict]:
    """Serialize a list of MongoDB documents."""
    return [serialize_document(doc) for doc in docs]


def deserialize_id(id_str: str) -> ObjectId:
    """Convert a string ID back to an ObjectId for MongoDB queries."""
    if not ObjectId.is_valid(id_str):
        raise ValueError(f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)


def prepare_update(data: dict) -> dict:
    """
    Prepare a dict for MongoDB $set update:
    - Remove None values (don't update fields not provided)
    - Add updated_at timestamp
    """
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    return update_data


def paginate_query(
    skip: int = 0,
    limit: int = 20,
    max_limit: int = 100,
) -> tuple[int, int]:
    """
    Validate and normalize pagination parameters.
    Returns (skip, limit) tuple.
    """
    skip = max(0, skip)
    limit = max(1, min(limit, max_limit))
    return skip, limit
