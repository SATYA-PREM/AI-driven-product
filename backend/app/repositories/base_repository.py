from typing import Any
from bson import ObjectId
from pymongo.collection import Collection

class BaseRepository:
    """Base repository class for handling MongoDB operations."""

    def __init__(self, collection: Collection):
        self.collection = collection

    def create(self, document: dict) -> str:
        """Insert a document and return its string ID."""
        result = self.collection.insert_one(document)
        return str(result.inserted_id)

    def find_by_id(self, id: str) -> dict | None:
        """Find a document by its string ObjectId."""
        if not ObjectId.is_valid(id):
            return None
        return self.collection.find_one({"_id": ObjectId(id)})

    # Alias for get_by_id
    get_by_id = find_by_id

    def find_many(self, filter: dict = None, skip: int = 0, limit: int = 20, sort: list | None = None) -> list[dict]:
        """Find documents with pagination and sorting."""
        if filter is None:
            filter = {}
        cursor = self.collection.find(filter).skip(skip).limit(limit)
        if sort:
            cursor = cursor.sort(sort)
        return list(cursor)

    find = find_many

    def count(self, filter: dict = None) -> int:
        """Count documents matching a filter."""
        if filter is None:
            filter = {}
        return self.collection.count_documents(filter)

    def update(self, id: str, update_data: dict) -> bool:
        """Update a document by ID, safely stripping immutable _id and id fields."""
        if not id:
            return False
        clean_data = {k: v for k, v in update_data.items() if k not in ["_id", "id"]}
        if ObjectId.is_valid(id):
            result = self.collection.update_one({"_id": ObjectId(id)}, {"$set": clean_data})
            if result.matched_count > 0:
                return True
        result = self.collection.update_one(
            {"$or": [{"_id": id}, {"id": id}]},
            {"$set": clean_data}
        )
        return result.matched_count > 0

    def delete(self, id: str) -> bool:
        """Delete a document by ID."""
        if not ObjectId.is_valid(id):
            return False
        result = self.collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0

    def find_one(self, filter: dict) -> dict | None:
        """Find a single document matching a filter."""
        return self.collection.find_one(filter)
