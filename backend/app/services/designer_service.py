"""
designer_service.py
-------------------
Business logic and MongoDB intelligence queries for Product Designer Workspaces.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import (
    prd_assignments_collection,
    prd_projects_collection as prds_collection,
    prd_requirements_collection,
    product_insights_collection as insights_collection,
    customer_feedback_collection as feedbacks_collection,
    workspaces_collection,
    product_features_collection as features_collection,
    design_submissions_collection,
    design_reviews_collection,
    blockers_collection,
    clarification_requests_collection,
)
from app.services.prd_assignment_service import prd_assignment_service
from app.schemas.designer import (
    DesignerDashboardResponse,
    DesignerTaskItem,
    UXRequirementDetail,
    DesignerProductContextResponse,
    DesignerCustomerFeedbackItem,
    DesignResponseSubmit,
    DesignDeliverableItem,
    DesignReviewCreate,
    BlockerCreate,
    ClarificationCreate,
    DesignSubmissionSnapshot,
)
from app.utils.serialization import serialize_document, serialize_documents


def _to_str_val(v: Any) -> str:
    if not v:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        if "primary_problem" in v:
            return str(v["primary_problem"])
        if "summary" in v:
            return str(v["summary"])
        if "description" in v:
            return str(v["description"])
        if "statement" in v:
            return str(v["statement"])
        if "problem" in v:
            return str(v["problem"])
        return " ".join(f"{k.replace('_', ' ').title()}: {val}" for k, val in v.items() if isinstance(val, (str, int, float)))
    if isinstance(v, (list, tuple)):
        return "; ".join(str(x) for x in v)
    return str(v)


def _to_str_list(v: Any) -> List[str]:
    if not v:
        return []
    if isinstance(v, str):
        return [v]
    if isinstance(v, list):
        return [_to_str_val(x) for x in v]
    if isinstance(v, dict):
        return [_to_str_val(v)]
    return [str(v)]


class DesignerService:
    """Service providing dedicated read-only intelligence and response submission for Product Designers."""

    @staticmethod
    def _ensure_ux_assignments_exist(workspace_id: str) -> None:
        """Auto-seed realistic UX design assignments if none exist in the workspace yet."""
        existing_count = prd_assignments_collection.count_documents({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "team_role": {"$in": ["PRODUCT_DESIGNER", "designer", "UX", "ux"]}
        })
        if existing_count > 0:
            return

        # Check existing PRDs in workspace
        prds = list(prds_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
        prd_id = prds[0].get("prd_id", "PRD-001") if prds else "PRD-001"
        prd_title = prds[0].get("title", "Smart Insights & Payment Recovery PRD") if prds else "Customer Onboarding & Payment Recovery PRD"
        prd_version = prds[0].get("current_version", "v1.0") if prds else "v1.0"

        seed_tasks = [
            {
                "assignment_id": f"ASN-UX-01-{workspace_id[-4:] if len(workspace_id) >= 4 else '01'}",
                "workspace_id": workspace_id,
                "prd_id": prd_id,
                "prd_title": prd_title,
                "prd_version": prd_version,
                "requirement_id": "REQ-UX-01",
                "requirement_title": "Interactive Payment Failure & Retry Experience",
                "requirement_description": "Design empathetic failure modals with explicit reason codes, fallback payment method selector, and zero-latency retry triggers.",
                "requirement_type": "USER_EXPERIENCE",
                "team_role": "PRODUCT_DESIGNER",
                "user_id": "usr_design_001",
                "user_name": "Satya (Product Designer)",
                "user_name": "Satya Prem (Product Designer)",
                "user_email": "satya@designer",
                "status": "IN_PROGRESS",
                "assigned_by": "Product Manager",
                "problem_statement": "Customers abandon purchase journeys when card authorization fails due to vague generic error messages.",
                "customer_impact": "Directly impacts checkout conversion rate by 18%.",
                "supporting_insights": ["PI-023: Payment gateway retry drop-off pattern"],
                "acceptance_criteria": [
                    "Empathetic, clear failure explanation rendered in < 100ms",
                    "One-click primary action to switch card or retry",
                    "WCAG 2.1 AA contrast compliance on all error states",
                ],
                "user_stories": [
                    "As a shopper, I want to know why my card was declined and immediately select another payment method without losing my cart."
                ],
                "role_responsibility": "Design UI flows, interaction states, wireframes, and accessibility guidelines.",
                "response": "Wireframes drafted for checkout failure drawer. Added auto-focus to alternate card CVV input and accessible screen-reader announcement.",
                "figma_url": "https://figma.com/file/sample-ux-payment-flow",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "assignment_id": f"ASN-UX-02-{workspace_id[-4:] if len(workspace_id) >= 4 else '02'}",
                "workspace_id": workspace_id,
                "prd_id": prd_id,
                "prd_title": prd_title,
                "prd_version": prd_version,
                "requirement_id": "REQ-UX-02",
                "requirement_title": "Responsive Dashboard KPI Card Hierarchy & Filtering",
                "requirement_description": "Revamp analytics metric cards with micro-trend sparklines, configurable density modes (compact vs relaxed), and fluid mobile viewport scaling.",
                "requirement_type": "USER_EXPERIENCE",
                "team_role": "PRODUCT_DESIGNER",
                "user_id": "usr_design_001",
                "user_name": "Satya (Product Designer)",
                "user_name": "Satya Prem (Product Designer)",
                "user_email": "satya@designer",
                "status": "NOT_STARTED",
                "assigned_by": "Product Manager",
                "problem_statement": "Dashboard filters and key metrics are visually cluttered on tablet screens.",
                "customer_impact": "Reduces daily active usage for mobile and field executives.",
                "supporting_insights": ["PI-041: Executive dashboard mobile bounce rates"],
                "acceptance_criteria": [
                    "Grid adapts seamlessly from 320px mobile to 4K monitors",
                    "Interactive sparkline hover tooltip reveals date and delta values",
                    "Color tokens strictly adhere to dark theme contrast specifications",
                ],
                "user_stories": [
                    "As an executive, I want to view high-level metric trends on my phone without horizontal scrolling."
                ],
                "role_responsibility": "Produce responsive component specifications, skeleton loaders, and breakpoint guidelines.",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "assignment_id": f"ASN-UX-03-{workspace_id[-4:] if len(workspace_id) >= 4 else '03'}",
                "workspace_id": workspace_id,
                "prd_id": prd_id,
                "prd_title": prd_title,
                "prd_version": prd_version,
                "requirement_id": "REQ-UX-03",
                "requirement_title": "AI Assistant Real-Time Reasoning & Streaming Widget",
                "requirement_description": "Create an unintrusive conversational sidebar with expandable thinking traces, citation pill badges, and copy-to-clipboard interactions.",
                "requirement_type": "USER_EXPERIENCE",
                "team_role": "PRODUCT_DESIGNER",
                "user_id": "usr_design_001",
                "user_name": "Satya (Product Designer)",
                "user_name": "Satya Prem (Product Designer)",
                "user_email": "satya@designer",
                "status": "COMPLETED",
                "assigned_by": "Product Manager",
                "problem_statement": "Users do not know when the AI is conducting background tool calls versus waiting for network responses.",
                "customer_impact": "Boosts trust and user engagement with AI agent workflows.",
                "supporting_insights": ["PI-015: AI agent user comprehension feedback"],
                "acceptance_criteria": [
                    "Smooth shimmer animation during agent thinking phase",
                    "Markdown formatting with syntax highlighting for code blocks",
                    "Keyboard navigation (Esc to close, Enter to submit)",
                ],
                "user_stories": [
                    "As a product manager, I want to see which datasets the AI searched while preparing my summary."
                ],
                "role_responsibility": "Design streaming UI animations, typography scale, and dark theme glassmorphism tokens.",
                "response": "Final Figma design tokens exported. Component specs handed off to engineering team with Framer Motion transitions.",
                "figma_url": "https://figma.com/file/sample-ai-assistant-specs",
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "submitted_by": "Product Designer",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ]

        try:
            for st in seed_tasks:
                prd_assignments_collection.update_one(
                    {"assignment_id": st["assignment_id"]},
                    {"$setOnInsert": st},
                    upsert=True
                )
        except Exception:
            pass

    @classmethod
    def get_designer_dashboard(cls, workspace_id: str, user_id: str = "", user_role: str = "designer", email: str = "") -> DesignerDashboardResponse:
        """Fetch designer KPI stats, role responsibilities, and active UX tasks."""
        cls._ensure_ux_assignments_exist(workspace_id)

        # 1. Fetch workspace info
        ws = workspaces_collection.find_one({"$or": [{"_id": workspace_id}, {"id": workspace_id}]})
        if not ws and ObjectId.is_valid(workspace_id):
            try:
                ws = workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
            except Exception:
                pass
        ws_name = ws.get("name", "Product Workspace") if ws else "Product Workspace"
        product_name = ws.get("product_name", "Enterprise Platform") if ws else "Enterprise Platform"

        # 2. Get assigned tasks for designer
        tasks_raw = prd_assignment_service.get_my_assignments(
            workspace_id=workspace_id,
            current_user={"user_id": user_id, "role": user_role, "email": email},
        )

        total = len(tasks_raw)
        pending = sum(1 for t in tasks_raw if t.get("status") in ["NOT_STARTED", "ASSIGNED", "UNASSIGNED"])
        in_prog = sum(1 for t in tasks_raw if t.get("status") == "IN_PROGRESS")
        in_prog = sum(1 for t in tasks_raw if t.get("status") in ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW"])
        completed = sum(1 for t in tasks_raw if t.get("status") in ["COMPLETED", "APPROVED"])
        blocked = sum(1 for t in tasks_raw if t.get("status") == "BLOCKED")
        rev_req = sum(1 for t in tasks_raw if t.get("status") == "REVISION_REQUESTED")

        # Map to DesignerTaskItem
        recent_items = [
            cls._doc_to_task_item(t, workspace_id)
            for t in tasks_raw
        ]

        role_guidance = (
            "Focus on translating user pain points into seamless interaction flows, high-fidelity UI components, "
            "responsive states (empty, loading, error, success), and WCAG 2.1 AA accessibility compliance."
        )

        return DesignerDashboardResponse(
            workspace_id=workspace_id,
            workspace_name=ws_name,
            product_name=product_name,
            total_assigned=total,
            pending_count=pending,
            in_progress_count=in_prog,
            completed_count=completed,
            blocked_count=blocked,
            review_requested_count=rev_req,
            recent_tasks=recent_items,
            role_guidance=role_guidance,
        )

    @classmethod
    def _doc_to_task_item(cls, t: Dict[str, Any], workspace_id: str) -> DesignerTaskItem:
        deliverables_raw = t.get("deliverables") or []
        delivs = []
        for d in deliverables_raw:
            if isinstance(d, dict):
                delivs.append(DesignDeliverableItem(
                    deliverable_id=d.get("deliverable_id") or str(d.get("_id", "")),
                    title=d.get("title", "Design Asset"),
                    deliverable_type=d.get("deliverable_type", "FIGMA_FILE"),
                    url=d.get("url", ""),
                    description=d.get("description"),
                ))

        return DesignerTaskItem(
            assignment_id=t.get("assignment_id") or str(t.get("_id", "")),
            workspace_id=t.get("workspace_id", workspace_id),
            prd_id=t.get("prd_id", "PRD-01"),
            prd_title=t.get("prd_title") or "PRD Document",
            prd_version=t.get("prd_version") or "v1.0",
            requirement_id=t.get("requirement_id") or "REQ-01",
            requirement_title=t.get("requirement_title") or "UX Requirement",
            requirement_description=_to_str_val(t.get("requirement_description")),
            requirement_type=t.get("requirement_type") or "USER_EXPERIENCE",
            status=t.get("status") or "NOT_STARTED",
            assigned_by=t.get("assigned_by") or "PM",
            assigned_at=t.get("assigned_at") or t.get("created_at"),
            problem_statement=_to_str_val(t.get("problem_statement")),
            customer_impact=_to_str_val(t.get("customer_impact")),
            supporting_insights=_to_str_list(t.get("supporting_insights")),
            acceptance_criteria=_to_str_list(t.get("acceptance_criteria")),
            user_stories=_to_str_list(t.get("user_stories")),
            role_responsibility=_to_str_val(t.get("role_responsibility") or "Design UI flows, interaction states, wireframes, and accessibility guidelines."),
            response=t.get("response"),
            figma_url=t.get("figma_url"),
            prototype_url=t.get("prototype_url"),
            deliverables=delivs,
            handoff_notes=t.get("handoff_notes"),
            accessibility_notes=t.get("accessibility_notes"),
            responsive_notes=t.get("responsive_notes"),
            blocker_comment=t.get("blocker_comment"),
            submitted_at=t.get("submitted_at"),
            submitted_by=t.get("submitted_by"),
            review_status=t.get("review_status"),
            review_comments=t.get("review_comments"),
            reviewed_at=t.get("reviewed_at"),
            reviewed_by=t.get("reviewed_by"),
            revision_count=t.get("revision_count", 0),
            is_draft=t.get("is_draft", False),
        )

    @classmethod
    def get_designer_assignments(cls, workspace_id: str, user_id: str = "", email: str = "") -> List[DesignerTaskItem]:
        """Fetch all assigned tasks for the designer."""
        cls._ensure_ux_assignments_exist(workspace_id)
        tasks_raw = prd_assignment_service.get_my_assignments(
            workspace_id=workspace_id,
            current_user={"user_id": user_id, "role": "designer", "email": email},
        )
        return [
            cls._doc_to_task_item(t, workspace_id)
            for t in tasks_raw
        ]

    @classmethod
    def get_designer_product_context(cls, workspace_id: str) -> DesignerProductContextResponse:
        """Fetch strategic product context, customer personas, and design goals grounded in MongoDB."""
        ws = workspaces_collection.find_one({"$or": [{"_id": workspace_id}, {"id": workspace_id}]})
        if not ws and ObjectId.is_valid(workspace_id):
            try:
                ws = workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
            except Exception:
                pass

        ws_name = ws.get("name", "Customer Experience Workspace") if ws else "Customer Experience Workspace"
        product_name = ws.get("product_name", "ProdIntel Experience") if ws else "ProdIntel Experience"
        product_type = ws.get("product_type", "SaaS Platform") if ws else "SaaS Platform"

        # Count PRDs
        prd_count = prds_collection.count_documents({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]})

        # Fetch top insights as customer pain points
        top_insights = list(insights_collection.find(
            {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]},
            limit=5
        ).sort("severity", -1))

        pain_points = []
        for ins in top_insights:
            pain_points.append({
                "insight_id": ins.get("insight_id", "INS"),
                "title": ins.get("title", ins.get("name", "User Experience Bottleneck")),
                "description": ins.get("summary", ins.get("description", "High friction encountered in user flow.")),
                "severity": ins.get("severity", "HIGH"),
                "affected_users": ins.get("impact_percentage", 45),
            })

        if not pain_points:
            pain_points = [
                {
                    "insight_id": "INS-UX-01",
                    "title": "Complex Checkout & Payment Confirmation Friction",
                    "description": "Users experience latency and ambiguous feedback states during multi-step checkout.",
                    "severity": "HIGH",
                    "affected_users": 68,
                },
                {
                    "insight_id": "INS-UX-02",
                    "title": "Mobile Responsive Navigation Bottleneck",
                    "description": "Critical dashboard filtering tools are truncated on viewports under 768px.",
                    "severity": "MEDIUM",
                    "affected_users": 42,
                },
                {
                    "insight_id": "INS-UX-03",
                    "title": "Ambiguous AI Agent Background Status",
                    "description": "Users cannot tell if the intelligence engine is calculating metrics or stalled.",
                    "severity": "HIGH",
                    "affected_users": 54,
                }
            ]

        key_user_journeys = [
            "Customer Onboarding & Workspace Setup",
            "Payment Flow & Receipt Verification",
            "Insights Exploration & Metric Filtering",
            "Team Collaboration & Downstream Task Handoff",
        ]

        strategic_design_goals = [
            "Reduce checkout flow cognitive load by 35% with transparent step indicators.",
            "Enforce AA accessibility contrast ratios across dark and light palettes.",
            "Provide unambiguous real-time feedback states (idle, loading, error, success).",
            "Unify design system tokens across web, tablet, and mobile breakpoints.",
        ]

        return DesignerProductContextResponse(
            workspace_id=workspace_id,
            workspace_name=ws_name,
            product_name=product_name,
            product_type=product_type,
            target_audience="Enterprise Product Teams, Designers, Engineers & Business Leaders",
            core_problem_statement="Fragmented product feedback and lack of continuous visibility into user pain points slows design and delivery velocity.",
            key_user_journeys=key_user_journeys,
            top_customer_pain_points=pain_points,
            strategic_design_goals=strategic_design_goals,
            active_prds_count=max(prd_count, 1),
        )

    @classmethod
    def get_designer_ux_requirements(cls, workspace_id: str, user_id: str = "", email: str = "") -> List[UXRequirementDetail]:
        """Fetch UX-specific requirements with detailed wireframe expectations and interaction criteria."""
        cls._ensure_ux_assignments_exist(workspace_id)
        tasks_raw = prd_assignment_service.get_my_assignments(
            workspace_id=workspace_id,
            current_user={"user_id": user_id, "role": "designer", "email": email},
        )

        ux_list: List[UXRequirementDetail] = []
        for t in tasks_raw:
            aid = t.get("assignment_id") or str(t.get("_id", ""))
            detail = prd_assignment_service.get_assignment_detail(workspace_id=workspace_id, assignment_id=aid)
            if not detail:
                detail = t

            ui_states = {
                "Empty State": "Render informative illustration with clear primary CTA to initiate workflow.",
                "Loading State": "Display sleek skeleton loader matching layout geometry, avoiding generic spinners.",
                "Error State": "Show contextual inline alert with actionable recovery trigger and error code.",
                "Success State": "Provide subtle micro-interaction celebration with persistent status confirmation.",
            }

            a11y = [
                "Full keyboard focus trap within modals and dropdown menus (Tab / Shift+Tab).",
                "ARIA live regions for async agent progress and validation alerts.",
                "Color contrast ratio >= 4.5:1 for body copy and 3.0:1 for large UI components.",
                "Explicit alt-text or aria-hidden on decorative SVG icons.",
            ]

            deliverables_raw = detail.get("deliverables") or []
            delivs = []
            for d in deliverables_raw:
                if isinstance(d, dict):
                    delivs.append(DesignDeliverableItem(
                        deliverable_id=d.get("deliverable_id") or str(d.get("_id", "")),
                        title=d.get("title", "Design Asset"),
                        deliverable_type=d.get("deliverable_type", "FIGMA_FILE"),
                        url=d.get("url", ""),
                        description=d.get("description"),
                    ))

            ux_list.append(
                UXRequirementDetail(
                    assignment_id=aid,
                    requirement_id=detail.get("requirement_id", "REQ"),
                    requirement_title=detail.get("requirement_title") or "UX Requirement Specification",
                    prd_id=detail.get("prd_id", "PRD-01"),
                    prd_title=detail.get("prd_title") or "PRD Document",
                    prd_version=detail.get("prd_version") or "v1.0",
                    category=detail.get("category_id") or "User Experience",
                    status=detail.get("status", "IN_PROGRESS"),
                    priority="HIGH",
                    problem_statement=_to_str_val(detail.get("problem_statement") or "User friction during workflow execution."),
                    customer_impact=_to_str_val(detail.get("customer_impact") or "Directly impacts task completion rate and conversion."),
                    interaction_flow="User triggers action -> Validation occurs in background -> UI renders real-time state feedback.",
                    ui_states=ui_states,
                    accessibility_criteria=a11y,
                    acceptance_criteria=_to_str_list(detail.get("acceptance_criteria")) if detail.get("acceptance_criteria") else [
                        "Interface responds to input in < 100ms.",
                        "Responsive design gracefully scales from 320px mobile to 4K desktop.",
                    ],
                    customer_quotes=_to_str_list(detail.get("supporting_insights")) if detail.get("supporting_insights") else [
                        "It is hard to tell whether my request went through or if it failed silently.",
                        "The layout feels cluttered when multiple items are loaded simultaneously.",
                    ],
                    figma_url=detail.get("figma_url"),
                    prototype_url=detail.get("prototype_url"),
                    deliverables=delivs,
                    response=detail.get("response"),
                    handoff_notes=detail.get("handoff_notes"),
                    blocker_comment=detail.get("blocker_comment"),
                    review_status=detail.get("review_status"),
                    review_comments=detail.get("review_comments"),
                )
            )

        return ux_list

    @classmethod
    def get_designer_customer_feedback(cls, workspace_id: str) -> List[DesignerCustomerFeedbackItem]:
        """Fetch customer feedback clusters filtered for UX & UI design context."""
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        raw_items = list(feedbacks_collection.find(query, limit=50).sort("created_at", -1))

        if not raw_items:
            # Fallback illustrative items
            return [
                DesignerCustomerFeedbackItem(
                    feedback_id="FB-UX-101",
                    title="Confusing modal close and backdrop dismiss behavior",
                    content="When clicking outside the modal, it closes and discards my unsaved input without asking for confirmation.",
                    sentiment="negative",
                    category="Navigation & Modals",
                    ux_impact="High",
                    user_type="Power User",
                    source="In-App Feedback",
                    created_at="2026-10-04T14:30:00Z",
                ),
                DesignerCustomerFeedbackItem(
                    feedback_id="FB-UX-102",
                    title="Needs clearer contrast on active status pills",
                    content="The green and grey status tags look almost identical on low brightness screens in daylight.",
                    sentiment="neutral",
                    category="Visual Design & Accessibility",
                    ux_impact="Medium",
                    user_type="QA Engineer",
                    source="Accessibility Audit",
                    created_at="2026-10-04T11:15:00Z",
                ),
                DesignerCustomerFeedbackItem(
                    feedback_id="FB-UX-103",
                    title="Love the dark mode glassmorphism, but need faster filtering",
                    content="The UI is stunning and modern, but I want quick keyboard shortcuts to jump between PRDs and requirement lists.",
                    sentiment="positive",
                    category="Interaction Design",
                    ux_impact="Medium",
                    user_type="Product Designer",
                    source="User Interview",
                    created_at="2026-10-03T18:00:00Z",
                ),
            ]

        results = []
        for idx, item in enumerate(raw_items):
            content = item.get("content", item.get("text", item.get("comment", "")))
            sentiment = item.get("sentiment", "neutral")
            title = item.get("title", item.get("summary", f"Feedback #{idx+1}"))
            category = item.get("category", "General UX")
            results.append(
                DesignerCustomerFeedbackItem(
                    feedback_id=str(item.get("_id", f"FB-{idx+1}")),
                    title=title,
                    content=content,
                    sentiment=sentiment,
                    category=category,
                    ux_impact="High" if sentiment == "negative" else "Medium",
                    user_type=item.get("user_role", "Customer"),
                    source=item.get("source", "User Feedback"),
                    created_at=item.get("created_at", datetime.now(timezone.utc).isoformat()),
                )
            )

        return results

    @classmethod
    def submit_design_response(
        cls,
        workspace_id: str,
        assignment_id: str,
        payload: DesignResponseSubmit,
        submitted_by: str = "Product Designer",
        user_role: str = "designer",
    ) -> DesignerTaskItem:
        """Submit design specifications, Figma links, deliverables snapshot, and update assignment status."""
        query = {"$or": [{"assignment_id": assignment_id}, {"requirement_id": assignment_id}]}
        doc = prd_assignments_collection.find_one(query)
        if not doc and ObjectId.is_valid(assignment_id):
            try:
                doc = prd_assignments_collection.find_one({"_id": ObjectId(assignment_id)})
                query = {"_id": ObjectId(assignment_id)}
            except Exception:
                pass

        now_iso = datetime.now(timezone.utc).isoformat()
        target_status = payload.status
        is_draft = payload.is_draft

        if is_draft:
            target_status = "IN_PROGRESS"
        elif target_status in ["COMPLETED", "SUBMITTED_FOR_REVIEW", "SUBMITTED"]:
            target_status = "SUBMITTED_FOR_REVIEW"

        deliverables_dict = [d.model_dump() for d in payload.deliverables] if payload.deliverables else []
        current_rev = (doc.get("revision_count") or 0) + (0 if is_draft else 1)

        update_fields: Dict[str, Any] = {
            "status": payload.status,
            "status": target_status,
            "response": payload.response,
            "figma_url": payload.figma_url,
            "prototype_url": payload.prototype_url,
            "submitted_at": now_iso,
            "deliverables": deliverables_dict,
            "handoff_notes": payload.handoff_notes,
            "accessibility_notes": payload.accessibility_notes,
            "responsive_notes": payload.responsive_notes,
            "revision_response": payload.revision_response,
            "revision_count": current_rev,
            "is_draft": is_draft,
            "submitted_at": now_iso if not is_draft else doc.get("submitted_at"),
            "submitted_by": submitted_by,
            "updated_at": now_iso,
        }
        if target_status == "BLOCKED":
            update_fields["blocker_comment"] = payload.blocker_comment
        else:
            update_fields["blocker_comment"] = None

        if not is_draft:
            update_fields["review_status"] = "PENDING_REVIEW"

        if doc:
            prd_assignments_collection.update_one(query, {"$set": update_fields})
            doc.update(update_fields)
        else:
            # Create on-the-fly
            doc = {
                "assignment_id": assignment_id,
                "workspace_id": workspace_id,
                "requirement_id": assignment_id,
                "prd_id": "PRD-001",
                "prd_title": "PRD Document",
                "prd_version": "v1.0",
                "requirement_title": "UX Requirement",
                "team_role": "PRODUCT_DESIGNER",
                **update_fields,
            }
            prd_assignments_collection.insert_one(doc)
        # Create immutable submission snapshot if not a draft
        if not is_draft:
            snapshot_id = f"SUB-{assignment_id}-{current_rev}"
            snapshot = {
                "submission_id": snapshot_id,
                "assignment_id": assignment_id,
                "workspace_id": workspace_id,
                "revision_number": current_rev,
                "submitted_by": submitted_by,
                "submitted_at": now_iso,
                "prd_id": doc.get("prd_id", "PRD-001"),
                "prd_version": doc.get("prd_version", "v1.0"),
                "response": payload.response,
                "figma_url": payload.figma_url,
                "prototype_url": payload.prototype_url,
                "deliverables": deliverables_dict,
                "handoff_notes": payload.handoff_notes,
                "accessibility_notes": payload.accessibility_notes,
                "responsive_notes": payload.responsive_notes,
                "review_status": "PENDING_REVIEW",
                "review_comments": None,
                "created_at": now_iso,
            }
            design_submissions_collection.update_one(
                {"submission_id": snapshot_id},
                {"$set": snapshot},
                upsert=True
            )

        return cls._doc_to_task_item(doc, workspace_id)

    @classmethod
    def get_assignment_submissions(cls, workspace_id: str, assignment_id: str) -> List[Dict[str, Any]]:
        """Get immutable history of all submitted revisions for an assignment."""
        subs = list(design_submissions_collection.find(
            {"workspace_id": workspace_id, "assignment_id": assignment_id}
        ).sort("revision_number", -1))
        return [serialize_document(s) for s in subs]

    @classmethod
    def review_submission(
        cls,
        workspace_id: str,
        assignment_id: str,
        payload: DesignReviewCreate,
        reviewer_name: str = "Product Manager",
    ) -> DesignerTaskItem:
        """PM Reviews a design submission: approve, request revision, or reject."""
        query = {"$or": [{"assignment_id": assignment_id}, {"requirement_id": assignment_id}]}
        doc = prd_assignments_collection.find_one(query)
        if not doc and ObjectId.is_valid(assignment_id):
            try:
                doc = prd_assignments_collection.find_one({"_id": ObjectId(assignment_id)})
                query = {"_id": ObjectId(assignment_id)}
            except Exception:
                pass

        if not doc:
            raise ValueError(f"Assignment {assignment_id} not found.")

        now_iso = datetime.now(timezone.utc).isoformat()
        decision = payload.decision.upper()

        if decision == "APPROVED":
            new_status = "COMPLETED"
            review_status = "APPROVED"
        elif decision == "REVISION_REQUESTED":
            new_status = "REVISION_REQUESTED"
            review_status = "REVISION_REQUESTED"
        else:
            new_status = "BLOCKED"
            review_status = "REJECTED"

        update_fields = {
            "status": new_status,
            "review_status": review_status,
            "review_comments": payload.comments,
            "reviewed_by": reviewer_name,
            "reviewed_at": now_iso,
            "updated_at": now_iso,
        }

        prd_assignments_collection.update_one(query, {"$set": update_fields})
        doc.update(update_fields)

        # Update latest submission snapshot
        design_submissions_collection.update_one(
            {"workspace_id": workspace_id, "assignment_id": assignment_id},
            {"$set": {
                "review_status": review_status,
                "review_comments": payload.comments,
                "reviewed_by": reviewer_name,
                "reviewed_at": now_iso,
            }},
            sort=[("revision_number", -1)]
        )

        # Record in design_reviews_collection
        review_record = {
            "review_id": f"REV-{assignment_id}-{int(datetime.now().timestamp())}",
            "workspace_id": workspace_id,
            "assignment_id": assignment_id,
            "decision": decision,
            "comments": payload.comments,
            "criteria_feedback": payload.criteria_feedback or [],
            "revision_deadline": payload.revision_deadline,
            "reviewed_by": reviewer_name,
            "created_at": now_iso,
        }
        design_reviews_collection.insert_one(review_record)

        return cls._doc_to_task_item(doc, workspace_id)

    @classmethod
    def get_assignment_reviews(cls, workspace_id: str, assignment_id: str) -> List[Dict[str, Any]]:
        """Get review history and critique decisions for an assignment."""
        revs = list(design_reviews_collection.find(
            {"workspace_id": workspace_id, "assignment_id": assignment_id}
        ).sort("created_at", -1))
        return [serialize_document(r) for r in revs]

    @classmethod
    def report_blocker(
        cls,
        workspace_id: str,
        assignment_id: str,
        payload: BlockerCreate,
        user_name: str = "Product Designer",
    ) -> Dict[str, Any]:
        """Report a blocker preventing design progress."""
        query = {"$or": [{"assignment_id": assignment_id}, {"requirement_id": assignment_id}]}
        doc = prd_assignments_collection.find_one(query)
        if not doc and ObjectId.is_valid(assignment_id):
            try:
                doc = prd_assignments_collection.find_one({"_id": ObjectId(assignment_id)})
                query = {"_id": ObjectId(assignment_id)}
            except Exception:
                pass

        now_iso = datetime.now(timezone.utc).isoformat()
        blocker_id = f"BLK-{assignment_id}-{int(datetime.now().timestamp())}"

        blocker_record = {
            "blocker_id": blocker_id,
            "workspace_id": workspace_id,
            "assignment_id": assignment_id,
            "title": payload.title,
            "description": payload.description,
            "category": payload.category,
            "impact": payload.impact,
            "supporting_link": payload.supporting_link,
            "requested_assistance": payload.requested_assistance,
            "reported_by": user_name,
            "status": "OPEN",
            "created_at": now_iso,
        }
        blockers_collection.insert_one(blocker_record)

        # Update assignment to BLOCKED
        if doc:
            prd_assignments_collection.update_one(query, {"$set": {
                "status": "BLOCKED",
                "blocker_comment": f"[{payload.category}] {payload.title}: {payload.description}",
                "updated_at": now_iso,
            }})

        return serialize_document(blocker_record)

    @classmethod
    def get_assignment_blockers(cls, workspace_id: str, assignment_id: str) -> List[Dict[str, Any]]:
        """Get all blockers reported on an assignment."""
        blks = list(blockers_collection.find(
            {"workspace_id": workspace_id, "assignment_id": assignment_id}
        ).sort("created_at", -1))
        return [serialize_document(b) for b in blks]

    @classmethod
    def request_clarification(
        cls,
        workspace_id: str,
        assignment_id: str,
        payload: ClarificationCreate,
        user_name: str = "Product Designer",
    ) -> Dict[str, Any]:
        """Raise a requirement clarification question to the PM without blocking the assignment."""
        now_iso = datetime.now(timezone.utc).isoformat()
        record_id = f"CLR-{assignment_id}-{int(datetime.now().timestamp())}"

        clr_record = {
            "clarification_id": record_id,
            "workspace_id": workspace_id,
            "assignment_id": assignment_id,
            "question": payload.question,
            "context_notes": payload.context_notes,
            "priority": payload.priority,
            "requested_by": user_name,
            "status": "OPEN",
            "answer": None,
            "created_at": now_iso,
        }
        clarification_requests_collection.insert_one(clr_record)
        return serialize_document(clr_record)

    @classmethod
    def get_assignment_clarifications(cls, workspace_id: str, assignment_id: str) -> List[Dict[str, Any]]:
        """Get clarification questions and PM answers for an assignment."""
        clrs = list(clarification_requests_collection.find(
            {"workspace_id": workspace_id, "assignment_id": assignment_id}
        ).sort("created_at", -1))
        return [serialize_document(c) for c in clrs]


designer_service = DesignerService()

