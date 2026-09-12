from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.schemas.auth import UserResponse


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
