from fastapi import APIRouter
from app.api.v1 import auth, users, workspaces, products, data, validation, cleaning, preprocessing, jobs, workflow, health
from app.api.v1 import (
    auth,
    users,
    workspaces,
    products,
    data,
    validation,
    cleaning,
    preprocessing,
    jobs,
    workflow,
    health,
    analysis,
    intelligence,
)

api_router = APIRouter(prefix='/api/v1')

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workspaces.router)
api_router.include_router(products.router)
api_router.include_router(data.router)
api_router.include_router(validation.router)
api_router.include_router(cleaning.router)
api_router.include_router(preprocessing.router)
api_router.include_router(jobs.router)
api_router.include_router(workflow.router)
api_router.include_router(health.router)
api_router.include_router(analysis.router)
api_router.include_router(intelligence.router)