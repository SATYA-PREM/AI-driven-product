from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.database import check_connection
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
def health_check() -> dict:
    return {
        "status": "healthy",
        "database": check_connection(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/database")
def database_health() -> dict:
    return {
        "connected": check_connection(),
        "database": settings.MONGODB_DATABASE
    }
