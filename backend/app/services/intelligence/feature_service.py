"""
feature_service.py
------------------
Service handling Feature Lifecycle Management and Real-time Feature Extraction
from customer feedback records, sentiment, and AI clusters.
"""

from __future__ import annotations

import uuid
from typing import Any, Optional
from datetime import datetime, timezone

from app.core.logging import get_logger
from app.models.feature import ProductFeatureModel
from app.repositories.feature_repository import feature_repository
from app.core.database import analyses_collection, raw_data_collection, cleaned_data_collection
from app.services.workspace.activity_service import activity_service
from app.utils.serialization import serialize_document, serialize_documents

logger = get_logger(__name__)

CANONICAL_FEATURES = [
    {
        "name": "One-click checkout",
        "desc": "Simplify purchase flow with single click checkout",
        "long_desc": "Users want a faster and simpler checkout experience. This feature allows customers to complete their purchase in a single click using their saved payment and address details.",
        "category": "Checkout & Payments",
        "priority": "Critical",
        "status": "In Progress",
        "users_impacted": 8542,
        "feedback_count": 352,
        "source": "Customer Support, App Reviews, Surveys",
        "owner": "Priya Sharma (PM)",
        "icon_type": "cart",
        "created_on": "Aug 28, 2025",
        "last_updated": "Aug 30, 2025",
        "top_feedback": [
            {"text": "Checkout process takes too long. One click buy like Amazon would save so much friction.", "date": "Aug 30, 2025", "source": "App Store"},
            {"text": "Payment gateway reloads frequently when re-entering CVV, wish details were saved.", "date": "Aug 28, 2025", "source": "Support Ticket"},
            {"text": "Can we get quick buy button directly on product catalog page?", "date": "Aug 26, 2025", "source": "Customer Survey"},
        ],
        "prd_linked": False,
        "roadmap_status": "In Progress (Sprint 24)",
        "prioritization_score": 92.5,
    },
    {
        "name": "Multiple payment options",
        "desc": "Support more payment methods",
        "long_desc": "Support regional and digital wallets including PhonePe, Google Pay, UPI auto-pay, and EMI gateways to reduce checkout drop-off.",
        "category": "Payments",
        "priority": "High",
        "status": "Implemented",
        "users_impacted": 6231,
        "feedback_count": 289,
        "source": "Customer Support, In-App Feedback",
        "owner": "Arjun Mehta",
        "icon_type": "wallet",
        "created_on": "Aug 20, 2025",
        "last_updated": "Aug 29, 2025",
        "top_feedback": [
            {"text": "Please integrate UPI 2.0 and credit card EMI options.", "date": "Aug 27, 2025", "source": "Support Ticket"},
            {"text": "Apple Pay and Google Pay integration made checking out effortless.", "date": "Aug 21, 2025", "source": "App Store"},
        ],
        "prd_linked": True,
        "roadmap_status": "Shipped (v2.4)",
        "prioritization_score": 88.0,
    },
    {
        "name": "Order tracking in real-time",
        "desc": "Live order status and updates",
        "long_desc": "Provide end-to-end courier webhooks with live map view, estimated delivery time window, and SMS/push notifications upon delivery milestones.",
        "category": "Order Management",
        "priority": "High",
        "status": "In Progress",
        "users_impacted": 5412,
        "feedback_count": 241,
        "source": "Customer Support, App Reviews",
        "owner": "Rohit Singh",
        "icon_type": "truck",
        "created_on": "Aug 18, 2025",
        "last_updated": "Aug 28, 2025",
        "top_feedback": [
            {"text": "Tracking page only says 'In Transit' for 3 days with no updates on courier location.", "date": "Aug 27, 2025", "source": "Zendesk"},
            {"text": "Need real-time driver tracking for local express delivery orders.", "date": "Aug 22, 2025", "source": "In-App"},
        ],
        "prd_linked": True,
        "roadmap_status": "In Development",
        "prioritization_score": 84.5,
    },
    {
        "name": "Dark mode",
        "desc": "Add dark theme for better UX",
        "long_desc": "Comprehensive OLED dark mode theme across mobile app and web portal to reduce eye fatigue during nighttime browsing.",
        "category": "UI / UX",
        "priority": "Medium",
        "status": "Planned",
        "users_impacted": 3842,
        "feedback_count": 186,
        "source": "In-App Feedback, Email",
        "owner": "Neha Kapoor",
        "icon_type": "moon",
        "created_on": "Aug 15, 2025",
        "last_updated": "Aug 26, 2025",
        "top_feedback": [
            {"text": "The bright white app interface is too harsh at night. Please give us dark mode!", "date": "Aug 25, 2025", "source": "App Review"},
        ],
        "prd_linked": False,
        "roadmap_status": "Q4 Roadmap",
        "prioritization_score": 72.0,
    },
    {
        "name": "Wishlist",
        "desc": "Save products for later",
        "long_desc": "Allow shoppers to save favourite items into customizable folders, share wishlists via social links, and receive automated back-in-stock alerts.",
        "category": "Product Discovery",
        "priority": "Medium",
        "status": "Planned",
        "users_impacted": 3210,
        "feedback_count": 153,
        "source": "Customer Support, Surveys",
        "owner": "Priya Sharma (PM)",
        "icon_type": "heart",
        "created_on": "Aug 10, 2025",
        "last_updated": "Aug 24, 2025",
        "top_feedback": [
            {"text": "I lose track of items I want to buy later when clearing my active cart.", "date": "Aug 23, 2025", "source": "Survey"},
        ],
        "prd_linked": False,
        "roadmap_status": "Planned (Sprint 26)",
        "prioritization_score": 68.5,
    },
    {
        "name": "Guest checkout",
        "desc": "Checkout without account",
        "long_desc": "Remove mandatory password setup and login requirements before payment to eliminate drop-off from one-time shoppers.",
        "category": "Checkout & Payments",
        "priority": "High",
        "status": "Implemented",
        "users_impacted": 4125,
        "feedback_count": 132,
        "source": "Customer Support, Analytics",
        "owner": "Arjun Mehta",
        "icon_type": "user",
        "created_on": "Aug 05, 2025",
        "last_updated": "Aug 22, 2025",
        "top_feedback": [
            {"text": "Allow guest checkout option so I don't need another password for a single gift order.", "date": "Aug 19, 2025", "source": "Support Ticket"},
        ],
        "prd_linked": True,
        "roadmap_status": "Shipped (v2.3)",
        "prioritization_score": 79.0,
    },
    {
        "name": "Price drop alerts",
        "desc": "Notify users when price drops",
        "long_desc": "Automated email and push notifications when a price drop or seasonal promotion occurs on bookmarked or viewed products.",
        "category": "Notifications",
        "priority": "Low",
        "status": "Not Started",
        "users_impacted": 2134,
        "feedback_count": 98,
        "source": "Email, Surveys",
        "owner": "Rohit Singh",
        "icon_type": "bell",
        "created_on": "Jul 28, 2025",
        "last_updated": "Aug 15, 2025",
        "top_feedback": [
            {"text": "Would love an alert whenever items on my list go on sale.", "date": "Aug 10, 2025", "source": "Email"},
        ],
        "prd_linked": False,
        "roadmap_status": "Backlog",
        "prioritization_score": 55.0,
    },
    {
        "name": "Product size guide",
        "desc": "Add size chart for clothing",
        "long_desc": "Interactive sizing charts with centimeter and inch converters, model measurement references, and fit recommendations to minimize apparel returns.",
        "category": "Product Info",
        "priority": "Low",
        "status": "Not Started",
        "users_impacted": 1316,
        "feedback_count": 64,
        "source": "Customer Support, App Reviews",
        "owner": "Neha Kapoor",
        "icon_type": "ruler",
        "created_on": "Jul 22, 2025",
        "last_updated": "Aug 10, 2025",
        "top_feedback": [
            {"text": "Need exact chest and shoulder measurements to avoid ordering the wrong size.", "date": "Aug 05, 2025", "source": "Support Ticket"},
        ],
        "prd_linked": False,
        "roadmap_status": "Backlog",
        "prioritization_score": 52.0,
    },
    {
        "name": "AI product recommendations",
        "desc": "Personalized suggestions",
        "long_desc": "Real-time collaborative filtering and semantic product recommendations on PDP and cart screens based on browsing history.",
        "category": "AI / ML",
        "priority": "Medium",
        "status": "In Progress",
        "users_impacted": 4982,
        "feedback_count": 221,
        "source": "Analytics, In-App Feedback",
        "owner": "Priya Sharma (PM)",
        "icon_type": "sparkles",
        "created_on": "Jul 18, 2025",
        "last_updated": "Aug 28, 2025",
        "top_feedback": [
            {"text": "Recommended items on cart are actually very helpful; would love personalized daily picks.", "date": "Aug 26, 2025", "source": "In-App"},
        ],
        "prd_linked": True,
        "roadmap_status": "In Development (Phase 2)",
        "prioritization_score": 81.0,
    },
    {
        "name": "Saved addresses",
        "desc": "Manage multiple addresses",
        "long_desc": "Allow customers to manage multiple shipping and billing profiles with labels like Home, Office, or Family.",
        "category": "Account Management",
        "priority": "Low",
        "status": "Planned",
        "users_impacted": 1024,
        "feedback_count": 53,
        "source": "Customer Support, In-App Feedback",
        "owner": "Arjun Mehta",
        "icon_type": "address",
        "created_on": "Jul 12, 2025",
        "last_updated": "Aug 20, 2025",
        "top_feedback": [
            {"text": "Can we save home and work addresses separately without overriding default?", "date": "Aug 18, 2025", "source": "Support Ticket"},
        ],
        "prd_linked": False,
        "roadmap_status": "Planned",
        "prioritization_score": 60.0,
    },
]


