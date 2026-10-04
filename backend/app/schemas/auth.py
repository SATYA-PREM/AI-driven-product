from typing import Union
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: str = Field(
        ...,
        min_length=3,
        max_length=120
    )

    password: str = Field(
        ...,
        min_length=3,
        max_length=128
    )


class LoginRequest(BaseModel):

    email: str = Field(
        ...,
        min_length=3,
        max_length=120
    )

    password: str


class UserResponse(BaseModel):

    id: str
    name: str
    email: str
    role: str
    is_active: bool


class TokenResponse(BaseModel):

    access_token: str
    token_type: str
    user: UserResponse