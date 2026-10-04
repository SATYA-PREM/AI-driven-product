"""
tools.py
--------
Hard Read-Only Tools for the Assistant Agent.
No write tools (no insert, update, delete, approve, reject, or assign) are exposed.
"""

from typing import Any, Dict, List, Optional
from app.services.assistant.retrieval_service import retrieval_service


def get_product_insight(workspace_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Tool: Retrieves generated product insights."""
    return retrieval_service.get_product_insights(workspace_id=workspace_id, limit=limit)


def search_product_insights(workspace_id: str, query: str) -> List[Dict[str, Any]]:
    """Tool: Searches generated insights by keyword."""
    all_ins = retrieval_service.get_product_insights(workspace_id=workspace_id, limit=30)
    q = query.lower()
    return [i for i in all_ins if q in str(i.get("title", "")).lower() or q in str(i.get("summary", "")).lower()][:10]


def get_insight_evidence(workspace_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Tool: Retrieves supporting customer feedback quotes."""
    return retrieval_service.get_example_feedback(workspace_id=workspace_id, limit=limit)


def get_feedback_analysis(workspace_id: str) -> Dict[str, Any]:
    """Tool: Retrieves sentiment breakdown and frequency aggregates."""
    return retrieval_service.get_sentiment_distribution(workspace_id=workspace_id)


def get_prd(workspace_id: str, prd_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Tool: Retrieves PRD documents."""
    if prd_id:
        p = retrieval_service.get_prd_by_id(prd_id=prd_id, workspace_id=workspace_id)
        return [p] if p else []
    return retrieval_service.get_prds(workspace_id=workspace_id, limit=5)


def get_prd_requirements(prd_id: str) -> List[Dict[str, Any]]:
    """Tool: Retrieves requirements for a specific PRD."""
    return retrieval_service.get_prd_requirements(prd_id=prd_id)


def get_trends(workspace_id: str) -> List[Dict[str, Any]]:
    """Tool: Retrieves trend patterns."""
    return retrieval_service.get_trends(workspace_id=workspace_id)

