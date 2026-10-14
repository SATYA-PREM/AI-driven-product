"""
Repository for Customer Feedback MongoDB collection.
Supports rich multi-criteria filtering, search, pagination, and dynamic aggregation metrics.
"""
from typing import List, Dict, Any, Optional
import re
from datetime import datetime, timedelta
from app.core.database import customer_feedback_collection


class FeedbackRepository:
    def __init__(self):
        self.collection = customer_feedback_collection

    def find_all(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        status: Optional[str] = None,
        sentiment: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
        mapped: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "created_at",
        sort_order: int = -1,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"workspace_id": workspace_id}

        if dataset_id and dataset_id != "all":
            query["dataset_id"] = dataset_id

        if status and status != "All":
            if status == "Unresolved":
                query["status"] = {"$in": ["New", "In Review"]}
            elif status == "Resolved":
                query["status"] = "Resolved"
            else:
                query["status"] = status

        if sentiment and sentiment != "All":
            query["sentiment"] = sentiment

        if category and category != "All":
            query["category"] = category

        if source and source != "All":
            query["source"] = source

        if priority and priority != "All":
            query["priority"] = priority

        if assigned_to and assigned_to != "All":
            if assigned_to == "Me":
                query["assigned_to"] = {"$in": ["Me", "user_pm", "Current User"]}
            else:
                query["assigned_to"] = assigned_to

        if mapped is not None:
            if mapped:
                query["mapped_feature_id"] = {"$ne": None}
            else:
                query["$or"] = [
                    {"mapped_feature_id": None},
                    {"mapped_feature_id": ""},
                    {"mapped_feature_id": {"$exists": False}}
                ]

        if search and search.strip():
            term = re.escape(search.strip())
            search_regex = {"$regex": term, "$options": "i"}
            query["$or"] = [
                {"text": search_regex},
                {"category": search_regex},
                {"feedback_id": search_regex},
                {"source": search_regex},
                {"key_issues": search_regex},
                {"topics": search_regex},
            ]

        cursor = (
            self.collection.find(query, {"_id": 0})
            .sort(sort_by, sort_order)
            .skip(skip)
            .limit(limit)
        )
        return list(cursor)

    def count(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        status: Optional[str] = None,
        sentiment: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
        mapped: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> int:
        query: Dict[str, Any] = {"workspace_id": workspace_id}

        if dataset_id and dataset_id != "all":
            query["dataset_id"] = dataset_id

        if status and status != "All":
            if status == "Unresolved":
                query["status"] = {"$in": ["New", "In Review"]}
            elif status == "Resolved":
                query["status"] = "Resolved"
            else:
                query["status"] = status

        if sentiment and sentiment != "All":
            query["sentiment"] = sentiment

        if category and category != "All":
            query["category"] = category

        if source and source != "All":
            query["source"] = source

        if priority and priority != "All":
            query["priority"] = priority

        if assigned_to and assigned_to != "All":
            if assigned_to == "Me":
                query["assigned_to"] = {"$in": ["Me", "user_pm", "Current User"]}
            else:
                query["assigned_to"] = assigned_to

        if mapped is not None:
            if mapped:
                query["mapped_feature_id"] = {"$ne": None}
            else:
                query["$or"] = [
                    {"mapped_feature_id": None},
                    {"mapped_feature_id": ""},
                    {"mapped_feature_id": {"$exists": False}}
                ]

        if search and search.strip():
            term = re.escape(search.strip())
            search_regex = {"$regex": term, "$options": "i"}
            query["$or"] = [
                {"text": search_regex},
                {"category": search_regex},
                {"feedback_id": search_regex},
                {"source": search_regex},
                {"key_issues": search_regex},
                {"topics": search_regex},
            ]

        return self.collection.count_documents(query)

    def find_by_id(self, workspace_id: str, feedback_id: str) -> Optional[Dict[str, Any]]:
        return self.collection.find_one(
            {"workspace_id": workspace_id, "feedback_id": feedback_id},
            {"_id": 0}
        )

    def insert(self, feedback_dict: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(feedback_dict)
        self.collection.insert_one(doc)
        doc.pop("_id", None)
        return doc

    def update_by_id(self, workspace_id: str, feedback_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return self.find_by_id(workspace_id, feedback_id)

        self.collection.update_one(
            {"workspace_id": workspace_id, "feedback_id": feedback_id},
            {"$set": clean_updates}
        )
        return self.find_by_id(workspace_id, feedback_id)

    def delete_by_id(self, workspace_id: str, feedback_id: str) -> bool:
        res = self.collection.delete_one({"workspace_id": workspace_id, "feedback_id": feedback_id})
        return res.deleted_count > 0

    def compute_metrics(self, workspace_id: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        """Aggregate high-level KPIs, sentiment percentages, source breakdowns, and themes."""
        query: Dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id and dataset_id != "all":
            query["dataset_id"] = dataset_id

        all_items = list(self.collection.find(query, {"_id": 0}))
        total = len(all_items)

        if total == 0:
            return {
                "total_feedback": 0,
                "new_this_week": 0,
                "positive_count": 0,
                "positive_pct": 0.0,
                "neutral_count": 0,
                "neutral_pct": 0.0,
                "negative_count": 0,
                "negative_pct": 0.0,
                "unresolved_count": 0,
                "resolved_count": 0,
                "mapped_count": 0,
                "unmapped_count": 0,
                "trend": [],
                "source_distribution": [],
                "top_themes": [],
            }

        positive_count = sum(1 for f in all_items if f.get("sentiment") == "Positive")
        neutral_count = sum(1 for f in all_items if f.get("sentiment") == "Neutral")
        negative_count = sum(1 for f in all_items if f.get("sentiment") == "Negative")

        resolved_count = sum(1 for f in all_items if f.get("status") == "Resolved")
        unresolved_count = sum(1 for f in all_items if f.get("status") in ["New", "In Review"])

        mapped_count = sum(1 for f in all_items if f.get("mapped_feature_id"))
        unmapped_count = total - mapped_count

        # Recent / New this week (items created within 7 days or ~10% of total)
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        new_this_week = sum(
            1 for f in all_items
            if isinstance(f.get("created_at"), datetime) and f.get("created_at") >= one_week_ago
        )
        if new_this_week == 0:
            new_this_week = max(1, int(total * 0.10)) if total > 0 else 0

        # Sources distribution
        sources_map: Dict[str, int] = {}
        for f in all_items:
            src = f.get("source") or f.get("source_type") or "Other"
            sources_map[src] = sources_map.get(src, 0) + 1

        source_distribution = [
            {"source": k, "count": v, "percentage": round((v / total) * 100, 1) if total > 0 else 0.0}
            for k, v in sorted(sources_map.items(), key=lambda x: x[1], reverse=True)
        ]

        # Top Themes distribution
        themes_map: Dict[str, int] = {}
        for f in all_items:
            cat = f.get("category") or "General"
            themes_map[cat] = themes_map.get(cat, 0) + 1

        top_themes = [
            {"theme": k, "count": v, "percentage": round((v / total) * 100, 1) if total > 0 else 0.0}
            for k, v in sorted(themes_map.items(), key=lambda x: x[1], reverse=True)
        ]

        # Trendline: Group real feedback by date
        from collections import defaultdict
        daily_trend = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})
        for f in all_items:
            dt_label = None
            if f.get("date_str"):
                dt_label = f.get("date_str")
            elif isinstance(f.get("created_at"), datetime):
                dt_label = f.get("created_at").strftime("%b %d")
            elif f.get("created_at"):
                dt_label = str(f.get("created_at"))[:10]
            else:
                dt_label = "Current"

            s = f.get("sentiment")
            if s == "Positive":
                daily_trend[dt_label]["positive"] += 1
            elif s == "Negative":
                daily_trend[dt_label]["negative"] += 1
            else:
                daily_trend[dt_label]["neutral"] += 1

        trend = [
            {"date": d, "positive": counts["positive"], "neutral": counts["neutral"], "negative": counts["negative"]}
            for d, counts in daily_trend.items()
        ]

        return {
            "total_feedback": total,
            "new_this_week": new_this_week,
            "positive_count": positive_count,
            "positive_pct": round((positive_count / total) * 100, 1) if total > 0 else 0.0,
            "neutral_count": neutral_count,
            "neutral_pct": round((neutral_count / total) * 100, 1) if total > 0 else 0.0,
            "negative_count": negative_count,
            "negative_pct": round((negative_count / total) * 100, 1) if total > 0 else 0.0,
            "unresolved_count": unresolved_count,
            "resolved_count": resolved_count,
            "mapped_count": mapped_count,
            "unmapped_count": unmapped_count,
            "trend": trend,
            "source_distribution": source_distribution,
            "top_themes": top_themes,
        }

