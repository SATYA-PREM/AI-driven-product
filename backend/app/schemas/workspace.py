from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, EmailStr, model_validator


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

MemberCreate = MemberAdd

class MemberUpdate(BaseModel):
    role: str


class MemberResponse(BaseModel):
    id: str | None = None
    workspace_id: str | None = None
    user_id: str
    name: str = ""
    email: str = ""
    user_name: str | None = None
    user_email: str | None = None
    role: str = "member"
    joined_at: datetime | None = None
    status: str = "active"
    permissions: list[str] = Field(default_factory=list)
    added_by: str | None = None

    @model_validator(mode="before")
    @classmethod
    def sync_name_and_email(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("name") and values.get("user_name"):
                values["name"] = values["user_name"]
            if not values.get("email") and values.get("user_email"):
                values["email"] = values["user_email"]
            if not values.get("user_name") and values.get("name"):
                values["user_name"] = values["name"]
            if not values.get("user_email") and values.get("email"):
                values["user_email"] = values["email"]
        return values