class FeatureService:
    """Business logic for feature extraction, management, and workflow transitions."""

    def ensure_features(self, workspace_id: str, dataset_id: Optional[str] = None) -> list[dict[str, Any]]:
        """Ensure features exist in MongoDB for the workspace, seeding canonical features if empty."""
        features, total = feature_repository.list_features(workspace_id=workspace_id, dataset_id=dataset_id, limit=100)
        if total == 0:
            logger.info(f"Seeding canonical feature catalog for workspace={workspace_id}")
            created_list = []
            for item in CANONICAL_FEATURES:
                doc = ProductFeatureModel.create_document(
                    workspace_id=workspace_id,
                    name=item["name"],
                    desc=item["desc"],
                    long_desc=item.get("long_desc", ""),
                    category=item.get("category", "General"),
                    priority=item.get("priority", "Medium"),
                    status=item.get("status", "Planned"),
                    users_impacted=item.get("users_impacted", 0),
                    feedback_count=item.get("feedback_count", 0),
                    source=item.get("source", "Customer Support"),
                    owner=item.get("owner", "Priya Sharma (PM)"),
                    icon_type=item.get("icon_type", "card"),
                    created_on=item.get("created_on"),
                    last_updated=item.get("last_updated"),
                    top_feedback=item.get("top_feedback", []),
                    prd_linked=item.get("prd_linked", False),
                    roadmap_status=item.get("roadmap_status"),
                    prioritization_score=item.get("prioritization_score", 50.0),
                    dataset_id=dataset_id,
                )
                feature_repository.create(doc)
                created_list.append(doc)
            return created_list

        return features

    def list_features(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict[str, Any]:
        """Fetch filtered features and dynamic metrics summary."""
        self.ensure_features(workspace_id, dataset_id)
        features, total = feature_repository.list_features(
            workspace_id=workspace_id,
            dataset_id=dataset_id,
            status=status,
            priority=priority,
            category=category,
            source=source,
            search=search,
            skip=skip,
            limit=limit,
        )
        metrics = feature_repository.get_metrics_summary(workspace_id, dataset_id)
        return {
            "features": serialize_documents(features),
            "metrics": metrics,
            "total_count": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "page_size": limit,
        }

    def get_feature(self, feature_id: str, workspace_id: str) -> dict[str, Any] | None:
        """Get single feature details."""
        doc = feature_repository.find_by_feature_id(feature_id, workspace_id)
        if not doc:
            return None
        return serialize_document(doc)

    def create_feature(self, workspace_id: str, data: dict[str, Any], user_name: str = "Priya Sharma (PM)") -> dict[str, Any]:
        """Create a new feature item in MongoDB."""
        doc = ProductFeatureModel.create_document(
            workspace_id=workspace_id,
            name=data["name"],
            desc=data["desc"],
            long_desc=data.get("long_desc") or data["desc"],
            category=data.get("category", "General"),
            priority=data.get("priority", "Medium"),
            status=data.get("status", "Planned"),
            users_impacted=data.get("users_impacted", 100),
            feedback_count=data.get("feedback_count", 1),
            source=data.get("source", "Internal Planning"),
            owner=data.get("owner", user_name),
            dataset_id=data.get("dataset_id"),
            icon_type=data.get("icon_type", "card"),
        )
        feature_repository.create(doc)

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="feature_created",
            title=f'Feature "{doc["name"]}" created',
            description=f'Added to {doc["category"]} with status {doc["status"]}',
            metadata={"feature_id": doc["feature_id"]},
        )
        return serialize_document(doc)

    def update_feature(self, feature_id: str, workspace_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
        """Edit feature attributes (status, priority, category, owner, description)."""
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        updated = feature_repository.update_feature(feature_id, workspace_id, clean_update)
        if updated:
            activity_service.log_activity(
                workspace_id=workspace_id,
                action="feature_updated",
                title=f'Feature "{updated.get("name")}" updated',
                description=f'Status: {updated.get("status")}, Priority: {updated.get("priority")}',
                metadata={"feature_id": feature_id},
            )
        return serialize_document(updated) if updated else None

    def send_to_prioritization(self, feature_id: str, workspace_id: str) -> dict[str, Any] | None:
        """Mark feature as sent to prioritization pipeline."""
        return self.update_feature(feature_id, workspace_id, {
            "roadmap_status": "In Prioritization Review",
            "prioritization_score": 85.0,
        })

    def link_prd(self, feature_id: str, workspace_id: str) -> dict[str, Any] | None:
        """Link feature to PRD."""
        return self.update_feature(feature_id, workspace_id, {
            "prd_linked": True,
            "prd_id": f"prd-{uuid.uuid4().hex[:8]}",
        })

    def add_to_roadmap(self, feature_id: str, workspace_id: str) -> dict[str, Any] | None:
        """Add feature to development roadmap."""
        return self.update_feature(feature_id, workspace_id, {
            "status": "Planned",
            "roadmap_status": "Scheduled in Roadmap (Sprint 25)",
        })

    def extract_features_from_feedback(self, workspace_id: str, dataset_id: Optional[str] = None) -> list[dict[str, Any]]:
        """
        Real-time Feature Extraction:
        Reads analyzed feedback records from MongoDB, detects customer requested capabilities,
        deduplicates and scores them, and upserts into product_features.
        """
        query: dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            query["dataset_id"] = dataset_id

        # Query analyzed feedback records
        records = list(analyses_collection.find(query).limit(200))
        if not records:
            # Fallback to cleaned or raw feedback text
            records = list(cleaned_data_collection.find(query).limit(100)) or list(raw_data_collection.find(query).limit(100))

        extracted_features = []
        for rec in records:
            analysis = rec.get("analysis", {})
            reqs = analysis.get("feature_requests", [])
            theme = analysis.get("theme") or rec.get("category") or "Customer Feedback"
            raw_text = rec.get("text") or rec.get("feedback_text") or rec.get("original_text") or ""

            if not reqs and ("add" in raw_text.lower() or "need" in raw_text.lower() or "wish" in raw_text.lower() or "support" in raw_text.lower()):
                reqs.append(raw_text[:70])

            for req in reqs:
                feat_name = req.strip().capitalize()
                if len(feat_name) < 4:
                    continue

                # Check if already exists in repository
                existing = feature_repository.find_by_feature_id(feat_name, workspace_id)
                if existing:
                    # Update count
                    feature_repository.update_feature(existing["feature_id"], workspace_id, {
                        "feedback_count": existing.get("feedback_count", 0) + 1,
                        "users_impacted": existing.get("users_impacted", 0) + 50,
                    })
                else:
                    doc = ProductFeatureModel.create_document(
                        workspace_id=workspace_id,
                        name=feat_name,
                        desc=f"Extracted customer feature demand for {theme}.",
                        long_desc=raw_text or f"Customer requested capability for {theme}.",
                        category=theme,
                        priority="Medium" if "urgent" not in raw_text.lower() else "High",
                        status="Planned",
                        users_impacted=350,
                        feedback_count=1,
                        source="Analyzed Feedback",
                        owner="Priya Sharma (PM)",
                        dataset_id=dataset_id,
                        top_feedback=[{"text": raw_text[:120], "date": datetime.now(timezone.utc).strftime("%b %d, %Y")}],
                    )
                    feature_repository.create(doc)
                    extracted_features.append(doc)

        logger.info(f"Extracted {len(extracted_features)} new feature requests from feedback.")
        return serialize_documents(extracted_features)


feature_service = FeatureService()

