"""
router.py
---------
Master API router mounting all route modules strictly in the chronological
order of the business sequence:
1. Authentication & Users
2. Workspaces, Members & Products
3. Datasets (Upload & Management)
4. Data Agent Preprocessing (Validate → Clean → Preprocess)
5. AI Agents & Health Diagnostics
6. Milestone 2 - AI Analysis Pipeline (CrewAI 3 Agents)
7. Milestone 2 - Product Intelligence & Strategic Scoring
8. Milestone 2 - Executive Reports & PM Summaries
9. Background Jobs & Monitoring
"""

from fastapi import APIRouter
from app.api.v1 import (
    auth,
    users,
    workspaces,
    members,
    products,
    datasets,
    data,
    data_agent,
    validation,
    cleaning,
    preprocessing,
    health,
    analysis,
    workflow,
    intelligence,
    features,
    feedback,
    reports,
    jobs,
)

api_router = APIRouter(prefix="/api/v1")

# Phase 1: Authentication & Users
api_router.include_router(auth.router)
api_router.include_router(users.router)

# Phase 2: Workspaces, Members & Products
api_router.include_router(workspaces.router)
api_router.include_router(members.router)
api_router.include_router(products.router)

# Phase 3: Datasets & Ingestion
api_router.include_router(datasets.router)

# Phase 4: Data Agent - Dirty Data Preprocessing (Inspect → Validate → Clean → Preprocess)
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
api_router.include_router(features.router)
api_router.include_router(feedback.router)

# Phase 8: Milestone 2 - Executive Reports & PM Summaries
api_router.include_router(reports.router)

# Phase 9: Background Jobs & System Monitoring
api_router.include_router(jobs.router)