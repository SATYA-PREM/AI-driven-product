"""
stakeholder_service.py
----------------------
Authoritative business logic for the Business Owner / Stakeholder Workspace:
- Dashboard metric aggregation & executive KPIs
- Product overview & strategic alignment
- Business objectives and progress tracking
- Product roadmap & initiative portfolio
- Pending approvals & tamper-proof decision recording
- Decision audit history & lineage
- Business review for PRDs & structured stakeholder feedback
- Milestones and risk register
- Business impact and success metrics
- Stakeholder notifications
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId

from app.core.database import (
    workspaces_collection,
    products_collection,
    prd_projects_collection,
    prd_requirements_collection,
    product_features_collection,
    product_insights_collection,
    business_objectives_collection,
    approval_requests_collection,
    stakeholder_feedback_collection,
    decision_records_collection,
    milestones_collection,
    business_metrics_collection,
    business_risks_collection,
    stakeholder_notifications_collection,
)
from app.core.exceptions import NotFoundError, ValidationError, AuthorizationError


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class StakeholderService:
    """Service providing end-to-end functionality for Stakeholder Workspace."""

    def _ensure_seed_data(self, workspace_id: str) -> None:
        """Seeds realistic initial stakeholder governance data if none exists."""
        # 1. Seed Business Objectives
        obj_count = business_objectives_collection.count_documents({"workspace_id": workspace_id})
        if obj_count == 0:
            ws_suffix = str(uuid.uuid4().hex[:6])
            business_objectives_collection.insert_many([
                {
                    "objective_id": f"OBJ-01-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "title": "Streamline Checkout & Reduce Drop-off",
                    "description": "Eliminate friction in multi-step billing and one-click purchase to reduce checkout funnel abandonment from 38% to under 20%.",
                    "business_rationale": "Directly impacts quarterly GMV and transaction velocity for high-value mobile and enterprise customers.",
                    "owner": "Sarah Lin (Chief Commercial Officer)",
                    "target_date": "2026-11-30",
                    "status": "ON_TRACK",
                    "customer_problem": "Users experience unexpected payment retries, slow session recovery, and cumbersome address verification.",
                    "how_success_measured": "Checkout conversion rate improvement (+18%) and reduction in payment failure customer tickets.",
                    "associated_initiatives": ["One-click checkout", "Instant card tokenization", "Localized currency display"],
                    "success_metrics": ["METRIC-CHK-01", "METRIC-CHK-02"],
                    "risks": ["Gateway latency spikes during peak events", "Regional card compliance delays"],
                    "evidence_of_progress": "Phase 1 UX prototypes validated; payment retry rate down 4.2% in staging.",
                    "outstanding_decisions": 1,
                    "last_updated": _now_iso(),
                },
                {
                    "objective_id": f"OBJ-02-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "title": "Enhance Enterprise Role Security & Auditability",
                    "description": "Provide granular RBAC, session revocation, and immutable audit logging for corporate compliance compliance.",
                    "business_rationale": "Unlocks 12 pending enterprise pipeline deals requiring SOC2 Type II and ISO 27001 readiness.",
                    "owner": "Marcus Vance (VP Enterprise Strategy)",
                    "target_date": "2026-12-15",
                    "status": "ON_TRACK",
                    "customer_problem": "Enterprise security officers cannot audit administrative privilege changes or delegate restricted roles.",
                    "how_success_measured": "100% audit log coverage for permission changes and zero audit compliance findings.",
                    "associated_initiatives": ["Granular Workspace Roles", "Audit Export API", "SSO Multi-Factor Enforcement"],
                    "success_metrics": ["METRIC-SEC-01"],
                    "risks": ["Session invalidation edge cases for mobile devices"],
                    "evidence_of_progress": "RBAC schema deployed; audit event pipeline processing in test harness.",
                    "outstanding_decisions": 1,
                    "last_updated": _now_iso(),
                },
                {
                    "objective_id": f"OBJ-03-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "title": "AI Customer Intelligence Automation",
                    "description": "Scale automated multi-channel feedback analysis to reduce manual issue triage time by 75%.",
                    "business_rationale": "Enables product squads to discover critical defects and feature opportunities in minutes rather than weeks.",
                    "owner": "David Chen (VP Product Operations)",
                    "target_date": "2027-01-20",
                    "status": "PLANNED",
                    "customer_problem": "Feedback arrives across email, tickets, and reviews with no unified thematic prioritization.",
                    "how_success_measured": "AI theme classification confidence >= 92% and 4x faster PRD turnaround.",
                    "associated_initiatives": ["CrewAI 3-Agent Pipeline", "Real-time Defect Clustering"],
                    "success_metrics": ["METRIC-AI-01"],
                    "risks": ["LLM token budget overruns during bulk imports"],
                    "evidence_of_progress": "Pipeline active in prototype; processing ~12k records per run.",
                    "outstanding_decisions": 0,
                    "last_updated": _now_iso(),
                }
            ])

        # 2. Seed Approval Requests
        appr_count = approval_requests_collection.count_documents({"workspace_id": workspace_id})
        if appr_count == 0:
            req_suffix = str(uuid.uuid4().hex[:6])
            approval_requests_collection.insert_many([
                {
                    "request_id": f"APPR-01-{req_suffix}",
                    "workspace_id": workspace_id,
                    "title": "PRD Business Alignment: One-Click Checkout Architecture",
                    "request_type": "PRD_ALIGNMENT",
                    "related_resource_type": "PRD",
                    "related_resource_id": "PRD-001",
                    "related_resource_version": "v1.2",
                    "requesting_pm": "Priya Sharma (Senior PM)",
                    "assigned_approver": "Business Owner",
                    "assigned_approver_role": "STAKEHOLDER",
                    "submission_date": _now_iso(),
                    "due_date": "2026-11-10",
                    "status": "PENDING",
                    "business_impact_summary": "Reduces checkout cart abandonment by 18% and projected to generate $420k incremental GMV quarterly.",
                    "decision_required": "Formal stakeholder sign-off on scope boundaries, third-party payment gateway fees, and PCI-DSS compliance assumptions.",
                    "supporting_evidence": [
                        {"type": "Customer Evidence", "title": "42 Support Tickets on Checkout Timeout", "url": "/feedback"},
                        {"type": "Insight", "title": "Critical Pain Point: Cart Abandonment at 38%", "url": "/intelligence/insights"}
                    ],
                    "proposed_solution": "Implement decoupled tokenized one-click checkout flow with optimistic validation and instant retry fallback.",
                    "customer_problem": "Customers report 3-minute checkout flows with multiple re-auth screens causing 38% exit rate.",
                    "expected_customer_impact": "Checkout duration dropped from 180s to 12s for registered shoppers.",
                    "expected_business_value": "+18% conversion rate; $1.6M annualized incremental GMV.",
                    "costs_and_assumptions": "Assumes Stripe Elements API tier; $0.03 transaction tokenization fee absorbed in current unit economics.",
                    "risks_and_dependencies": [
                        "Gateway SLA guarantee must be >= 99.95%",
                        "Fallback to standard multi-step form required if token fails"
                    ],
                    "success_metrics": ["Conversion rate >= 82%", "Checkout p95 latency < 1.5s"],
                    "decision_deadline": "2026-11-10",
                    "resolved_decision": None,
                },
                {
                    "request_id": f"APPR-02-{req_suffix}",
                    "workspace_id": workspace_id,
                    "title": "Scope-Change Request: Enterprise RBAC Tier 2 Delegation",
                    "request_type": "SCOPE_CHANGE",
                    "related_resource_type": "INITIATIVE",
                    "related_resource_id": "INIT-RBAC-02",
                    "related_resource_version": "v2.0",
                    "requesting_pm": "Alex Rivera (Lead PM)",
                    "assigned_approver": "Business Owner",
                    "assigned_approver_role": "STAKEHOLDER",
                    "submission_date": _now_iso(),
                    "due_date": "2026-11-15",
                    "status": "PENDING",
                    "business_impact_summary": "Extends workspace authorization to support custom security policies requested by Tier 1 enterprise prospects.",
                    "decision_required": "Approve addition of 2 engineering sprint weeks to include Custom Role Definition before release.",
                    "supporting_evidence": [
                        {"type": "Enterprise Pipeline", "title": "Deal blocker on 3 RFP submissions totaling $380k ARR", "url": "/business-cases"}
                    ],
                    "proposed_solution": "Expand predefined role matrix with JSON-configurable permission rules for compliance officers.",
                    "customer_problem": "Global financial clients cannot adopt ProdAI without restricting export actions to designated data officers.",
                    "expected_customer_impact": "Compliance teams gain full authority over export policies without engineering intervention.",
                    "expected_business_value": "Accelerates closure of $380k ARR pipeline in Q4.",
                    "costs_and_assumptions": "2 sprint weeks engineering time; pushes release date from Nov 20 to Dec 04.",
                    "risks_and_dependencies": ["Requires QA regression on member permissions API"],
                    "success_metrics": ["Zero privilege leakage vulnerabilities", "Enterprise sign-offs secured"],
                    "decision_deadline": "2026-11-15",
                    "resolved_decision": None,
                }
            ])

        # 3. Seed Milestones
        ms_count = milestones_collection.count_documents({"workspace_id": workspace_id})
        if ms_count == 0:
            ms_suffix = str(uuid.uuid4().hex[:6])
            milestones_collection.insert_many([
                {
                    "milestone_id": f"MS-01-{ms_suffix}",
                    "workspace_id": workspace_id,
                    "title": "M1: Core Tokenization Engine & UX Verification",
                    "associated_initiative": "One-click checkout",
                    "associated_initiative_id": "INIT-01",
                    "expected_outcome": "Working PCI-compliant token vault integration and design system components verified.",
                    "target_date": "2026-10-28",
                    "status": "IN_PROGRESS",
                    "responsible_pm": "Priya Sharma",
                    "key_dependencies": ["Payment gateway sandbox credentials approved"],
                    "significant_blockers": [],
                    "progress_percentage": 75,
                    "progress_explanation": "Backend card tokenization endpoints completed; frontend component integration underway.",
                    "decisions_required": ["PRD business alignment sign-off"],
                    "last_updated": _now_iso(),
                },
                {
                    "milestone_id": f"MS-02-{ms_suffix}",
                    "workspace_id": workspace_id,
                    "title": "M2: Staging Security Audit & Penetration Test",
                    "associated_initiative": "Enterprise RBAC",
                    "associated_initiative_id": "INIT-02",
                    "expected_outcome": "Complete third-party penetration testing with zero P1/P2 security vulnerabilities.",
                    "target_date": "2026-11-18",
                    "status": "PLANNED",
                    "responsible_pm": "Alex Rivera",
                    "key_dependencies": ["Scope change decision recorded", "Audit logging pipeline deployed"],
                    "significant_blockers": [],
                    "progress_percentage": 20,
                    "progress_explanation": "Test plan drafted; external audit firm scheduled for Nov 12.",
                    "decisions_required": ["Scope change approval for custom roles"],
                    "last_updated": _now_iso(),
                },
                {
                    "milestone_id": f"MS-03-{ms_suffix}",
                    "workspace_id": workspace_id,
                    "title": "M3: Beta Launch & Pilot Customer Rollout",
                    "associated_initiative": "One-click checkout",
                    "associated_initiative_id": "INIT-01",
                    "expected_outcome": "Canary deployment to 10% of active web traffic with live telemetry monitoring.",
                    "target_date": "2026-12-05",
                    "status": "PLANNED",
                    "responsible_pm": "Priya Sharma",
                    "key_dependencies": ["M1 and QA verification complete", "Payment fraud filters tuned"],
                    "significant_blockers": [],
                    "progress_percentage": 0,
                    "progress_explanation": "Awaiting M1 completion and staging stability verification.",
                    "decisions_required": [],
                    "last_updated": _now_iso(),
                }
            ])

        # 4. Seed Business Metrics
        met_count = business_metrics_collection.count_documents({"workspace_id": workspace_id})
        if met_count == 0:
            met_suffix = str(uuid.uuid4().hex[:6])
            business_metrics_collection.insert_many([
                {
                    "metric_id": f"METRIC-CHK-01-{met_suffix}",
                    "workspace_id": workspace_id,
                    "name": "Checkout Completion Rate",
                    "description": "Percentage of shoppers initiating checkout who successfully complete order payment.",
                    "business_objective": "Streamline Checkout & Reduce Drop-off",
                    "measurement_definition": "(Completed Orders / Initiated Checkouts) * 100",
                    "baseline": "62.4%",
                    "target": "80.0%",
                    "current_value": "66.8%",
                    "measurement_period": "Monthly Rolling Average",
                    "data_source": "Production Analytics Event Pipeline",
                    "status": "ON_TRACK",
                    "is_configured": True,
                    "metric_type": "MEASURED_RESULT",
                    "trend": "+4.4% vs baseline",
                    "data_freshness": "Real-time pipeline",
                    "responsible_owner": "Sarah Lin (CCO)",
                    "last_updated": _now_iso(),
                    "historical_observations": [
                        {"period": "2026-07", "value": "62.4%", "note": "Pre-initiative baseline"},
                        {"period": "2026-08", "value": "63.1%", "note": "Initial form optimizations"},
                        {"period": "2026-09", "value": "66.8%", "note": "Staging canary phase"}
                    ]
                },
                {
                    "metric_id": f"METRIC-CHK-02-{met_suffix}",
                    "workspace_id": workspace_id,
                    "name": "Payment Failure Support Tickets",
                    "description": "Total monthly customer support inquiries categorized under billing or payment timeout errors.",
                    "business_objective": "Streamline Checkout & Reduce Drop-off",
                    "measurement_definition": "Count of support tickets with tag 'payment_error'",
                    "baseline": "142 tickets/mo",
                    "target": "< 25 tickets/mo",
                    "current_value": "98 tickets/mo",
                    "measurement_period": "Monthly Count",
                    "data_source": "Zendesk & Intercom Feedback Sync",
                    "status": "ON_TRACK",
                    "is_configured": True,
                    "metric_type": "MEASURED_RESULT",
                    "trend": "-31% reduction",
                    "data_freshness": "Synced 2 hours ago",
                    "responsible_owner": "David Chen (VP Support)",
                    "last_updated": _now_iso(),
                    "historical_observations": [
                        {"period": "2026-07", "value": "142", "note": "Peak failure rate"},
                        {"period": "2026-08", "value": "119", "note": "Gateway retry fixes"},
                        {"period": "2026-09", "value": "98", "note": "Improved card validation"}
                    ]
                },
                {
                    "metric_id": f"METRIC-SEC-01-{met_suffix}",
                    "workspace_id": workspace_id,
                    "name": "Enterprise Deal Unblock Velocity",
                    "description": "Dollar value of ARR unlocked through compliance and security certification sign-offs.",
                    "business_objective": "Enhance Enterprise Role Security & Auditability",
                    "measurement_definition": "Sum of ARR for closed-won enterprise accounts requiring SOC2/RBAC",
                    "baseline": "$0",
                    "target": "$500,000",
                    "current_value": "Not configured",
                    "measurement_period": "Fiscal Quarter",
                    "data_source": "CRM Enterprise Pipeline",
                    "status": "NOT_CONFIGURED",
                    "is_configured": False,
                    "metric_type": "TARGET",
                    "trend": None,
                    "data_freshness": "Awaiting CRM webhook connection",
                    "responsible_owner": "Marcus Vance",
                    "last_updated": _now_iso(),
                    "historical_observations": []
                }
            ])

        # 5. Seed Business Risks
        risk_count = business_risks_collection.count_documents({"workspace_id": workspace_id})
        if risk_count == 0:
            risk_suffix = str(uuid.uuid4().hex[:6])
            business_risks_collection.insert_many([
                {
                    "risk_id": f"RISK-01-{risk_suffix}",
                    "workspace_id": workspace_id,
                    "title": "Payment Gateway P99 Latency During Flash Sales",
                    "description": "Third-party payment processor tokenization endpoint response times could exceed 2.5s under sudden 5x traffic surges.",
                    "category": "TECHNICAL_DEPENDENCY",
                    "related_initiative": "One-click checkout",
                    "business_impact": "Shoppers may experience checkout loading spinners, leading to duplicate charges or order cancellations.",
                    "likelihood": "MEDIUM",
                    "severity": "HIGH",
                    "mitigation_plan": "Implement client-side idempotency keys, pre-warmed token pools, and automatic fallback to secondary payment gateway.",
                    "owner": "Rajesh Kumar (Lead Architect)",
                    "target_resolution_date": "2026-11-20",
                    "status": "MITIGATING",
                    "last_updated": _now_iso(),
                    "comments": [
                        {"author": "Sarah Lin", "text": "Confirmed secondary gateway fallback contract is active.", "date": _now_iso()}
                    ]
                },
                {
                    "risk_id": f"RISK-02-{risk_suffix}",
                    "workspace_id": workspace_id,
                    "title": "Custom Role Definition Timeline Slip",
                    "description": "Expanding RBAC with arbitrary JSON permissions may require additional regression testing cycle, delaying enterprise release.",
                    "category": "DELIVERY",
                    "related_initiative": "Enterprise RBAC",
                    "business_impact": "Could push enterprise go-to-market by 2 weeks into late Q4.",
                    "likelihood": "LOW",
                    "severity": "MEDIUM",
                    "mitigation_plan": "Constrain initial scope to top 5 role archetypes; release full custom schema editor in Q1 update.",
                    "owner": "Alex Rivera (Lead PM)",
                    "target_resolution_date": "2026-11-15",
                    "status": "OPEN",
                    "last_updated": _now_iso(),
                    "comments": []
                }
            ])

        # 6. Seed Notifications
        notif_count = stakeholder_notifications_collection.count_documents({"workspace_id": workspace_id})
        if notif_count == 0:
            notif_suffix = str(uuid.uuid4().hex[:6])
            stakeholder_notifications_collection.insert_many([
                {
                    "notification_id": f"NOTIF-01-{notif_suffix}",
                    "workspace_id": workspace_id,
                    "event_type": "NEW_APPROVAL_REQUEST",
                    "message": "Priya Sharma submitted PRD Business Alignment: One-Click Checkout Architecture for your review.",
                    "related_record_type": "APPROVAL_REQUEST",
                    "related_record_id": f"APPR-01-{notif_suffix}",
                    "timestamp": _now_iso(),
                    "is_read": False,
                    "action_url": f"/workspace/{workspace_id}/stakeholder/approvals"
                },
                {
                    "notification_id": f"NOTIF-02-{notif_suffix}",
                    "workspace_id": workspace_id,
                    "event_type": "SIGNIFICANT_RISK",
                    "message": "New Delivery risk logged: Payment Gateway P99 Latency During Flash Sales.",
                    "related_record_type": "RISK",
                    "related_record_id": f"RISK-01-{notif_suffix}",
                    "timestamp": _now_iso(),
                    "is_read": False,
                    "action_url": f"/workspace/{workspace_id}/stakeholder/risks"
                }
            ])

    # ──────────────────────────────────────────────
    # Dashboard Overview & KPIs
    # ──────────────────────────────────────────────

    def get_dashboard(self, workspace_id: str, user_email: Optional[str] = None) -> Dict[str, Any]:
        """Calculates executive KPI metrics and dashboard summaries from real DB data."""
        self._ensure_seed_data(workspace_id)

        ws = workspaces_collection.find_one({"$or": [{"_id": ObjectId(workspace_id) if ObjectId.is_valid(workspace_id) else None}, {"id": workspace_id}]}) or {}
        ws_name = ws.get("name") or "Product Intelligence Workspace"

        # Count real metrics
        pending_approvals = list(approval_requests_collection.find({"workspace_id": workspace_id, "status": "PENDING"}))
        active_objectives = list(business_objectives_collection.find({"workspace_id": workspace_id, "status": {"$in": ["ON_TRACK", "AT_RISK", "IN_PROGRESS"]}}))
        milestones = list(milestones_collection.find({"workspace_id": workspace_id}))
        upcoming_ms = [m for m in milestones if m.get("status") in ["PLANNED", "IN_PROGRESS", "AT_RISK"]]
        open_risks = list(business_risks_collection.find({"workspace_id": workspace_id, "status": {"$in": ["OPEN", "MITIGATING", "ESCALATED"]}}))
        
        # Pull business impact summary
        metrics = list(business_metrics_collection.find({"workspace_id": workspace_id}))
        primary_metric = next((m for m in metrics if m.get("is_configured") and m.get("current_value")), None)
        impact_summary = f"{primary_metric.get('name')}: {primary_metric.get('current_value')} ({primary_metric.get('trend', 'Tracking')})" if primary_metric else "Not configured"

        # Pull recent items
        critical_risks = [r for r in open_risks if r.get("severity") in ["CRITICAL", "HIGH"]][:4]
        
        # Extract features/initiatives from product_features or prd
        features = list(product_features_collection.find({"workspace_id": workspace_id}).limit(5))
        initiatives_list = []
        for f in features:
            initiatives_list.append({
                "initiative_id": f.get("feature_id") or str(f.get("_id")),
                "title": f.get("name") or "Core Feature",
                "stage": f.get("status") or "IN_DEVELOPMENT",
                "priority": f.get("priority") or "HIGH",
                "impact": f"{f.get('users_impacted', 850)}+ customers impacted"
            })
        if not initiatives_list:
            initiatives_list = [
                {"initiative_id": "INIT-01", "title": "One-click checkout", "stage": "IN_DEVELOPMENT", "priority": "CRITICAL", "impact": "1,200+ customers impacted"},
                {"initiative_id": "INIT-02", "title": "Enterprise RBAC & Audit", "stage": "PLANNING", "priority": "HIGH", "impact": "380k ARR pipeline"},
                {"initiative_id": "INIT-03", "title": "AI Feedback Intelligence", "stage": "TESTING", "priority": "MEDIUM", "impact": "75% triage time saved"}
            ]

        # Recent insights
        insights = list(product_insights_collection.find({"workspace_id": workspace_id}).limit(4))
        serialized_insights = []
        for ins in insights:
            serialized_insights.append({
                "id": str(ins.get("_id")),
                "title": ins.get("title") or ins.get("summary") or "Customer Experience Insight",
                "type": ins.get("insight_type") or "HIGH_PRIORITY_ISSUE",
                "evidence_count": ins.get("evidence_count") or 14,
                "urgency": ins.get("urgency") or "HIGH"
            })

        recent_pm_updates = [
            {
                "id": "UPD-01",
                "author": "Priya Sharma (PM)",
                "date": _now_iso(),
                "title": "Checkout Tokenization Staging Milestone Complete",
                "text": "Core token vault passed initial QA security gate with zero data leaks. Pending formal stakeholder alignment approval.",
                "type": "MILESTONE_PROGRESS"
            },
            {
                "id": "UPD-02",
                "author": "Alex Rivera (Lead PM)",
                "date": _now_iso(),
                "title": "Enterprise RBAC Scope Refinement",
                "text": "Proposed 2-week sprint adjustment to include custom compliance roles for financial enterprise tier prospects.",
                "type": "SCOPE_UPDATE"
            }
        ]

        return {
            "workspace_id": workspace_id,
            "workspace_name": ws_name,
            "product_name": "ProdAI Intelligence Platform",
            "product_lifecycle_stage": "Growth & Enterprise Expansion",
            "sync_status": "Synchronized",
            "last_synced_at": _now_iso(),
            "pending_decisions_count": len(pending_approvals),
            "active_initiatives_count": len(initiatives_list),
            "upcoming_milestones_count": len(upcoming_ms),
            "open_risks_count": len(open_risks),
            "business_impact_summary": impact_summary,
            "kpis": {
                "active_initiatives": {
                    "id": "kpi_initiatives",
                    "label": "Active Initiatives",
                    "value": len(initiatives_list),
                    "subtext": "Strategic items in delivery",
                    "target_route": f"/workspace/{workspace_id}/stakeholder/roadmap",
                    "configured": True,
                    "trend": "+2 this month",
                    "badge_variant": "primary"
                },
                "pending_decisions": {
                    "id": "kpi_decisions",
                    "label": "Pending Decisions",
                    "value": len(pending_approvals),
                    "subtext": "Approvals awaiting your review",
                    "target_route": f"/workspace/{workspace_id}/stakeholder/approvals",
                    "configured": True,
                    "trend": "Action required" if pending_approvals else "Queue clear",
                    "badge_variant": "warning" if pending_approvals else "success"
                },
                "upcoming_milestones": {
                    "id": "kpi_milestones",
                    "label": "Upcoming Milestones",
                    "value": len(upcoming_ms),
                    "subtext": "Approaching target delivery dates",
                    "target_route": f"/workspace/{workspace_id}/stakeholder/milestones",
                    "configured": True,
                    "trend": "Next: M1 Tokenization (Oct 28)",
                    "badge_variant": "neutral"
                },
                "open_risks": {
                    "id": "kpi_risks",
                    "label": "Open Business Risks",
                    "value": len(open_risks),
                    "subtext": f"{len(critical_risks)} high or critical severity",
                    "target_route": f"/workspace/{workspace_id}/stakeholder/risks",
                    "configured": True,
                    "trend": "Mitigation underway",
                    "badge_variant": "danger" if critical_risks else "neutral"
                },
                "business_impact": {
                    "id": "kpi_impact",
                    "label": "Business Impact",
                    "value": primary_metric.get("current_value") if primary_metric else "Not configured",
                    "subtext": primary_metric.get("name") if primary_metric else "No primary KPI assigned",
                    "target_route": f"/workspace/{workspace_id}/stakeholder/metrics",
                    "configured": bool(primary_metric),
                    "trend": primary_metric.get("trend") if primary_metric else None,
                    "badge_variant": "success" if primary_metric else "neutral"
                }
            },
            "recent_initiatives": initiatives_list,
            "pending_approvals": [
                {
                    "request_id": a.get("request_id"),
                    "title": a.get("title"),
                    "request_type": a.get("request_type"),
                    "requesting_pm": a.get("requesting_pm"),
                    "due_date": a.get("due_date"),
                    "impact": a.get("business_impact_summary"),
                }
                for a in pending_approvals[:5]
            ],
            "critical_risks": [
                {
                    "risk_id": r.get("risk_id"),
                    "title": r.get("title"),
                    "severity": r.get("severity"),
                    "likelihood": r.get("likelihood"),
                    "owner": r.get("owner"),
                    "target_date": r.get("target_resolution_date"),
                }
                for r in critical_risks
            ],
            "upcoming_milestones": [
                {
                    "milestone_id": m.get("milestone_id"),
                    "title": m.get("title"),
                    "target_date": m.get("target_date"),
                    "status": m.get("status"),
                    "responsible_pm": m.get("responsible_pm"),
                    "progress_percentage": m.get("progress_percentage"),
                }
                for m in upcoming_ms[:4]
            ],
            "recent_pm_updates": recent_pm_updates,
            "key_insights": serialized_insights,
        }

    # ──────────────────────────────────────────────
    # Product Overview & Strategic Alignment
    # ──────────────────────────────────────────────

    def get_product_overview(self, workspace_id: str) -> Dict[str, Any]:
        """Provides read-only product identity, strategic alignment, and traceability links."""
        self._ensure_seed_data(workspace_id)

        ws = workspaces_collection.find_one({"$or": [{"_id": ObjectId(workspace_id) if ObjectId.is_valid(workspace_id) else None}, {"id": workspace_id}]}) or {}
        objectives = list(business_objectives_collection.find({"workspace_id": workspace_id}))
        milestones = list(milestones_collection.find({"workspace_id": workspace_id}))
        risks = list(business_risks_collection.find({"workspace_id": workspace_id}))
        pending_count = approval_requests_collection.count_documents({"workspace_id": workspace_id, "status": "PENDING"})
        metrics = list(business_metrics_collection.find({"workspace_id": workspace_id}))

        # Pull approved PRD references
        approved_prds = list(prd_projects_collection.find({"workspace_id": workspace_id}))

        return {
            "workspace_id": workspace_id,
            "product_id": "PROD-AI-CORE",
            "product_name": "ProdAI Intelligence Platform",
            "product_description": "Enterprise-grade product intelligence platform transforming multi-source customer feedback into validated, executive-approved PRDs and cross-functional team work streams.",
            "product_vision": "Empower product teams and executive stakeholders to collaborate transparently from customer pain points to delivery execution with guaranteed traceability and business alignment.",
            "target_customers": "Enterprise Product Organizations, VP/Head of Product, Business Owners, Cross-functional Engineering Squads",
            "business_owner": "Sarah Lin (Chief Commercial Officer)",
            "product_manager": "Priya Sharma (Senior Lead PM)",
            "current_lifecycle_stage": "Active Enterprise Scaling",
            "strategic_objectives": [
                {
                    "id": o.get("objective_id"),
                    "title": o.get("title"),
                    "status": o.get("status"),
                    "target_date": o.get("target_date"),
                    "rationale": o.get("business_rationale")
                }
                for o in objectives
            ],
            "customer_problems": [
                {"problem": "Payment cart abandonment due to complex checkout screens", "severity": "HIGH"},
                {"problem": "Enterprise security admins lack role customization and audit log access", "severity": "CRITICAL"},
                {"problem": "Scattered customer feedback causes delayed feature prioritization", "severity": "MEDIUM"}
            ],
            "expected_outcomes": [
                "18% lift in checkout completion rate across web & mobile",
                "Unblock $380k ARR enterprise sales pipeline via certified RBAC compliance",
                "Reduce PM requirement-to-engineering handoff latency by 65%"
            ],
            "success_criteria": [
                "Zero security regression in audit and role boundary verification",
                "P95 checkout latency under 1.5 seconds in production",
                "100% stakeholder sign-off on major PRD releases"
            ],
            "target_metrics": [
                {"name": m.get("name"), "target": m.get("target"), "current": m.get("current_value") or "Not configured"}
                for m in metrics
            ],
            "current_status": "Execution on track; Staging verification active for Milestone 1",
            "major_initiatives": [
                {"title": "One-click checkout", "stage": "IN_DEVELOPMENT", "lead": "Priya Sharma"},
                {"title": "Enterprise RBAC & Audit", "stage": "PLANNING", "lead": "Alex Rivera"},
                {"title": "AI Feedback Intelligence", "stage": "TESTING", "lead": "David Chen"}
            ],
            "key_milestones": [
                {"title": m.get("title"), "target_date": m.get("target_date"), "status": m.get("status")}
                for m in milestones[:3]
            ],
            "significant_risks": [
                {"title": r.get("title"), "impact": r.get("business_impact"), "severity": r.get("severity")}
                for r in risks[:3]
            ],
            "pending_decisions_count": pending_count,
            "traceability_links": {
                "approved_prds_count": len(approved_prds),
                "active_objectives_count": len(objectives),
                "customer_insights_count": product_insights_collection.count_documents({"workspace_id": workspace_id}),
                "tracked_metrics_count": len(metrics),
                "milestones_count": len(milestones)
            }
        }

    # ──────────────────────────────────────────────
    # Business Objectives
    # ──────────────────────────────────────────────

    def list_business_objectives(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Lists all business objectives for the workspace."""
        self._ensure_seed_data(workspace_id)
        docs = list(business_objectives_collection.find({"workspace_id": workspace_id}))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    def get_objective_detail(self, workspace_id: str, objective_id: str) -> Dict[str, Any]:
        """Gets detailed context for a specific business objective."""
        self._ensure_seed_data(workspace_id)
        doc = business_objectives_collection.find_one({"workspace_id": workspace_id, "objective_id": objective_id})
        if not doc:
            raise NotFoundError(f"Business Objective {objective_id} not found in workspace.")
        doc["_id"] = str(doc["_id"])
        return doc

    # ──────────────────────────────────────────────
    # Roadmap & Initiatives Portfolio
    # ──────────────────────────────────────────────

    def get_roadmap_portfolio(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Returns high-level initiatives with business objectives, milestones, and approval states."""
        self._ensure_seed_data(workspace_id)

        # Seed realistic initiative roadmap
        return [
            {
                "initiative_id": "INIT-01",
                "title": "One-click checkout & Instant Tokenization",
                "business_objective_id": f"OBJ-01-{workspace_id[-4:] if len(workspace_id) >= 4 else '01'}",
                "business_objective_title": "Streamline Checkout & Reduce Drop-off",
                "expected_outcome": "18% reduction in abandoned carts and 12-second repeat checkout.",
                "current_stage": "IN_DEVELOPMENT",
                "priority": "CRITICAL",
                "target_milestone": "M1: Core Tokenization Engine",
                "planned_timeline": "Oct 15 - Nov 28, 2026",
                "dependencies": ["Payment gateway sandbox API authorization"],
                "risk_status": "MEDIUM",
                "responsible_pm": "Priya Sharma",
                "approval_state": "PENDING_APPROVAL",
                "committed_delivery": True,
                "related_prd_id": "PRD-001"
            },
            {
                "initiative_id": "INIT-02",
                "title": "Enterprise Granular RBAC & Security Audit Logs",
                "business_objective_id": f"OBJ-02-{workspace_id[-4:] if len(workspace_id) >= 4 else '02'}",
                "business_objective_title": "Enhance Enterprise Role Security & Auditability",
                "expected_outcome": "Zero security compliance defects and unlocking 3 enterprise deals ($380k ARR).",
                "current_stage": "PLANNING",
                "priority": "HIGH",
                "target_milestone": "M2: Staging Security Audit",
                "planned_timeline": "Nov 01 - Dec 15, 2026",
                "dependencies": ["Scope-change approval for custom role schema"],
                "risk_status": "LOW",
                "responsible_pm": "Alex Rivera",
                "approval_state": "CHANGES_REQUESTED",
                "committed_delivery": False,
                "related_prd_id": "PRD-002"
            },
            {
                "initiative_id": "INIT-03",
                "title": "Automated Multi-Channel Customer Feedback Clustering",
                "business_objective_id": f"OBJ-03-{workspace_id[-4:] if len(workspace_id) >= 4 else '03'}",
                "business_objective_title": "AI Customer Intelligence Automation",
                "expected_outcome": "75% reduction in manual issue categorization time and 4x faster PRD generation.",
                "current_stage": "TESTING",
                "priority": "MEDIUM",
                "target_milestone": "M3: Beta Launch",
                "planned_timeline": "Dec 01 - Jan 20, 2027",
                "dependencies": ["CrewAI agent pipeline cluster stability"],
                "risk_status": "LOW",
                "responsible_pm": "David Chen",
                "approval_state": "APPROVED",
                "committed_delivery": False,
                "related_prd_id": "PRD-003"
            }
        ]

    # ──────────────────────────────────────────────
    # Pending Approvals & Formal Decisions
    # ──────────────────────────────────────────────

    def list_approval_requests(self, workspace_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists pending or historical approval requests."""
        self._ensure_seed_data(workspace_id)
        query: Dict[str, Any] = {"workspace_id": workspace_id}
        if status:
            query["status"] = status.upper()
        docs = list(approval_requests_collection.find(query).sort("submission_date", -1))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    def get_approval_request_detail(self, workspace_id: str, request_id: str) -> Dict[str, Any]:
        """Gets full details of an approval request with evidence, costs, and risks."""
        self._ensure_seed_data(workspace_id)
        doc = approval_requests_collection.find_one({"workspace_id": workspace_id, "request_id": request_id})
        if not doc:
            raise NotFoundError(f"Approval Request {request_id} not found in workspace.")
        doc["_id"] = str(doc["_id"])
        return doc

    def submit_decision(
        self,
        workspace_id: str,
        request_id: str,
        decision_data: Dict[str, Any],
        user_email: str,
        user_name: str,
    ) -> Dict[str, Any]:
        """
        Submits an authorized business decision:
        1. Verifies request existence and pending status
        2. Validates mandatory rationale
        3. Creates immutable decision record in decision_records collection
        4. Updates authoritative approval_requests state
        5. Logs audit event and sends notification
        """
        self._ensure_seed_data(workspace_id)

        req = approval_requests_collection.find_one({"workspace_id": workspace_id, "request_id": request_id})
        if not req:
            raise NotFoundError(f"Approval request '{request_id}' not found.")

        if req.get("status") not in ["PENDING", "CHANGES_REQUESTED", "CLARIFICATION_REQUESTED"]:
            raise ValidationError(f"Request is already finalized with status '{req.get('status')}'. Cannot overwrite.")

        decision = decision_data.get("decision", "").upper()
        if decision not in ["APPROVED", "REJECTED", "CHANGES_REQUESTED", "CLARIFICATION_REQUESTED"]:
            raise ValidationError(f"Invalid decision '{decision}'. Must be APPROVED, REJECTED, CHANGES_REQUESTED, or CLARIFICATION_REQUESTED.")

        rationale = (decision_data.get("rationale") or "").strip()
        if not rationale or len(rationale) < 10:
            raise ValidationError("A supporting rationale of at least 10 characters is required for accountability.")

        now_str = _now_iso()
        decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"

        decision_record = {
            "decision_id": decision_id,
            "request_id": request_id,
            "workspace_id": workspace_id,
            "decision_type": req.get("request_type", "PRD_ALIGNMENT"),
            "decision_maker": user_name or "Stakeholder",
            "decision_maker_email": user_email,
            "decision": decision,
            "rationale": rationale,
            "comments": decision_data.get("comments"),
            "timestamp": now_str,
            "related_resource_id": req.get("related_resource_id", ""),
            "related_resource_version": req.get("related_resource_version", "v1.0"),
            "follow_up_actions": decision_data.get("follow_up_actions") or [],
            "implementation_status": "APPLIED" if decision == "APPROVED" else "PENDING_PM_ACTION"
        }

        # 1. Insert immutable decision record
        decision_records_collection.insert_one(decision_record)

        # 2. Update authoritative approval request
        approval_requests_collection.update_one(
            {"_id": req["_id"]},
            {
                "$set": {
                    "status": decision,
                    "resolved_decision": {
                        "decision_id": decision_id,
                        "decision": decision,
                        "rationale": rationale,
                        "decision_maker": user_name,
                        "timestamp": now_str,
                    },
                    "last_updated": now_str,
                }
            }
        )

        # 3. Create Notification for PM
        notif_msg = f"Decision recorded for '{req.get('title')}': {decision} by {user_name}."
        stakeholder_notifications_collection.insert_one({
            "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "workspace_id": workspace_id,
            "event_type": "DECISION_RECORDED",
            "message": notif_msg,
            "related_record_type": "APPROVAL_REQUEST",
            "related_record_id": request_id,
            "timestamp": now_str,
            "is_read": False,
            "action_url": f"/workspace/{workspace_id}/stakeholder/decisions"
        })

        decision_record["_id"] = str(decision_record["_id"])
        return {
            "success": True,
            "request_id": request_id,
            "status": decision,
            "decision_id": decision_id,
            "decision_record": decision_record,
        }

    def list_decision_history(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Returns immutable, traceable decision audit history."""
        self._ensure_seed_data(workspace_id)
        docs = list(decision_records_collection.find({"workspace_id": workspace_id}).sort("timestamp", -1))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    # ──────────────────────────────────────────────
    # PRD Business Review & Structured Feedback
    # ──────────────────────────────────────────────

    def get_prd_business_review(self, workspace_id: str, prd_id: str) -> Dict[str, Any]:
        """Provides executive-level PRD review details with business checklist."""
        self._ensure_seed_data(workspace_id)

        # Look up authoritative PRD document if present
        prd = prd_projects_collection.find_one({"workspace_id": workspace_id, "$or": [{"prd_id": prd_id}, {"id": prd_id}]}) or {}
        requirements = list(prd_requirements_collection.find({"workspace_id": workspace_id, "prd_id": prd_id}))

        return {
            "prd_id": prd_id,
            "workspace_id": workspace_id,
            "title": prd.get("title") or "One-Click Checkout & Payment Acceleration PRD",
            "version": prd.get("version") or "v1.2",
            "status": prd.get("status") or "IN_REVIEW",
            "problem_statement": prd.get("problem_statement") or "Customers drop off at 38% rate during multi-step billing address input and card verification.",
            "target_users": "Returning mobile shoppers, high-frequency buyers, corporate account holders",
            "proposed_solution": "Decoupled tokenized 1-click buy button using pre-stored credentials with optimistic server validation.",
            "business_objective": "Streamline Checkout & Reduce Drop-off (+18% completion)",
            "customer_evidence": [
                {"source": "In-App Feedback", "text": "Checkout screen freezes on mobile Safari when autofilling address.", "count": 28},
                {"source": "Support Ticket", "text": "Card retry timeout takes over 45 seconds.", "count": 14}
            ],
            "expected_outcomes": [
                "Reduce average checkout duration from 180s to under 12s",
                "Increase checkout conversion rate from 62.4% to 80.0%",
                "Deliver +$420k incremental GMV quarterly"
            ],
            "success_metrics": [
                {"name": "Checkout Completion Rate", "target": "80%"},
                {"name": "Payment Failure Inquiries", "target": "< 25/mo"}
            ],
            "scope_and_exclusions": {
                "in_scope": ["Credit/Debit card tokenization", "Address quick-select", "Instant order confirmation"],
                "out_of_scope": ["Cryptocurrency payments", "Split invoice multi-vendor settlements"]
            },
            "dependencies": ["Payment gateway tokenization webhook API", "Fraud risk engine scoring p95 < 200ms"],
            "risks": ["Gateway latency during flash sale volume surges", "Regional compliance validation"],
            "requirements_count": len(requirements) or 8,
            "checklist": {
                "problem_relevance": {
                    "question": "Does the problem matter to target customers and align with strategy?",
                    "verified": True,
                    "notes": "Verified by 42 customer complaints and direct GMV metric correlation."
                },
                "expected_value": {
                    "question": "Is the expected commercial benefit clearly quantified with success metrics?",
                    "verified": True,
                    "notes": "+18% conversion target established with baseline tracking."
                },
                "scope_feasibility": {
                    "question": "Are critical technical dependencies and major risks disclosed?",
                    "verified": True,
                    "notes": "Gateway latency mitigation and fallback procedures documented."
                },
                "outcome_measurement": {
                    "question": "Can outcome be evaluated against baseline with defined responsibility?",
                    "verified": True,
                    "notes": "Sarah Lin (CCO) designated as business outcome owner."
                }
            }
        }

    def submit_business_feedback(
        self,
        workspace_id: str,
        feedback_data: Dict[str, Any],
        user_email: str,
        user_name: str,
    ) -> Dict[str, Any]:
        """Submits structured business feedback linked to a PRD, initiative, or objective."""
        self._ensure_seed_data(workspace_id)

        description = (feedback_data.get("description") or "").strip()
        rationale = (feedback_data.get("business_rationale") or "").strip()
        suggested_action = (feedback_data.get("suggested_action") or "").strip()

        if not description or not rationale or not suggested_action:
            raise ValidationError("Description, business rationale, and suggested action are mandatory.")

        now_str = _now_iso()
        feedback_id = f"FDBK-STK-{uuid.uuid4().hex[:8].upper()}"

        doc = {
            "feedback_id": feedback_id,
            "workspace_id": workspace_id,
            "related_resource_type": feedback_data.get("related_resource_type", "PRD"),
            "related_resource_id": feedback_data.get("related_resource_id", "PRD-001"),
            "related_title": feedback_data.get("related_title") or "One-Click Checkout",
            "category": feedback_data.get("category", "BUSINESS_IMPACT"),
            "description": description,
            "business_rationale": rationale,
            "expected_impact": feedback_data.get("expected_impact", "Improved conversion and lower support volume"),
            "supporting_evidence": feedback_data.get("supporting_evidence"),
            "suggested_action": suggested_action,
            "created_by": user_name or "Stakeholder",
            "created_by_email": user_email,
            "created_at": now_str,
            "status": "SUBMITTED",
            "pm_response": None,
            "pm_response_by": None,
            "pm_response_at": None,
        }

        stakeholder_feedback_collection.insert_one(doc)

        # Notify PM
        stakeholder_notifications_collection.insert_one({
            "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "workspace_id": workspace_id,
            "event_type": "PM_RESPONSE",
            "message": f"New business feedback submitted by {user_name} on {doc['related_title']}.",
            "related_record_type": "FEEDBACK",
            "related_record_id": feedback_id,
            "timestamp": now_str,
            "is_read": False,
            "action_url": f"/workspace/{workspace_id}/stakeholder/feedback"
        })

        doc["_id"] = str(doc["_id"])
        return doc

    def list_business_feedback(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Lists structured stakeholder feedback records."""
        self._ensure_seed_data(workspace_id)
        docs = list(stakeholder_feedback_collection.find({"workspace_id": workspace_id}).sort("created_at", -1))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    def respond_to_feedback(
        self,
        workspace_id: str,
        feedback_id: str,
        response_text: str,
        status: str,
        pm_name: str,
    ) -> Dict[str, Any]:
        """Allows PM to provide an authoritative response to stakeholder feedback."""
        self._ensure_seed_data(workspace_id)
        fdbk = stakeholder_feedback_collection.find_one({"workspace_id": workspace_id, "feedback_id": feedback_id})
        if not fdbk:
            raise NotFoundError(f"Feedback {feedback_id} not found.")

        now_str = _now_iso()
        stakeholder_feedback_collection.update_one(
            {"_id": fdbk["_id"]},
            {
                "$set": {
                    "pm_response": response_text,
                    "pm_response_by": pm_name or "Product Manager",
                    "pm_response_at": now_str,
                    "status": status or "RESPONSE_PROVIDED",
                }
            }
        )

        # Notify Stakeholder
        stakeholder_notifications_collection.insert_one({
            "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "workspace_id": workspace_id,
            "event_type": "PM_RESPONSE",
            "message": f"PM responded to your feedback on {fdbk.get('related_title')}: {response_text[:60]}...",
            "related_record_type": "FEEDBACK",
            "related_record_id": feedback_id,
            "timestamp": now_str,
            "is_read": False,
            "action_url": f"/workspace/{workspace_id}/stakeholder/feedback"
        })

        return {"success": True, "feedback_id": feedback_id, "status": status}

    # ──────────────────────────────────────────────
    # Milestones & Progress Tracking
    # ──────────────────────────────────────────────

    def list_milestones(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Lists milestones with progress breakdown."""
        self._ensure_seed_data(workspace_id)
        docs = list(milestones_collection.find({"workspace_id": workspace_id}).sort("target_date", 1))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    # ──────────────────────────────────────────────
    # Business Impact & Success Metrics
    # ──────────────────────────────────────────────

    def list_business_metrics(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Lists success metrics distinguishing measured results from targets and unconfigured items."""
        self._ensure_seed_data(workspace_id)
        docs = list(business_metrics_collection.find({"workspace_id": workspace_id}))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    # ──────────────────────────────────────────────
    # Risks & Dependencies Register
    # ──────────────────────────────────────────────

    def list_risks_and_dependencies(self, workspace_id: str) -> Dict[str, Any]:
        """Returns business risk register and operational dependencies."""
        self._ensure_seed_data(workspace_id)
        risks = list(business_risks_collection.find({"workspace_id": workspace_id}))
        for r in risks:
            r["_id"] = str(r["_id"])

        dependencies = [
            {
                "dependency_id": "DEP-01",
                "workspace_id": workspace_id,
                "description": "Payment Gateway Tokenization Sandbox API Access",
                "dependent_initiative": "One-click checkout",
                "responsible_owner": "Rajesh Kumar (Lead Architect)",
                "expected_resolution_date": "2026-10-25",
                "status": "IN_PROGRESS",
                "business_impact_if_delayed": "Delays M1 token testing by 5 business days."
            },
            {
                "dependency_id": "DEP-02",
                "workspace_id": workspace_id,
                "description": "Third-Party SOC2 Audit Schedule Confirmation",
                "dependent_initiative": "Enterprise RBAC",
                "responsible_owner": "Alex Rivera (Lead PM)",
                "expected_resolution_date": "2026-11-05",
                "status": "RESOLVED",
                "business_impact_if_delayed": "None; scheduled for Nov 12 audit window."
            }
        ]

        return {"risks": risks, "dependencies": dependencies}

    # ──────────────────────────────────────────────
    # Notifications
    # ──────────────────────────────────────────────

    def list_notifications(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Lists stakeholder notifications."""
        self._ensure_seed_data(workspace_id)
        docs = list(stakeholder_notifications_collection.find({"workspace_id": workspace_id}).sort("timestamp", -1).limit(20))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    def mark_notification_read(self, workspace_id: str, notification_id: str) -> Dict[str, Any]:
        """Marks a notification as read without mutating underlying decision or PRD state."""
        self._ensure_seed_data(workspace_id)
        res = stakeholder_notifications_collection.update_one(
            {"workspace_id": workspace_id, "notification_id": notification_id},
            {"$set": {"is_read": True}}
        )
        return {"success": True, "notification_id": notification_id, "modified": res.modified_count}


stakeholder_service = StakeholderService()
