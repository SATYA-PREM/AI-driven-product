from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import List

from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.product.product_service import product_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(prefix="/products", tags=["2. Workspaces & Products"], dependencies=[Depends(get_current_user)])


@router.post("/", response_model=ProductResponse)
def create_product(body: ProductCreate, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, body.workspace_id, Permission.CREATE_PRODUCT)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = product_service.create_product(
        workspace_id=body.workspace_id,
        name=body.name,
        description=body.description,
        category=body.category,
        created_by=user_id
    )
    return serialize_document(result)


@router.get("/", response_model=List[ProductResponse])
def list_products(workspace_id: str = Query(...), current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    results = product_service.list_products(workspace_id)
    return serialize_documents(results)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, current_user=Depends(get_current_user)):
    result = product_service.get_product(product_id)
    permission_service.require_permission(current_user, result.get("workspace_id", ""), Permission.VIEW_WORKSPACE)
    return serialize_document(result)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, body: ProductUpdate, current_user=Depends(get_current_user)):
    result = product_service.get_product(product_id)
    permission_service.require_permission(current_user, result.get("workspace_id", ""), Permission.UPDATE_WORKSPACE)
    update_dict = body.model_dump(exclude_unset=True)
    updated_result = product_service.update_product(product_id, update_dict)
    return serialize_document(updated_result)
