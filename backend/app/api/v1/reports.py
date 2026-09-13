"""
reports.py
----------
FastAPI routes for Final Executive Product Intelligence Reports.
Phase 9 in the Master Business Sequence:
    ... → AI Execution → Aggregation → Intelligence → REPORT
"""

from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Depends, Query

from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.reporting.report_service import report_service
from app.core.constants import Permission

from app.schemas.report import ReportResponse

router = APIRouter(
    prefix="/workspaces/{workspace_id}/reports",
    tags=["7. Product Intelligence & PM Dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ReportResponse, summary="Generate Executive Product Intelligence Report")
def generate_report(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Optional dataset filter"),
    report_type: str = Query("executive_summary", description="Type of report: executive_summary | roadmap_brief"),
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """
    **Phase 9 — Master Sequence Report Generation:**
    Compiles synthesized intelligence across all 3 AI agents into an actionable
    executive PM document with KPI summaries, top scored issues, and roadmap recommendations.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return report_service.generate_product_report(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        report_type=report_type,
    )


@router.get("/latest", response_model=ReportResponse, summary="Get Latest Product Intelligence Report")
def get_latest_report(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Optional dataset filter"),
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve the latest compiled product intelligence executive report."""
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return report_service.get_latest_report(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
    )
