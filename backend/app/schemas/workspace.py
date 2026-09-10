from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = ''

class WorkspaceUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    status: str
    created_at: datetime
    updated_at: datetime

class MemberAdd(BaseModel):
    email: EmailStr
    role: str = 'member'

class MemberUpdate(BaseModel):
    role: str

class MemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    joined_at: datetime
    status: str
