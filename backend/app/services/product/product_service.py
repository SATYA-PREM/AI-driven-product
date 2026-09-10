from __future__ import annotations

from app.repositories.product_repository import product_repository
from app.models.product import ProductModel
from app.core.exceptions import NotFoundError, DuplicateError
from app.utils.serialization import serialize_document

class ProductService:
    """Service for handling product CRUD operations scoped to workspaces."""

    @staticmethod
    def create_product(workspace_id: str, name: str, description: str, category: str, created_by: str) -> dict:
        """Create a new product within a workspace."""
        existing = product_repository.find_one({"workspace_id": workspace_id, "name": name})
        if existing:
            raise DuplicateError(f"Product with name '{name}' already exists in this workspace.")

        product_doc = ProductModel.create_document(
            workspace_id=workspace_id,
            name=name,
            description=description,
            category=category,
            created_by=created_by
        )
        product_repository.create(product_doc)
        return serialize_document(product_doc)

    @staticmethod
    def get_product(product_id: str) -> dict:
        """Retrieve a product by ID."""
        product = product_repository.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product with ID {product_id} not found.")
        return serialize_document(product)

    @staticmethod
    def list_products(workspace_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """List products for a specific workspace."""
        products = product_repository.find({"workspace_id": workspace_id}, skip=skip, limit=limit)
        return [serialize_document(p) for p in products]

    @staticmethod
    def update_product(product_id: str, update_data: dict) -> dict:
        """Update an existing product."""
        success = product_repository.update(product_id, update_data)
        if not success:
            raise NotFoundError(f"Product with ID {product_id} not found.")
        return ProductService.get_product(product_id)

product_service = ProductService()
