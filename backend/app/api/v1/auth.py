from fastapi import APIRouter

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse
)

from app.services.auth.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=TokenResponse
)
def register(
    request: RegisterRequest
):

    return AuthService.register(
        name=request.name,
        email=request.email,
        password=request.password
    )


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    request: LoginRequest
):

    return AuthService.login(
        email=request.email,
        password=request.password
    )