from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = "member"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool = True
    created_at: datetime | str | None = None

class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
