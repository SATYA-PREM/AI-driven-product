from fastapi import APIRouter
from app.api.v1 import (
    auth,
    users,
    workspaces,
    products,
    data,
    data_agent,
    validation,
    cleaning,
    preprocessing,
    health,
    analysis,
    workflow,
    intelligence,
    jobs,
)

api_router = APIRouter(prefix="/api/v1")

# Phase 1: Authentication & Users
api_router.include_router(auth.router)
api_router.include_router(users.router)

# Phase 2: Workspaces & Products
api_router.include_router(workspaces.router)
api_router.include_router(products.router)

# Phase 3: Raw Data Ingestion & Datasets
api_router.include_router(data.router)

# Phase 4: Data Agent - Dirty Data Preprocessing
api_router.include_router(data_agent.router)
api_router.include_router(validation.router)
api_router.include_router(cleaning.router)
api_router.include_router(preprocessing.router)

# Phase 5: AI Agents & Health Probes
api_router.include_router(health.router)

# Phase 6: Milestone 2 - AI Analysis Pipeline (CrewAI)
api_router.include_router(analysis.router)
api_router.include_router(workflow.router)

# Phase 7: Milestone 2 - Product Intelligence & PM Dashboard
api_router.include_router(intelligence.router)

# Phase 8: Background Jobs & System Monitoring
api_router.include_router(jobs.router)