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
# FastAPI Application & Swagger/OpenAPI Metadata
# ──────────────────────────────────────────────

OPENAPI_TAGS = [
    {
        "name": "AI Agents & Health",
        "description": "Live operational status, diagnostics, and health probes for the 3 AI Agents (Agent 1: Feedback Analysis, Agent 2: Pattern & Trend, Agent 3: Product Intelligence) and CrewAI execution engine.",
    },
    {
        "name": "AI Analysis",
        "description": "Trigger and monitor the 3-agent Milestone 2 AI pipeline (Feedback Analysis Agent → Pattern & Trend Agent → Product Intelligence Agent) and inspect individual feedback analyses.",
    },
    {
        "name": "Product Intelligence",
        "description": "Executive PM dashboard intelligence: semantic issue clusters, feature demand rankings, period trends, and sentiment distribution.",
    },
    {
        "name": "Jobs",
        "description": "Background processing and AI pipeline job management and execution tracking.",
    },
    {
        "name": "Health",
        "description": "System and database connectivity health probes.",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
### AI-Driven Product Assistant & Product Intelligence Platform

**Milestone 2 Backend AI Architecture:**
- **Agent 1: Feedback Analysis Agent** (10-dimension classification: Sentiment, Intent, Theme, Product Area, Issues, Pain Points, Features, Confidences)
- **Agent 2: Pattern & Trend Agent** (Cross-customer intelligence: Semantic issue clustering, feature demand aggregation, trend velocity)
- **Agent 3: Product Intelligence Agent** (Strategic synthesis: Deterministic priority scoring 0–100, evidence-backed recommendations)
- **Execution Engines**: Native CrewAI `Process.sequential` with Google Gemini (`gemini-2.0-flash`) and deterministic mathematical models.
""",
    openapi_tags=OPENAPI_TAGS,
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