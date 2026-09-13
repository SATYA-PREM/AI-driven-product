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
        "name": "1. Authentication & Users",
        "description": "User registration, JWT token generation, secure authentication, and profile management.",
    },
    {
        "name": "2. Workspaces & Products",
        "description": "Multi-tenant workspace organization, team member permissions, and product catalog management.",
    },
    {
        "name": "3. Data Ingestion & Datasets",
        "description": "Ingestion of raw, unnormalized customer feedback datasets from CSV, JSON, and XLSX files.",
    },
    {
        "name": "4. Data Agent - Dirty Data Preprocessing",
        "description": """
**Data Agent Pipeline & Tools:**
Automated inspection, quality scoring, cleaning, and preprocessing of noisy, uncurated customer feedback into structured, canonical AI-ready signals:
- **Pipeline Orchestrator**: Run full 4-stage pipeline (Inspect → Validate → Clean → Preprocess)
- **Step 4.1**: Inspect raw dirty dataset structure, volume, and missing attributes
- **Step 4.2**: Validate schema integrity, boundary rules, and compute 0–100% Quality Score
- **Step 4.3**: Clean dirty data: deduplicate, strip XSS/HTML, handle missing values, normalize ratings (1–5)
- **Step 4.4**: Preprocess into canonical AI-ready signals with tokenization and date normalization
- **Step 4.5**: Gemini AI Semantic Quality & Readiness gate check
- **Step 4.6**: Multi-stage data lifecycle summary report
""",
    },
    {
        "name": "5. AI Agents & Health Probes",
        "description": """
**Operational Diagnostics: Are Agents Working or Not?**
Live Swagger probe reporting real-time working status, tools, and operational readiness for:
- **Data Agent**: Active and working with dirty data inspection, cleaning, and preprocessing toolkits.
- **Agent 1 (Feedback Analysis Agent)**: Multi-dimensional feedback classification with Gemini 2.0.
- **Agent 2 (Pattern & Trend Agent)**: Cross-customer semantic clustering and trend detection.
- **Agent 3 (Product Intelligence Agent)**: Deterministic priority scoring (0–100) and strategic insight generation.
- **CrewAI Execution Framework**: Sequential orchestrator and task scheduling engine.
- **Gemini LLM Provider**: Google GenAI SDK connection and API credentials.
""",
    },
    {
        "name": "6. AI Analysis Pipeline (CrewAI 3-Agent Flow)",
        "description": """
**Autonomous 3-Agent CrewAI Sequential Execution:**
Launches and monitors the complete AI pipeline across all customer feedback in the dataset:
`Preprocessed AI-Ready Signals → [Agent 1: Feedback Analysis] → [Agent 2: Pattern & Trend] → [Agent 3: Product Intelligence] → Product Insights & Executive Report`
Performs comprehensive classification on 100% of dataset records without arbitrary limits, with real-time stage progression tracking and per-record as well as full-dataset inspection.
""",
    },
    {
        "name": "7. Product Intelligence & PM Dashboard",
        "description": """
**Strategic PM Dashboard & Executive Intelligence:**
Synthesized findings, recommendations, and executive reporting across all analyzed customer records:
- **Executive KPI Summary**: Net sentiment, top customer themes, and critical issue alerts.
- **Semantic Issue Clusters**: Evidence-backed problem clusters with deterministic priority scores (0–100).
- **Feature Demand Rankings**: Customer-requested features ranked by demand volume and business impact.
- **Period Trend Velocity**: Acceleration, deceleration, and emerging feedback patterns over time.
- **Executive PM Reports**: Comprehensive synthesized report documents for product leadership.
""",
    },
    {
        "name": "8. Background Jobs & System Monitoring",
        "description": "Background processing jobs, execution progress tracking, task cancellation, and system/database health checks.",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
### AI-Driven Product Assistant & Product Intelligence Platform

A production-grade platform that transforms raw, noisy customer feedback into prioritized, evidence-backed product intelligence using autonomous AI agents.

#### Complete End-to-End Master Pipeline Sequence:
1. **Authentication & Users** (`1.`): Secure JWT login, registration, and user profiles.
2. **Workspaces & Products** (`2.`): Multi-tenant workspace partitioning, RBAC roles (PM, Member), and product management.
3. **Data Ingestion & Datasets** (`3.`): Ingestion of customer tickets, reviews, and survey feedback from CSV, JSON, and XLSX files (`UPLOADED`).
4. **Data Agent - Dirty Data Preprocessing** (`4.`):
   - **Inspect**: Inspect messy columns, formats, and structural gaps.
   - **Validate**: Enforce schema rules, data types, and compute 0–100% Quality Score (`VALIDATED`).
   - **Clean**: Remove duplicate records, sanitize HTML/XSS, impute missing values, and normalize ratings (`CLEANED`).
   - **Preprocess**: Transform into canonical AI-ready signals (`PREPROCESSED`).
   - **Gemini AI Readiness Check**: Semantic quality validation prior to agent execution.
5. **AI Agents & Health Probes** (`5.`):
   - Query `/api/v1/health/agents` for real-time operational diagnostics of all 4 agents.
6. **AI Analysis Pipeline (CrewAI 3-Agent Flow)** (`6.`):
   - **Agent 1 (Feedback Analysis Agent)**: Evaluates 10 product dimensions for every record in the dataset (`AGENT_1_COMPLETED`).
   - **Agent 2 (Pattern & Trend Agent)**: Semantic clustering of issues & features, plus period-over-period trend velocity (`AGENT_2_COMPLETED`).
   - **Agent 3 (Product Intelligence Agent)**: Deterministic 0–100 priority scoring and actionable PM recommendations (`AGENT_3_COMPLETED`).
7. **Product Intelligence & PM Dashboard** (`7.`):
   - Executive KPIs, priority-scored issue clusters, feature demand backlogs, sentiment distribution, and executive reports (`INTELLIGENCE_READY` → `COMPLETED`).
8. **System Monitoring** (`8.`):
   - Background jobs tracking, stage retry, and system liveness.
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

@app.get("/", tags=["8. Background Jobs & System Monitoring"], summary="Root Status Endpoint")
def root():
    """Root status endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["8. Background Jobs & System Monitoring"], summary="Top-Level Liveness Health Check")
def health():
    """Quick top-level health check."""
    db_connected = check_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "unreachable",
    }