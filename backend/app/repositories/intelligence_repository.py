"""
intelligence_repository.py
--------------------------
Repository for storing and querying Product Intelligence artifacts:
issue clusters, feature clusters, trends, theme patterns, and product insights.
Includes in-memory store fallback for offline test environments.
"""

from __future__ import annotations

from typing import Any
from app.core.database import (
    issue_clusters_collection,
    feature_clusters_collection,
    trends_collection,
    theme_patterns_collection,
    product_insights_collection,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class IntelligenceRepository:
    """Repository handling persistence and queries for Milestone 2 Product Intelligence."""

    def __init__(self):
        self._issue_clusters: dict[str, dict[str, Any]] = {}
        self._feature_clusters: dict[str, dict[str, Any]] = {}
        self._trends: dict[str, dict[str, Any]] = {}
        self._theme_patterns: dict[str, dict[str, Any]] = {}
        self._product_insights: dict[str, dict[str, Any]] = {}

    # ── Issue Clusters ──────────────────────────────
    def save_issue_cluster(self, cluster_doc: dict[str, Any]) -> str:
        workspace_id = cluster_doc["workspace_id"]
        cluster_id = cluster_doc["cluster_id"]
        key = f"{workspace_id}:{cluster_id}"
        try:
            result = issue_clusters_collection.update_one(
                {"workspace_id": workspace_id, "cluster_id": cluster_id},
                {"$set": cluster_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = issue_clusters_collection.find_one({"workspace_id": workspace_id, "cluster_id": cluster_id})
            return str(existing["_id"]) if existing else key
        except Exception:
            self._issue_clusters[key] = cluster_doc
            return key

    def get_issue_clusters(
        self, workspace_id: str, dataset_id: str | None = None, limit: int = 50
    ) -> list[dict[str, Any]]:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return list(issue_clusters_collection.find(query).sort("frequency", -1).limit(limit))
        except Exception:
            items = [
                d for d in self._issue_clusters.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            ]
            items.sort(key=lambda x: x.get("frequency", 0), reverse=True)
            return items[:limit]

    def count_issue_clusters(self, workspace_id: str, dataset_id: str | None = None) -> int:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return issue_clusters_collection.count_documents(query)
        except Exception:
            return sum(
                1 for d in self._issue_clusters.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            )

    # ── Feature Clusters ────────────────────────────
    def save_feature_cluster(self, cluster_doc: dict[str, Any]) -> str:
        workspace_id = cluster_doc["workspace_id"]
        cluster_id = cluster_doc["cluster_id"]
        key = f"{workspace_id}:{cluster_id}"
        try:
            result = feature_clusters_collection.update_one(
                {"workspace_id": workspace_id, "cluster_id": cluster_id},
                {"$set": cluster_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = feature_clusters_collection.find_one({"workspace_id": workspace_id, "cluster_id": cluster_id})
            return str(existing["_id"]) if existing else key
        except Exception:
            self._feature_clusters[key] = cluster_doc
            return key

    def get_feature_clusters(
        self, workspace_id: str, dataset_id: str | None = None, limit: int = 50
    ) -> list[dict[str, Any]]:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return list(feature_clusters_collection.find(query).sort("request_count", -1).limit(limit))
        except Exception:
            items = [
                d for d in self._feature_clusters.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            ]
            items.sort(key=lambda x: x.get("request_count", 0), reverse=True)
            return items[:limit]

    def count_feature_clusters(self, workspace_id: str, dataset_id: str | None = None) -> int:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return feature_clusters_collection.count_documents(query)
        except Exception:
            return sum(
                1 for d in self._feature_clusters.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            )

    # ── Trends ──────────────────────────────────────
    def save_trend(self, trend_doc: dict[str, Any]) -> str:
        workspace_id = trend_doc["workspace_id"]
        trend_id = trend_doc["trend_id"]
        key = f"{workspace_id}:{trend_id}"
        try:
            result = trends_collection.update_one(
                {"workspace_id": workspace_id, "trend_id": trend_id},
                {"$set": trend_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = trends_collection.find_one({"workspace_id": workspace_id, "trend_id": trend_id})
            return str(existing["_id"]) if existing else key
        except Exception:
            self._trends[key] = trend_doc
            return key

    def get_trends(
        self, workspace_id: str, dataset_id: str | None = None, limit: int = 50
    ) -> list[dict[str, Any]]:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return list(trends_collection.find(query).sort("change_percentage", -1).limit(limit))
        except Exception:
            items = [
                d for d in self._trends.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            ]
            items.sort(key=lambda x: x.get("change_percentage", 0.0), reverse=True)
            return items[:limit]

    # ── Theme Patterns ──────────────────────────────
    def save_theme_pattern(self, pattern_doc: dict[str, Any]) -> str:
        workspace_id = pattern_doc["workspace_id"]
        theme = pattern_doc["theme"]
        key = f"{workspace_id}:{theme}"
        try:
            result = theme_patterns_collection.update_one(
                {"workspace_id": workspace_id, "theme": theme},
                {"$set": pattern_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = theme_patterns_collection.find_one({"workspace_id": workspace_id, "theme": theme})
            return str(existing["_id"]) if existing else key
        except Exception:
            self._theme_patterns[key] = pattern_doc
            return key

    def get_theme_patterns(
        self, workspace_id: str, dataset_id: str | None = None
    ) -> list[dict[str, Any]]:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return list(theme_patterns_collection.find(query).sort("feedback_count", -1))
        except Exception:
            items = [
                d for d in self._theme_patterns.values()
                if d.get("workspace_id") == workspace_id and (not dataset_id or d.get("dataset_id") == dataset_id)
            ]
            items.sort(key=lambda x: x.get("feedback_count", 0), reverse=True)
            return items

    # ── Product Insights ────────────────────────────
    def save_product_insight(self, insight_doc: dict[str, Any]) -> str:
        workspace_id = insight_doc["workspace_id"]
        insight_id = insight_doc["insight_id"]
        key = f"{workspace_id}:{insight_id}"
        try:
            result = product_insights_collection.update_one(
                {"workspace_id": workspace_id, "insight_id": insight_id},
                {"$set": insight_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = product_insights_collection.find_one({"workspace_id": workspace_id, "insight_id": insight_id})
            return str(existing["_id"]) if existing else key
        except Exception:
            self._product_insights[key] = insight_doc
            return key

    def get_product_insights(
        self,
        workspace_id: str,
        dataset_id: str | None = None,
        insight_type: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            if insight_type:
                query["insight_type"] = insight_type
            return list(product_insights_collection.find(query).sort("priority.score", -1).limit(limit))
        except Exception:
            items = [
                d for d in self._product_insights.values()
                if d.get("workspace_id") == workspace_id
                and (not dataset_id or d.get("dataset_id") == dataset_id)
                and (not insight_type or d.get("insight_type") == insight_type)
            ]
            items.sort(key=lambda x: x.get("priority", {}).get("score", 0.0), reverse=True)
            return items[:limit]

    def count_product_insights(
        self, workspace_id: str, dataset_id: str | None = None, insight_type: str | None = None
    ) -> int:
        try:
            query: dict[str, Any] = {"workspace_id": workspace_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            if insight_type:
                query["insight_type"] = insight_type
            return product_insights_collection.count_documents(query)
        except Exception:
            return sum(
                1 for d in self._product_insights.values()
                if d.get("workspace_id") == workspace_id
                and (not dataset_id or d.get("dataset_id") == dataset_id)
                and (not insight_type or d.get("insight_type") == insight_type)
            )

    def delete_dataset_patterns(self, dataset_id: str) -> None:
        """Clear previous pattern and cluster records for a dataset when Agent 2 completes."""
        try:
            issue_clusters_collection.delete_many({"dataset_id": dataset_id})
            feature_clusters_collection.delete_many({"dataset_id": dataset_id})
            trends_collection.delete_many({"dataset_id": dataset_id})
            theme_patterns_collection.delete_many({"dataset_id": dataset_id})
        except Exception as e:
            logger.debug(f"Error clearing dataset patterns: {e}")
        # Clear in-memory fallbacks
        self._issue_clusters = {k: v for k, v in self._issue_clusters.items() if v.get("dataset_id") != dataset_id}
        self._feature_clusters = {k: v for k, v in self._feature_clusters.items() if v.get("dataset_id") != dataset_id}
        self._trends = {k: v for k, v in self._trends.items() if v.get("dataset_id") != dataset_id}
        self._theme_patterns = {k: v for k, v in self._theme_patterns.items() if v.get("dataset_id") != dataset_id}

    def delete_dataset_insights(self, dataset_id: str) -> None:
        """Clear previous product insights for a dataset when Agent 3 completes."""
        try:
            product_insights_collection.delete_many({"dataset_id": dataset_id})
        except Exception as e:
            logger.debug(f"Error clearing dataset insights: {e}")
        self._product_insights = {k: v for k, v in self._product_insights.items() if v.get("dataset_id") != dataset_id}

    def delete_dataset_intelligence(self, dataset_id: str) -> None:
        """Clear previous intelligence records for a dataset."""
        self.delete_dataset_patterns(dataset_id)
        self.delete_dataset_insights(dataset_id)


intelligence_repository = IntelligenceRepository()

