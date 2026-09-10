from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import PaginatedResponse

class DatasetResponse(BaseModel):
    id: str
    workspace_id: str
    product_id: str
    filename: str
    format: str
    source_type: str
    file_size: int
    record_count: int
    status: str
    uploaded_by: str
    created_at: datetime

class DatasetListResponse(PaginatedResponse[DatasetResponse]):
    pass
