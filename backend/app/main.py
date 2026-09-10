"""
main.py
--------
Entry point for the Product Intelligence FastAPI application.
Configures lifecycle, middleware, error handling, CORS, and API routing.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.database import initialize_database, check_connection
from app.api.router import api_router
from app.middleware.request_id_middleware import RequestIdMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.error_middleware import add_error_middleware

# Initialize logging configuration
setup_logging(debug=settings.DEBUG)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    try:
        initialize_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")

    yield

    logger.info(f"Shutting down {settings.APP_NAME}")


# ──────────────────────────────────────────────
# FastAPI Application
# ──────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for AI-Driven Product Assistant & Product Intelligence Platform",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────
# Middleware (Order is important)
# ──────────────────────────────────────────────

# 1. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list if settings.cors_origin_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Logging & Request ID Middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

# 3. Custom Error Handlers
add_error_middleware(app)


# ──────────────────────────────────────────────
# API Routers
# ──────────────────────────────────────────────

app.include_router(api_router)


# ──────────────────────────────────────────────
# Root & Health Endpoints
# ──────────────────────────────────────────────

@app.get("/", tags=["General"])
def root():
    """Root status endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["General"])
def health():
    """Quick top-level health check."""
    db_connected = check_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "unreachable",
    }