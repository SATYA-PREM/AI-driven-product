from __future__ import annotations
from pydantic import BaseModel

class UploadResponse(BaseModel):
    dataset_id: str
    job_id: str
    filename: str
    format: str
    message: str = 'Upload accepted'
