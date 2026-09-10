from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
