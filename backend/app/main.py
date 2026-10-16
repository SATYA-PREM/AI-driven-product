"""
main.py
--------
Entry point for the Product Intelligence FastAPI application.
Configures lifecycle, middleware, error handling, CORS, and API routing.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import asyncio
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
    Initializes database indexes asynchronously in the background so the HTTP API
    starts accepting client requests immediately without stalling for 20+ seconds.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Run database index initialization in the background non-blockingly
    asyncio.create_task(asyncio.to_thread(initialize_database))

    yield

    logger.info(f"Shutting down {settings.APP_NAME}")


# ──────────────────────────────────────────────
# FastAPI Application & Swagger/OpenAPI Metadata
# ──────────────────────────────────────────────

OPENAPI_TAGS = [
    {
        "name": "1. Authentication & Users",
        "description": "User registration, JWT token generation, secure authentication, and profile management.",
        "description": "User registration, JWT token generation, secure authentication, role-based access control, and user profile management.",
    },
    {
        "name": "2. Workspaces & Products",
        "description": "Multi-tenant workspace organization, team member permissions, and product catalog management.",
        "description": "Multi-tenant workspace organization, team member permissions, product catalog, and dataset/source association.",
    },
    {
        "name": "3. Data Ingestion & Datasets",
        "description": "Ingestion of raw, unnormalized customer feedback datasets from CSV, JSON, and XLSX files.",
        "description": "Ingestion of raw, unnormalized customer feedback datasets from CSV, JSON, and XLSX files, preview, and column mapping.",
    },
    {
        "name": "4. Data Agent - Dirty Data Preprocessing",
        "description": """
**Data Agent Pipeline & Tools:**
Automated inspection, quality scoring, cleaning, and preprocessing of noisy, uncurated customer feedback into structured, canonical AI-ready signals:
**Data Agent Pipeline & Toolkits:**
Automated inspection, quality scoring, cleaning, and preprocessing of noisy customer feedback into structured, canonical AI-ready signals:
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
- **Data Agent**: Preprocessing agent with dirty data inspection, cleaning, and preprocessing toolkits.
- **Agent 1 (Feedback Analysis Agent)**: Multi-dimensional feedback classification with Gemini.
- **Agent 2 (Pattern & Trend Agent)**: Cross-customer semantic clustering and trend detection.
- **Agent 3 (Product Intelligence Agent)**: Deterministic priority scoring (0–100) and strategic insight generation.
- **CrewAI Execution Framework**: Sequential orchestrator and task scheduling engine.
- **Gemini LLM Provider**: Google GenAI SDK connection and API credentials.
- **Gemini LLM Provider**: Google GenAI SDK connection, multi-key rotation, and API credentials.
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
- **Customer Feedback & Features**: Categorization, filtering, manual overrides, and feature mapping.
""",
    },
    {
        "name": "8. Background Jobs & System Monitoring",
        "description": "Background processing jobs, execution progress tracking, task cancellation, and system/database health checks.",
    },
    {
        "name": "9. Milestone 3 - PRD Generation & Development",
        "description": """
**AI-Assisted PRD Studio & Context Previews:**
Turn customer intelligence and approved PM review gates into full engineering Product Requirements Documents (PRDs):
- **PM Reviews & Approval Gates**: Formal PM review sign-offs with provenance tracking.
- **Context Preview**: Deep-dive into problem context, affected customer tiers, and evidence signals.
- **AI PRD Generation**: Automated synthesis of user personas, problem statements, acceptance criteria, non-functional requirements, and release criteria.
- **User Stories & Story Generation**: Automated breakdown into actionable Agile user stories.
- **Circulation Packages**: Generate cross-functional circulation briefs for design, engineering, QA, and business stakeholders.
""",
    },
    {
        "name": "10. Milestone 4 - PRD Assignments & Team Handoff",
        "description": """
**Downstream Role Assignments & Team Deliverable Reviews:**
Orchestrates cross-functional handoff from PRD requirements to role specialists:
- **Workspace Roster**: List verified team members by product role (Product Designer, Lead Developer, QA Lead, Stakeholder).
- **AI Assignment Jobs**: Automated recommendations matching requirement domains to team members.
- **Assignment Management**: Create, view, reassign, and track requirement deliverables.
- **Member Submissions & PM Review**: Member response submissions, blocker reporting, and PM Accept/Reject workflow.
- **Problem Resolution & Tasks Queue**: Comprehensive audit trail of fixed issues, features added/removed, and verification history.
""",
    },
    {
        "name": "12. AI Assistant (Read-only Intelligence Layer)",
        "description": """
**Conversational Intelligence & RAG Exploration:**
Real-time conversational assistant providing citations, insights, and reasoning traces over datasets, issue clusters, PRDs, and team tasks without modifying underlying records.
""",
    },
    {
        "name": "13. Product Designer Workspace",
        "description": """
**UX/UI Design Hub & Design Tokens:**
Tailored workspace for Product Designers:
- **Designer Dashboard**: Active design assignments, UX blockers, submissions, and pending reviews.
- **Design Specifications & Tokens**: Upload Figma frame links, design system tokens, typography, and color specs.
- **Clarification Requests & Review Loop**: Ask PM questions and submit interactive prototypes for review.
""",
    },
    {
        "name": "14. Product Delivery Phases & Readiness Gates",
        "description": """
**End-to-End Delivery Milestones & Readiness Gates:**
Tracks lifecycle progression across all product stages (Upload → Clean → Analyze → Intelligence → PRD → Design → Dev → QA → Launch):
- **Phase Milestones**: Aggregated status, completion percentages, and active phase blockers.
- **Readiness Gate Sign-Offs**: Formal gate checks ensuring requirements and criteria are satisfied before transitioning between delivery phases.
""",
    },
    {
        "name": "15. Developer Workspace",
        "description": """
