"""
Service for Customer Feedback Management.
Handles seed data initialization, filtering, AI analysis extraction, manual entry, and feature linking.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.repositories.feedback_repository import FeedbackRepository
from app.repositories.feature_repository import FeatureRepository
from app.models.feedback import CustomerFeedbackModel
from app.schemas.feedback import (
    FeedbackCreateRequest,
    FeedbackUpdateRequest,
    FeedbackMapFeatureRequest,
    FeedbackListResponse,
    FeedbackMetricsResponse,
    FeedbackItemResponse,
)


class FeedbackService:
    def __init__(self):
        self.repo = FeedbackRepository()
        self.feature_repo = FeatureRepository()

    def _generate_feedback_id(self, workspace_id: str) -> str:
        count = self.repo.count(workspace_id)
        return f"FB-{str(count + 1).zfill(3)}"

    def seed_initial_feedback_if_empty(self, workspace_id: str) -> None:
        """Seed realistic customer feedback records matching the reference specification."""
        if self.repo.count(workspace_id) > 0:
            return

        sample_items = [
            {
                "feedback_id": "FB-001",
                "text": "Great product, love the new design and seamless navigation!",
                "source": "App Store",
                "sentiment": "Positive",
                "sentiment_score": 0.85,
                "category": "UI/UX",
                "priority": "Low",
                "status": "New",
                "assigned_to": "Unassigned",
                "user_id": "user_101",
                "device": "iOS",
                "app_version": "v2.3.1",
                "date_str": "Jul 31, 2025",
                "key_issues": ["Navigation praises", "Visual design feedback"],
                "suggested_feature": "Design system expansion",
                "topics": ["design", "ui", "navigation"],
            },
            {
                "feedback_id": "FB-002",
                "text": "Checkout process is too slow and sometimes it fails, I have to try multiple times to complete my purchase.",
                "source": "Play Store",
                "sentiment": "Negative",
                "sentiment_score": -0.82,
                "category": "Checkout & Payments",
                "priority": "Critical",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_12345",
                "device": "Android",
                "app_version": "v2.3.1",
                "date_str": "Jul 31, 2025",
                "key_issues": [
                    "Slow checkout process",
                    "Payment failure",
                    "Multiple retries needed",
                ],
                "suggested_feature": "Improve checkout performance",
                "mapped_feature_id": "feat-checkout-perf",
                "mapped_feature_name": "Improve checkout performance",
                "topics": ["checkout", "payment", "performance", "error", "slow", "bug"],
            },
            {
                "feedback_id": "FB-003",
                "text": "Need dark mode option in the mobile app for night shopping.",
                "source": "Support",
                "sentiment": "Neutral",
                "sentiment_score": 0.1,
                "category": "UI/UX",
                "priority": "Medium",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_303",
                "device": "Android",
                "app_version": "v2.3.0",
                "date_str": "Jul 30, 2025",
                "resolution_date": "Jul 31, 2025",
                "key_issues": ["Night readability", "OLED battery saving"],
                "suggested_feature": "Dark Mode Support",
                "mapped_feature_id": "feat-dark-mode",
                "mapped_feature_name": "Dark Mode Support",
                "topics": ["dark mode", "ui", "accessibility"],
            },
            {
                "feedback_id": "FB-004",
                "text": "Add multiple payment options like Apple Pay, Google Pay and digital wallets.",
                "source": "Survey",
                "sentiment": "Positive",
                "sentiment_score": 0.72,
                "category": "Checkout & Payments",
                "priority": "High",
                "status": "New",
                "assigned_to": "Me",
                "user_id": "user_404",
                "device": "iOS",
                "app_version": "v2.3.1",
                "date_str": "Jul 30, 2025",
                "key_issues": ["Wallet payment methods missing"],
                "suggested_feature": "Add multiple payment options",
                "topics": ["payments", "wallets", "apple pay"],
            },
            {
                "feedback_id": "FB-005",
                "text": "App crashes on iOS when applying discount coupons at the payment screen.",
                "source": "App Store",
                "sentiment": "Negative",
                "sentiment_score": -0.89,
                "category": "Performance & Speed",
                "priority": "High",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_505",
                "device": "iOS",
                "app_version": "v2.3.1",
                "date_str": "Jul 29, 2025",
                "key_issues": ["App crash on coupon apply", "Memory spike"],
                "suggested_feature": "Stabilize iOS app",
                "mapped_feature_id": "feat-ios-stability",
                "mapped_feature_name": "Stabilize iOS app",
                "topics": ["crash", "ios", "coupon", "checkout"],
            },
            {
                "feedback_id": "FB-006",
                "text": "Product pricing is significantly more expensive than competitor alternatives.",
                "source": "Social Media",
                "sentiment": "Negative",
                "sentiment_score": -0.55,
                "category": "Pricing",
                "priority": "High",
                "status": "New",
                "assigned_to": "Unassigned",
                "user_id": "user_606",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 29, 2025",
                "key_issues": ["Price perception", "Competitor pricing gap"],
                "topics": ["pricing", "cost", "competitors"],
            },
            {
                "feedback_id": "FB-007",
                "text": "Please add wishlist feature so I can save items for future purchases.",
                "source": "Play Store",
                "sentiment": "Positive",
                "sentiment_score": 0.65,
                "category": "Product Features",
                "priority": "Medium",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_707",
                "device": "Android",
                "app_version": "v2.3.0",
                "date_str": "Jul 28, 2025",
                "resolution_date": "Jul 29, 2025",
                "key_issues": ["Item bookmarking"],
                "suggested_feature": "Wishlist and Favorites",
                "topics": ["wishlist", "save for later"],
            },
            {
                "feedback_id": "FB-008",
                "text": "Improve search results and add faceted filters for size, color and availability.",
                "source": "Support",
                "sentiment": "Neutral",
                "sentiment_score": 0.05,
                "category": "Product Features",
                "priority": "Medium",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_808",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 28, 2025",
                "key_issues": ["Search filtering missing filters", "Zero results error"],
                "suggested_feature": "Advanced Search and Filters",
                "topics": ["search", "filters", "discovery"],
            },
            {
                "feedback_id": "FB-009",
                "text": "Login failure on Android device with fingerprint authentication.",
                "source": "App Store",
                "sentiment": "Negative",
                "sentiment_score": -0.74,
                "category": "Account & Login",
                "priority": "High",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_909",
                "device": "Android",
                "app_version": "v2.3.0",
                "date_str": "Jul 27, 2025",
                "resolution_date": "Jul 28, 2025",
                "key_issues": ["Biometric auth failure", "Account lock"],
                "suggested_feature": "Improve login reliability",
                "mapped_feature_id": "feat-login-reliability",
                "mapped_feature_name": "Improve login reliability",
                "topics": ["login", "auth", "biometrics", "android"],
            },
            {
                "feedback_id": "FB-010",
                "text": "More product categories and intuitive breadcrumbs would help discovery.",
                "source": "Survey",
                "sentiment": "Positive",
                "sentiment_score": 0.60,
                "category": "Product Features",
                "priority": "Low",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_010",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 27, 2025",
                "resolution_date": "Jul 28, 2025",
                "key_issues": ["Catalog organization"],
                "topics": ["categories", "navigation"],
            },
            {
                "feedback_id": "FB-011",
                "text": "Payment gateway timeout occurs frequently during checkout.",
                "source": "Support",
                "sentiment": "Negative",
                "sentiment_score": -0.80,
                "category": "Checkout & Payments",
                "priority": "Critical",
                "status": "New",
                "assigned_to": "Me",
                "user_id": "user_011",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 27, 2025",
                "key_issues": ["Gateway timeout", "Transaction drop"],
                "topics": ["payment", "timeout", "gateway"],
            },
            {
                "feedback_id": "FB-012",
                "text": "Add guest checkout option so I don't have to create an account to buy a single item.",
                "source": "Survey",
                "sentiment": "Positive",
                "sentiment_score": 0.75,
                "category": "Account & Login",
                "priority": "High",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_012",
                "device": "iOS",
                "app_version": "v2.3.1",
                "date_str": "Jul 27, 2025",
                "key_issues": ["Mandatory account creation barrier"],
                "suggested_feature": "Guest Checkout Mode",
                "topics": ["guest", "checkout", "login"],
            },
            {
                "feedback_id": "FB-013",
                "text": "Delivery tracking link is broken in email notifications.",
                "source": "Support",
                "sentiment": "Negative",
                "sentiment_score": -0.65,
                "category": "Others",
                "priority": "Medium",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_013",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 26, 2025",
                "resolution_date": "Jul 27, 2025",
                "key_issues": ["Broken tracking URL"],
                "topics": ["tracking", "email", "delivery"],
            },
            {
                "feedback_id": "FB-014",
                "text": "UI feels cluttered and text is too dense on mobile screens.",
                "source": "App Store",
                "sentiment": "Neutral",
                "sentiment_score": -0.15,
                "category": "UI/UX",
                "priority": "Medium",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_014",
                "device": "iOS",
                "app_version": "v2.3.1",
                "date_str": "Jul 26, 2025",
                "key_issues": ["Cluttered mobile interface"],
                "suggested_feature": "Redesign product UI",
                "mapped_feature_id": "feat-redesign-ui",
                "mapped_feature_name": "Redesign product UI",
                "topics": ["ui", "clutter", "mobile"],
            },
            {
                "feedback_id": "FB-015",
                "text": "Fix notification delay for order dispatch alerts.",
                "source": "Play Store",
                "sentiment": "Neutral",
                "sentiment_score": 0.0,
                "category": "Performance & Speed",
                "priority": "Low",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_015",
                "device": "Android",
                "app_version": "v2.3.0",
                "date_str": "Jul 25, 2025",
                "resolution_date": "Jul 26, 2025",
                "topics": ["notifications", "alerts", "dispatch"],
            },
            {
                "feedback_id": "FB-016",
                "text": "Need better filters for price range and rating.",
                "source": "Support",
                "sentiment": "Neutral",
                "sentiment_score": 0.2,
                "category": "Product Features",
                "priority": "Low",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_016",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 25, 2025",
                "topics": ["filters", "pricing", "ratings"],
            },
            {
                "feedback_id": "FB-020",
                "text": "Improve profile editing options to update delivery address easily.",
                "source": "Support",
                "sentiment": "Neutral",
                "sentiment_score": 0.1,
                "category": "Account & Login",
                "priority": "Low",
                "status": "Resolved",
                "assigned_to": "Unassigned",
                "user_id": "user_020",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 24, 2025",
                "resolution_date": "Jul 25, 2025",
                "topics": ["profile", "address", "account"],
            },
            {
                "feedback_id": "FB-021",
                "text": "Payment option missing for net banking and local UPI transfers.",
                "source": "Survey",
                "sentiment": "Negative",
                "sentiment_score": -0.68,
                "category": "Checkout & Payments",
                "priority": "High",
                "status": "In Review",
                "assigned_to": "Me",
                "user_id": "user_021",
                "device": "Android",
                "app_version": "v2.3.1",
                "date_str": "Jul 24, 2025",
                "key_issues": ["Missing local payment rails"],
                "suggested_feature": "Add multiple payment options",
                "mapped_feature_id": "feat-payment-options",
                "mapped_feature_name": "Add multiple payment options",
                "topics": ["payments", "upi", "banking"],
            },
            {
                "feedback_id": "FB-024",
                "text": "Search results are irrelevant when searching for complex product names.",
                "source": "Survey",
                "sentiment": "Negative",
                "sentiment_score": -0.61,
                "category": "Product Features",
                "priority": "High",
                "status": "New",
                "assigned_to": "Unassigned",
                "user_id": "user_024",
                "device": "Web",
                "app_version": "Web",
                "date_str": "Jul 24, 2025",
                "topics": ["search", "relevance", "catalog"],
            },
            {
                "feedback_id": "FB-025",
                "text": "App crashes frequently on Android tablet view.",
                "source": "Play Store",
                "sentiment": "Negative",
                "sentiment_score": -0.87,
                "category": "Performance & Speed",
                "priority": "High",
                "status": "New",
                "assigned_to": "Unassigned",
                "user_id": "user_025",
                "device": "Android",
                "app_version": "v2.3.1",
                "date_str": "Jul 23, 2025",
                "topics": ["crash", "android", "tablet"],
            }
        ]

        for item in sample_items:
            doc = CustomerFeedbackModel(
                workspace_id=workspace_id,
                feedback_id=item["feedback_id"],
                text=item["text"],
                source=item.get("source", "App Store"),
                sentiment=item.get("sentiment", "Neutral"),
                sentiment_score=item.get("sentiment_score", 0.0),
                category=item.get("category", "General"),
                priority=item.get("priority", "Medium"),
                status=item.get("status", "New"),
                assigned_to=item.get("assigned_to", "Unassigned"),
                user_id=item.get("user_id"),
                device=item.get("device"),
                app_version=item.get("app_version"),
                date_str=item.get("date_str", "Jul 31, 2025"),
                key_issues=item.get("key_issues", []),
                suggested_feature=item.get("suggested_feature"),
                mapped_feature_id=item.get("mapped_feature_id"),
                mapped_feature_name=item.get("mapped_feature_name"),
                topics=item.get("topics", []),
                resolution_date=item.get("resolution_date"),
            ).model_dump()
            self.repo.insert(doc)

    def list_feedback(
        self,
        workspace_id: str,
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
    ) -> FeedbackListResponse:
        self.seed_initial_feedback_if_empty(workspace_id)

        items = self.repo.find_all(
            workspace_id=workspace_id,
            status=status,
            sentiment=sentiment,
            category=category,
            source=source,
            priority=priority,
            assigned_to=assigned_to,
            mapped=mapped,
            search=search,
            skip=skip,
            limit=limit,
        )
        total = self.repo.count(
            workspace_id=workspace_id,
            status=status,
            sentiment=sentiment,
            category=category,
            source=source,
            priority=priority,
            assigned_to=assigned_to,
            mapped=mapped,
            search=search,
        )
        metrics_dict = self.repo.compute_metrics(workspace_id)

        feedback_list = [
            FeedbackItemResponse(
                feedback_id=item["feedback_id"],
                workspace_id=item["workspace_id"],
                dataset_id=item.get("dataset_id"),
                text=item["text"],
                source=item.get("source", "App Store"),
                sentiment=item.get("sentiment", "Neutral"),
                sentiment_score=item.get("sentiment_score", 0.0),
                category=item.get("category", "General"),
                priority=item.get("priority", "Medium"),
                status=item.get("status", "New"),
                assigned_to=item.get("assigned_to", "Unassigned"),
                user_id=item.get("user_id"),
                device=item.get("device"),
                app_version=item.get("app_version"),
                date_str=item.get("date_str", "Jul 31, 2025"),
                key_issues=item.get("key_issues", []),
                suggested_feature=item.get("suggested_feature"),
                mapped_feature_id=item.get("mapped_feature_id"),
                mapped_feature_name=item.get("mapped_feature_name"),
                topics=item.get("topics", []),
                resolution_date=item.get("resolution_date"),
                metadata=item.get("metadata", {}),
            )
            for item in items
        ]

        return FeedbackListResponse(
            feedback=feedback_list,
            total=total,
            metrics=FeedbackMetricsResponse(**metrics_dict),
        )

    def get_metrics(self, workspace_id: str) -> FeedbackMetricsResponse:
        self.seed_initial_feedback_if_empty(workspace_id)
        metrics_dict = self.repo.compute_metrics(workspace_id)
        return FeedbackMetricsResponse(**metrics_dict)

    def get_feedback_by_id(self, workspace_id: str, feedback_id: str) -> Optional[FeedbackItemResponse]:
        self.seed_initial_feedback_if_empty(workspace_id)
        item = self.repo.find_by_id(workspace_id, feedback_id)
        if not item:
            return None
        return FeedbackItemResponse(**item)

    def create_feedback(self, workspace_id: str, req: FeedbackCreateRequest) -> FeedbackItemResponse:
        now = datetime.utcnow()
        date_str = now.strftime("%b %d, %Y")
        fb_id = self._generate_feedback_id(workspace_id)

        # Basic automatic sentiment scoring heuristic if manual
        score = 0.0
        if req.sentiment == "Positive":
            score = 0.75
        elif req.sentiment == "Negative":
            score = -0.75

        # Heuristic keywords extraction
        words = [w.lower().strip(".,!?:;\"'") for w in req.text.split() if len(w) > 3]
        topics = list(set(words))[:6]

        model = CustomerFeedbackModel(
            workspace_id=workspace_id,
            feedback_id=fb_id,
            text=req.text,
            source=req.source,
            sentiment=req.sentiment or "Neutral",
            sentiment_score=score,
            category=req.category,
            priority=req.priority or "Medium",
            status=req.status or "New",
            assigned_to=req.assigned_to or "Unassigned",
            user_id=req.user_id,
            device=req.device,
            app_version=req.app_version,
            created_at=now,
            date_str=date_str,
            key_issues=[req.text[:60] + "..."],
            topics=topics,
        )
        saved = self.repo.insert(model.model_dump())
        return FeedbackItemResponse(**saved)

    def update_feedback(
        self, workspace_id: str, feedback_id: str, req: FeedbackUpdateRequest
    ) -> Optional[FeedbackItemResponse]:
        updates: Dict[str, Any] = {}
        if req.status is not None:
            updates["status"] = req.status
            if req.status == "Resolved" and not req.resolution_date:
                updates["resolution_date"] = datetime.utcnow().strftime("%b %d, %Y")
        if req.priority is not None:
            updates["priority"] = req.priority
        if req.assigned_to is not None:
            updates["assigned_to"] = req.assigned_to
        if req.category is not None:
            updates["category"] = req.category
        if req.sentiment is not None:
            updates["sentiment"] = req.sentiment
        if req.resolution_date is not None:
            updates["resolution_date"] = req.resolution_date

        updated = self.repo.update_by_id(workspace_id, feedback_id, updates)
        if not updated:
            return None
        return FeedbackItemResponse(**updated)

    def map_feature(
        self, workspace_id: str, feedback_id: str, req: FeedbackMapFeatureRequest
    ) -> Optional[FeedbackItemResponse]:
        item = self.repo.find_by_id(workspace_id, feedback_id)
        if not item:
            return None

        feature_id = req.feature_id or f"feat-{str(uuid.uuid4())[:8]}"
        feature_name = req.feature_name or item.get("suggested_feature") or f"Feature: {item['text'][:40]}"

        updates = {
            "mapped_feature_id": feature_id,
            "mapped_feature_name": feature_name,
            "status": "In Review",
        }
        updated = self.repo.update_by_id(workspace_id, feedback_id, updates)
        return FeedbackItemResponse(**updated) if updated else None

