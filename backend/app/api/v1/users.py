from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.middleware.auth_middleware import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.core.exceptions import DuplicateError
from app.core.security import hash_password
from app.core.database import users_collection
from app.models.user import UserModel
from app.repositories.user_repository import user_repository
from app.utils.serialization import serialize_document, serialize_documents


router = APIRouter(
    prefix="/users",
    tags=["1. Authentication & Users"]
)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user=Depends(get_current_user)
):
    return {
        "id": str(current_user.get("id") or current_user.get("_id", "")),
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "member"),
        "is_active": current_user.get("is_active", True)
    }


@router.get("", response_model=List[UserResponse], summary="List all platform users")
def list_users(
    search: Optional[str] = Query(None, description="Search users by name or email"),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(get_current_user)
):
    """List system users. Useful for selecting users to add to a workspace."""
    query = {"is_active": True}
    if search:
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}}
        ]
    docs = list(users_collection.find(query).limit(limit))
    return serialize_documents(docs)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Add New Member / Register Platform User")
def create_user(
    body: UserCreate,
    current_user=Depends(get_current_user)
):
    """
    Creates a new platform user with name, email, password and system role.
    Note: This creates the user in the system pool but DOES NOT grant workspace access.
    Workspace access is granted separately via 'Add Member to Workspace'.
    """
    clean_email = body.email.strip().lower()
    existing = user_repository.get_by_email(clean_email)
    if existing:
        raise DuplicateError(f"A user with email '{clean_email}' already exists in the system.")

    hashed_pwd = hash_password(body.password)
    user_doc = UserModel.create_document(
        name=body.name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
        hashed_password=hashed_pwd,
        role=body.role,
        is_active=True
    )
    res = users_collection.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    return serialize_document(user_doc)

