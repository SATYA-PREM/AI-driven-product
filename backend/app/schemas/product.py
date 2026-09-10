from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    workspace_id: str
    name: str = Field(..., min_length=2, max_length=100)
    description: str = ''
    category: str = ''

class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    category: str | None = None

class ProductResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str
    category: str
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime
