from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import PaginatedResponse

class DatasetResponse(BaseModel):
    id: str
    workspace_id: str
    product_id: str
    filename: str
    dataset_name: str | None = None
    name: str | None = None
    format: str
    source_type: str
    file_size: int
    record_count: int
    status: str
    uploaded_by: str
    created_at: datetime

class DatasetUpdateRequest(BaseModel):
    name: str | None = None
    filename: str | None = None
    description: str | None = None
    source_type: str | None = None

class DatasetListResponse(PaginatedResponse[DatasetResponse]):
    pass
