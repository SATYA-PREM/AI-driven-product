from __future__ import annotations
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ''

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
