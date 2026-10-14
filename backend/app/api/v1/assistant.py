"""
assistant.py
------------
FastAPI Router for the Read-Only AI Assistant.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    AssistantSessionCreate,
    AssistantSessionResponse,
    AssistantMessageResponse,
)
from app.schemas.assistant_job import (
    AssistantJobCreate,
    AssistantJobResponse,
    AssistantJobStatusResponse,
)
from app.services.assistant.assistant_service import assistant_service
from app.services.assistant.context_service import context_service
from app.repositories.assistant_repository import assistant_repository
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/assistant", tags=["12. AI Assistant (Read-only Intelligence Layer)"])


@router.post(
    "/query",
    response_model=AssistantQueryResponse,
    summary="Query AI Assistant over Product Intelligence & PRD data",
    status_code=status.HTTP_200_OK,
)
async def query_assistant(payload: AssistantQueryRequest):
    """
    Submits a question to the AI Assistant.
    - Authorized users only.
    - Fast-Path execution for known question bank templates (0s delay).
    - Dynamic Gemini analysis with multi-model fallback for open-ended questions.
    - Strictly Read-Only: No data mutations or updates possible.
    """
    try:
        res = assistant_service.process_query(
            workspace_id=payload.workspace_id,
            message=payload.message,
            category_id=payload.category_id,
            session_id=payload.session_id,
            scope=payload.scope,
            history=payload.history,
        )
        return res
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except Exception as e:
        logger.error(f"Assistant query processing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant failed to process query: {str(e)}",
        )


@router.get(
    "/context/{workspace_id}",
    summary="Get Assistant context snapshot and connected data sources",
    status_code=status.HTTP_200_OK,
)
async def get_assistant_context(
    workspace_id: str,
    category_id: Optional[str] = Query("all", description="Active category filter"),
):
    """Returns metadata for the Assistant UI: connected sources, workspace context, and stats."""
    return context_service.get_context_snapshot(workspace_id=workspace_id, category_id=category_id)


@router.post(
    "/sessions",
    response_model=AssistantSessionResponse,
    summary="Create a new Assistant chat session",
    status_code=status.HTTP_201_CREATED,
)
async def create_session(payload: AssistantSessionCreate):
    """Creates a new chat session."""
    session = assistant_repository.create_session(
        workspace_id=payload.workspace_id,
        category_id=payload.category_id,
        title=payload.title or "New Assistant Session",
    )
    return session


@router.get(
    "/workspaces/{workspace_id}/sessions",
    response_model=List[AssistantSessionResponse],
    summary="List chat sessions for a workspace",
    status_code=status.HTTP_200_OK,
)
async def list_sessions(workspace_id: str, limit: int = Query(20, ge=1, le=100)):
    """Lists chat sessions."""
    return assistant_repository.list_sessions(workspace_id=workspace_id, limit=limit)


@router.get(
    "/sessions/{session_id}/messages",
    summary="Get conversation history for a session",
    status_code=status.HTTP_200_OK,
)
async def get_session_messages(session_id: str):
    """Retrieves conversation turns for a session."""
    msgs = assistant_repository.get_messages(session_id=session_id)
    return msgs


@router.post(
    "/jobs",
    response_model=AssistantJobResponse,
    summary="Trigger an async Assistant query job",
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_assistant_job(payload: AssistantJobCreate):
    """Launches an async assistant job."""
    try:
        job = assistant_service.create_async_job(
            workspace_id=payload.workspace_id,
            message=payload.message,
            category_id=payload.category_id,
            scope=payload.scope,
        )
        return job
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )


@router.get(
    "/jobs/{job_id}",
    response_model=AssistantJobStatusResponse,
    summary="Get async Assistant job status",
    status_code=status.HTTP_200_OK,
)
async def get_assistant_job(job_id: str):
    """Polls async job status."""
    job = assistant_service.get_job_status(job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assistant job '{job_id}' not found.",
        )
    return job

