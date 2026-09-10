from app.repositories.base_repository import BaseRepository
from app.core.database import products_collection

class ProductRepository(BaseRepository):
    """Repository for product-related MongoDB operations."""

    def __init__(self):
        super().__init__(products_collection)

    def find_by_workspace(self, workspace_id: str, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all products in a specific workspace."""
        return self.find_many({"workspace_id": workspace_id}, skip=skip, limit=limit)

    def find_by_name_in_workspace(self, workspace_id: str, name: str) -> dict | None:
        """Find a product by its name within a specific workspace."""
        return self.find_one({"workspace_id": workspace_id, "name": name})

product_repository = ProductRepository()