**Engineering Handoff & Implementation Hub:**
Tailored workspace for Lead Developers and Engineers:
- **Developer Dashboard**: Technical task queue, architecture dependencies, PR links, and blockers.
- **API Contracts & Technical Specifications**: Manage endpoint schemas, schema migrations, and implementation notes.
- **Code Deliverable Submissions**: Link Git branches/pull requests and report architectural impediments.
""",
    },
    {
        "name": "16. QA Lead Workspace",
        "description": """
**Quality Assurance & Acceptance Criteria Verification:**
Tailored workspace for QA Leads and Testers:
- **QA Dashboard**: Test plan completion, open bugs, defect severity breakdown, and regression safety.
- **Test Matrix & Scenarios**: Author, execute, and link test cases directly to PRD acceptance criteria.
- **Bug Reporting & Verification**: File defects with reproduction steps, logs, and PM review status.
""",
    },
    {
        "name": "17. Business Owner / Stakeholder Workspace",
        "description": """
**Executive ROI & Strategic Alignment:**
Tailored workspace for Business Sponsors, Executives, and Stakeholders:
- **Stakeholder Dashboard**: Release readiness, business value realization, ROI forecasts, and customer impact.
- **Strategic Impact Verification**: Empirical validation of churn reduction, revenue leakage prevention, and customer NPS goals.
- **Release Sign-Offs**: Final executive sign-off for General Availability (GA) releases.
""",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
### AI-Driven Product Assistant & Product Intelligence Platform

A production-grade platform that transforms raw, noisy customer feedback into prioritized, evidence-backed product intelligence using autonomous AI agents.
A comprehensive, production-grade enterprise platform that transforms noisy, uncurated customer feedback into prioritized, evidence-backed product intelligence and orchestrates cross-functional delivery from PRD to production release.

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
#### Complete End-to-End Master Architecture & Workflow:
1. **Authentication & Users** (`1.`): Secure JWT login, multi-tenant RBAC permissions, and user profiles.
2. **Workspaces & Products** (`2.`): Workspace partitioning, team roster, and multi-product catalog.
3. **Data Ingestion & Datasets** (`3.`): Multi-source ingestion of customer tickets, reviews, and survey feedback (CSV, JSON, XLSX).
4. **Data Agent - Dirty Data Preprocessing** (`4.`): 4-stage pipeline (Inspect raw data → Validate schema & quality score → Clean & sanitize → Preprocess into AI-ready signals).
5. **AI Agents & Health Probes** (`5.`): Live operational diagnostics for Data Agent, 3 Milestone 2 CrewAI Agents, and Gemini AI SDK connectivity.
6. **AI Analysis Pipeline (CrewAI 3-Agent Flow)** (`6.`):
   - **Agent 1 (Feedback Analysis Agent)**: Evaluates 10 product dimensions for every record in the dataset (`AGENT_1_COMPLETED`).
   - **Agent 2 (Pattern & Trend Agent)**: Semantic clustering of issues & features, plus period-over-period trend velocity (`AGENT_2_COMPLETED`).
   - **Agent 3 (Product Intelligence Agent)**: Deterministic 0–100 priority scoring and actionable PM recommendations (`AGENT_3_COMPLETED`).
7. **Product Intelligence & PM Dashboard** (`7.`):
   - Executive KPIs, priority-scored issue clusters, feature demand backlogs, sentiment distribution, and executive reports (`INTELLIGENCE_READY` → `COMPLETED`).
8. **System Monitoring** (`8.`):
   - Background jobs tracking, stage retry, and system liveness.
   - **Agent 1 (Feedback Analysis Agent)**: 10-dimension classification per customer record.
   - **Agent 2 (Pattern & Trend Agent)**: Cross-customer semantic clustering, feature request aggregation, and trend velocity.
   - **Agent 3 (Product Intelligence Agent)**: Deterministic 0–100 priority scoring and actionable PM recommendations.
7. **Product Intelligence & PM Dashboard** (`7.`): Executive KPIs, priority problem clusters, feature demand backlogs, sentiment distribution, and executive report generation.
8. **Background Jobs & System Monitoring** (`8.`): Asynchronous job queue, stage retry, cancellation, and database health probes.
9. **Milestone 3 - PRD Generation & Development** (`9.`): PM approval gates, context previews, AI PRD generation, acceptance criteria, user stories, and circulation packages.
10. **Milestone 4 - PRD Assignments & Team Handoff** (`10.`): AI role recommendation jobs, cross-functional assignment to team members, submission review, and problem resolution audit queues.
11. **AI Assistant (Read-only Intelligence Layer)** (`12.`): Conversational query engine with verifiable citations and reasoning traces across intelligence and PRDs.
12. **Product Designer Workspace** (`13.`): Design tokens, Figma links, UX requirement specifications, and prototype reviews.
13. **Product Delivery Phases & Readiness Gates** (`14.`): High-level milestone tracking and gate sign-offs across product delivery phases.
14. **Developer Workspace** (`15.`): Technical implementation tasks, API contracts, branch/PR linking, and blocker tracking.
15. **QA Lead Workspace** (`16.`): Test scenario matrices, acceptance criteria validation, bug tracking, and release quality sign-offs.
16. **Business Owner / Stakeholder Workspace** (`17.`): Strategic alignment, financial ROI forecasting, customer SLA sign-offs, and executive launch approvals.
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
    allow_origin_regex=r"https://.*\.vercel\.app",
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