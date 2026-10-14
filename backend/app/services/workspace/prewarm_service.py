"""
prewarm_service.py
------------------
Asynchronously loads and bundles core workspace data from MongoDB Atlas in parallel.
Caches individual route payloads and the full pre-warm bundle in memory to ensure
instant (0ms) responses across all sidebar page navigations.
"""

from __future__ import annotations

import logging
from typing import Any
from concurrent.futures import ThreadPoolExecutor

from app.core.cache import memory_cache
from app.core.database import (
    workspaces_collection,
    products_collection,
    datasets_collection,
    prd_projects_collection,
    prd_assignments_collection,
    customer_feedback_collection,
)
from app.services.intelligence.intelligence_service import intelligence_service
from app.repositories.intelligence_repository import intelligence_repository
from app.services.workspace.activity_service import activity_service
from app.utils.serialization import serialize_document, serialize_documents

logger = logging.getLogger(__name__)


class WorkspacePrewarmService:
    """Service to preload and cache all workspace data in memory."""

    @staticmethod
    def prewarm_workspace(
        workspace_id: str,
        role: str = "product_manager",
        user_id: str | None = None,
        current_path: str = ""
    ) -> dict[str, Any]:
        """Fetch and bundle all workspace route data in parallel with in-memory caching."""
        cache_key = f"prewarm:{workspace_id}:{role}"
        cached = memory_cache.get(cache_key)
        if cached:
            logger.debug(f"Serving prewarm bundle from memory cache for workspace {workspace_id}")
            return cached

        logger.info(f"Pre-warming workspace data in background for workspace: {workspace_id} (role: {role}, current_path: {current_path})")

        def fetch_ws():
            ws = workspaces_collection.find_one({"$or": [{"_id": workspace_id}, {"id": workspace_id}]})
            if not ws and workspace_id == "default-workspace":
                ws = {
                    "id": "default-workspace",
                    "_id": "default-workspace",
                    "name": "Product Intelligence Workspace",
                    "description": "Customer Feedback & Intelligence Hub",
                    "members_count": 3,
                }
            return serialize_document(ws) if ws else {}

        def fetch_products():
            docs = list(products_collection.find({"workspace_id": workspace_id}))
            return serialize_documents(docs)

        def fetch_datasets():
            docs = list(datasets_collection.find({"workspace_id": workspace_id}))
            return serialize_documents(docs)

        def fetch_summary():
            try:
                return intelligence_service.get_workspace_intelligence_summary(workspace_id)
            except Exception as e:
                logger.debug(f"Prewarm summary notice: {e}")
                return {"summary": {}, "top_issues": [], "top_features": []}

        def fetch_issues():
            try:
                clusters = intelligence_repository.get_issue_clusters(workspace_id, None, limit=100)
                return serialize_documents(clusters)
            except Exception as e:
                logger.debug(f"Prewarm issues notice: {e}")
                return []

        def fetch_features():
            try:
                features = intelligence_repository.get_feature_clusters(workspace_id, None, limit=50)
                return serialize_documents(features)
            except Exception as e:
                logger.debug(f"Prewarm features notice: {e}")
                return []

        def fetch_sentiment():
            try:
                sent = intelligence_repository.get_sentiment_summary(workspace_id, None)
                return serialize_document(sent) if sent else {}
            except Exception as e:
                logger.debug(f"Prewarm sentiment notice: {e}")
                return {}

        def fetch_trends():
            try:
                trends = intelligence_repository.get_trends(workspace_id, None, limit=50)
                return serialize_documents(trends)
            except Exception as e:
                logger.debug(f"Prewarm trends notice: {e}")
                return []

        def fetch_insights():
            try:
                ins = intelligence_repository.get_product_insights(workspace_id, None, limit=50)
                return serialize_documents(ins)
            except Exception as e:
                logger.debug(f"Prewarm insights notice: {e}")
                return []

        def fetch_prds():
            try:
                docs = list(prd_projects_collection.find({"workspace_id": workspace_id}))
                return serialize_documents(docs)
            except Exception as e:
                logger.debug(f"Prewarm PRDs notice: {e}")
                return []

        def fetch_assignments():
            try:
                docs = list(prd_assignments_collection.find({"workspace_id": workspace_id}))
                return serialize_documents(docs)
            except Exception as e:
                logger.debug(f"Prewarm assignments notice: {e}")
                return []

        def fetch_feedback():
            try:
                docs = list(customer_feedback_collection.find({"workspace_id": workspace_id}).limit(100))
                return serialize_documents(docs)
            except Exception as e:
                logger.debug(f"Prewarm feedback notice: {e}")
                return []

        def fetch_activities():
            try:
                logs = activity_service.get_workspace_activities(workspace_id, limit=20)
                return serialize_documents(logs)
            except Exception as e:
                logger.debug(f"Prewarm activities notice: {e}")
                return []

        # Run all data extractions in parallel
        with ThreadPoolExecutor(max_workers=8) as executor:
            fut_ws = executor.submit(fetch_ws)
            fut_prods = executor.submit(fetch_products)
            fut_datasets = executor.submit(fetch_datasets)
            fut_summary = executor.submit(fetch_summary)
            fut_issues = executor.submit(fetch_issues)
            fut_features = executor.submit(fetch_features)
            fut_sentiment = executor.submit(fetch_sentiment)
            fut_trends = executor.submit(fetch_trends)
            fut_insights = executor.submit(fetch_insights)
            fut_prds = executor.submit(fetch_prds)
            fut_assignments = executor.submit(fetch_assignments)
            fut_feedback = executor.submit(fetch_feedback)
            fut_activities = executor.submit(fetch_activities)

            ws_data = fut_ws.result()
            prods_data = fut_prods.result()
            datasets_data = fut_datasets.result()
            summary_data = fut_summary.result()
            issues_data = fut_issues.result()
            features_data = fut_features.result()
            sentiment_data = fut_sentiment.result()
            trends_data = fut_trends.result()
            insights_data = fut_insights.result()
            prds_data = fut_prds.result()
            assignments_data = fut_assignments.result()
            feedback_data = fut_feedback.result()
            activities_data = fut_activities.result()

        # Build endpoint map for 0ms frontend cache lookups
        routes_map: dict[str, Any] = {
            f"/workspaces/{workspace_id}": ws_data,
            f"/workspaces/{workspace_id}/products": prods_data,
            f"/products/?workspace_id={workspace_id}": prods_data,
            f"/products?workspace_id={workspace_id}": prods_data,
            f"/workspaces/{workspace_id}/datasets": datasets_data,
            f"/workspaces/{workspace_id}/datasets/": datasets_data,
            f"/datasets?workspace_id={workspace_id}": datasets_data,
            f"/datasets/?workspace_id={workspace_id}": datasets_data,
            f"/workspaces/{workspace_id}/activity?limit=20": activities_data,
            f"/workspaces/{workspace_id}/activity": activities_data,
            f"/workspaces/{workspace_id}/intelligence": summary_data,
            f"/workspaces/{workspace_id}/intelligence/summary": summary_data,
            f"/workspaces/{workspace_id}/intelligence/issues": issues_data,
            f"/workspaces/{workspace_id}/intelligence/issues?limit=50": issues_data[:50],
            f"/workspaces/{workspace_id}/intelligence/issues?limit=100": issues_data,
            f"/workspaces/{workspace_id}/intelligence/features": features_data,
            f"/workspaces/{workspace_id}/intelligence/features?limit=30": features_data[:30],
            f"/workspaces/{workspace_id}/intelligence/features?limit=50": features_data[:50],
            f"/workspaces/{workspace_id}/intelligence/sentiment": sentiment_data,
            f"/workspaces/{workspace_id}/intelligence/trends": trends_data,
            f"/workspaces/{workspace_id}/intelligence/trends?limit=50": trends_data[:50],
            f"/workspaces/{workspace_id}/intelligence/insights": insights_data,
            f"/workspaces/{workspace_id}/intelligence/insights?limit=50": insights_data[:50],
            f"/workspaces/{workspace_id}/features": features_data,
            f"/workspaces/{workspace_id}/features/": features_data,
            f"/workspaces/{workspace_id}/feedback": feedback_data,
            f"/workspaces/{workspace_id}/feedback/": feedback_data,
            f"/workspaces/{workspace_id}/prd": prds_data,
            f"/workspaces/{workspace_id}/prd/": prds_data,
            f"/workspaces/{workspace_id}/prd/projects": prds_data,
            f"/workspaces/{workspace_id}/development/prd": prds_data,
            f"/workspaces/{workspace_id}/prd-assignments": assignments_data,
            f"/workspaces/{workspace_id}/prd-assignments/": assignments_data,
            f"/workspaces/{workspace_id}/assignments": assignments_data,
            f"/workspaces/{workspace_id}/designer/dashboard": {
                "workspace": ws_data,
                "assignments": assignments_data,
                "total_assignments": len(assignments_data),
            },
            f"/workspaces/{workspace_id}/designer/assignments": assignments_data,
            f"/workspaces/{workspace_id}/designer/product-context": ws_data,
            f"/workspaces/{workspace_id}/designer/customer-feedback": feedback_data,
            # Developer Workspace Endpoints
            f"/workspaces/{workspace_id}/developer/dashboard": {
                "workspace_id": workspace_id,
                "kpis": {
                    "total_assigned": len(assignments_data),
                    "assigned_tasks": len(assignments_data),
                    "pending": sum(1 for a in assignments_data if a.get("status") in ["NOT_STARTED", "ASSIGNED", "PENDING"]),
                    "in_progress": sum(1 for a in assignments_data if a.get("status") == "IN_PROGRESS"),
                    "submitted_for_review": sum(1 for a in assignments_data if a.get("status") in ["SUBMITTED_FOR_REVIEW", "QA_PENDING", "COMPLETED"]),
                    "blocked": sum(1 for a in assignments_data if a.get("status") == "BLOCKED"),
                    "open_defects": 1,
                },
                "assignments": assignments_data,
                "recent_tasks": assignments_data[:10],
                "open_defects": [],
                "approved_handoffs": [],
                "upcoming_deadlines": assignments_data[:5],
                "recent_defects": [],
                "recent_design_handoffs": [],
            },
            f"/workspaces/{workspace_id}/developer/assignments": assignments_data,
            f"/workspaces/{workspace_id}/developer/defects": [],
            f"/workspaces/{workspace_id}/developer/design-handoff": [],
            f"/workspaces/{workspace_id}/developer/blockers": [],
            f"/workspaces/{workspace_id}/developer/submissions": [],
            f"/workspaces/{workspace_id}/prd-assignments/team-responses": {
                "total_assignments": len(assignments_data),
                "completed_count": sum(1 for a in assignments_data if a.get("status") in ["COMPLETED", "APPROVED"]),
                "in_progress_count": sum(1 for a in assignments_data if a.get("status") in ["IN_PROGRESS", "ASSIGNED"]),
                "pending_count": sum(1 for a in assignments_data if a.get("status") in ["NOT_STARTED", "UNASSIGNED"]),
                "blocked_count": sum(1 for a in assignments_data if a.get("status") == "BLOCKED"),
                "roles": [],
                "recent_submissions": [a for a in assignments_data if a.get("response") or a.get("submitted_at")][:10],
            },
            f"/workspaces/{workspace_id}/resolution-audit": {
                "workspace_id": workspace_id,
                "tasks_summary": {
                    "total": len(assignments_data),
                    "completed": sum(1 for a in assignments_data if a.get("status") in ["COMPLETED", "APPROVED"]),
                    "rejected": sum(1 for a in assignments_data if a.get("status") in ["REJECTED"]),
                    "in_progress": sum(1 for a in assignments_data if a.get("status") in ["IN_PROGRESS", "ASSIGNED"]),
                    "blocked": sum(1 for a in assignments_data if a.get("status") == "BLOCKED"),
                },
                "completed_tasks": [a for a in assignments_data if a.get("status") in ["COMPLETED", "APPROVED"]],
                "rejected_tasks": [a for a in assignments_data if a.get("status") in ["REJECTED"]],
                "in_progress_tasks": [a for a in assignments_data if a.get("status") in ["IN_PROGRESS", "ASSIGNED"]],
                "blocked_tasks": [a for a in assignments_data if a.get("status") == "BLOCKED"],
                "features_summary": {
                    "total_features": len(features_data),
                    "features_added_count": len(features_data),
                    "features_removed_count": 0,
                    "features_planned_count": 0,
                },
                "features_added": features_data,
                "features_removed": [],
                "features_planned": [],
                "issues_summary": {
                    "total_issues": len(issues_data),
                    "issues_fixed_count": sum(1 for i in issues_data if i.get("status") in ["RESOLVED", "CLOSED"]),
                    "issues_open_count": sum(1 for i in issues_data if i.get("status") not in ["RESOLVED", "CLOSED"]),
                },
                "issues_fixed": [i for i in issues_data if i.get("status") in ["RESOLVED", "CLOSED"]],
                "issues_open": [i for i in issues_data if i.get("status") not in ["RESOLVED", "CLOSED"]],
            },
        }

        # Cache each individual route in backend memory cache as well
        for route_path, data in routes_map.items():
            memory_cache.set(f"route:{route_path}", data, ttl_seconds=180)

        response_payload = {
            "workspace_id": workspace_id,
            "role": role,
            "prewarmed": True,
            "routes": routes_map,
        }

        memory_cache.set(cache_key, response_payload, ttl_seconds=180)
        return response_payload


prewarm_service = WorkspacePrewarmService()
