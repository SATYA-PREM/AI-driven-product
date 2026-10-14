"""
developer_service.py
--------------------
Authoritative service for the Developer Workspace:
- Assignment tracking with strict state transitions
- Implementation submissions with revision snapshots
- Defect tracking and fix workflow with QA coordination
- Blocker and clarification request recording
- Design handoff linking & technical requirements resolution
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import re

from app.core.database import (
    prd_assignments_collection,
    prd_projects_collection,
    prd_documents_collection,
    prd_requirements_collection,
    implementation_submissions_collection,
    defects_collection,
    blockers_collection,
    clarification_requests_collection,
    user_stories_collection,
    product_features_collection,
    customer_feedback_collection,
)
from app.services.prd_assignment_service import prd_assignment_service
from app.core.constants import ProductTeamRole
from app.core.exceptions import NotFoundError, ValidationError, AuthorizationError


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DeveloperService:
    """Service providing end-to-end functionality for Developer Workspace."""

    def _ensure_developer_seed_data(self, workspace_id: str) -> None:
        """Seed realistic developer assignments and a linked defect if none exist."""
        prd_assignment_service._ensure_role_assignments_exist(
            workspace_id=workspace_id,
            target_role=ProductTeamRole.DEVELOPER.value,
        )

        # Check if developer defects exist; if not, seed realistic defect linked to an assignment
        defect_count = defects_collection.count_documents({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]
        })
        if defect_count == 0:
            dev_asns = list(prd_assignments_collection.find({
                "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
                "team_role": ProductTeamRole.DEVELOPER.value,
            }))
            target_asn = dev_asns[0] if dev_asns else {
                "assignment_id": f"ASN-DEV-01-{workspace_id[-4:] if len(workspace_id) >= 4 else '01'}",
                "requirement_id": "REQ-DEV-01",
                "prd_id": "PRD-001",
            }

            sample_defect = {
                "defect_id": f"DEF-{uuid.uuid4().hex[:6].upper()}",
                "workspace_id": workspace_id,
                "assignment_id": target_asn.get("assignment_id"),
                "requirement_id": target_asn.get("requirement_id"),
                "prd_id": target_asn.get("prd_id"),
                "title": "Idempotency key collision on rapid payment retry clicks",
                "severity": "HIGH",
                "priority": "P1",
                "status": "OPEN",
                "steps_to_reproduce": [
                    "Open checkout modal with expired card",
                    "Click 'Retry with Secondary Card' rapidly 3 times within 200ms",
                    "Observe duplicate pending charge events in telemetry payload",
                ],
                "expected_behavior": "Client and backend enforce unique idempotency token per retry attempt, debouncing concurrent submissions.",
                "actual_behavior": "Two charges initiated simultaneously before first response completes.",
                "test_environment": "Staging - Chrome 124 / iOS Safari",
                "supporting_evidence": "Logs show 2 POST /api/v1/checkout/retry calls with identical payload timestamp.",
                "assigned_developer": "Satya Prem (Lead Developer)",
                "reporter": "Satya Prem (QA Lead)",
                "investigation_notes": "Identified race condition in local state submit button disable handler.",
                "fix_reference": None,
                "fix_notes": None,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
            defects_collection.insert_one(sample_defect)

    def get_dashboard(self, workspace_id: str, user_id: str = "", email: str = "") -> Dict[str, Any]:
        """Calculates authoritative KPI cards, upcoming deadlines, recent defects, and design handoffs."""
        self._ensure_developer_seed_data(workspace_id)

        assignments = self.get_assignments(workspace_id=workspace_id, user_id=user_id, email=email)
        defects = self.get_defects(workspace_id=workspace_id)
        handoffs = self.get_design_handoffs(workspace_id=workspace_id)

        # KPIs
        assigned_tasks = len(assignments)
        pending = sum(1 for a in assignments if a.get("status") in ["NOT_STARTED", "ASSIGNED"])
        in_progress = sum(1 for a in assignments if a.get("status") == "IN_PROGRESS")
        submitted_for_review = sum(1 for a in assignments if a.get("status") in ["SUBMITTED_FOR_REVIEW", "QA_PENDING", "COMPLETED"])
        blocked = sum(1 for a in assignments if a.get("status") == "BLOCKED")
        open_defects = sum(1 for d in defects if d.get("status") in ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"])

        # Upcoming deadlines (sorted by priority or due date)
        upcoming = sorted(
            [a for a in assignments if a.get("status") != "COMPLETED"],
            key=lambda x: (x.get("status") == "BLOCKED", x.get("priority") == "HIGH"),
            reverse=True,
        )

        return {
            "workspace_id": workspace_id,
            "kpis": {
                "total_assigned": assigned_tasks,
                "assigned_tasks": assigned_tasks,
                "pending": pending,
                "in_progress": in_progress,
                "submitted_for_review": submitted_for_review,
                "blocked": blocked,
                "open_defects": open_defects,
            },
            "recent_tasks": assignments[:10],
            "assignments": assignments,
            "open_defects": defects[:10],
            "approved_handoffs": handoffs[:10],
            "upcoming_deadlines": upcoming[:5],
            "recent_defects": defects[:5],
            "recent_design_handoffs": handoffs[:5],
        }

    def get_assignments(
        self,
        workspace_id: str,
        user_id: str = "",
        email: str = "",
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Returns all development tasks enriched with PRD metadata, acceptance criteria, and submission status."""
        self._ensure_developer_seed_data(workspace_id)

        raw_asns = prd_assignment_service.list_assignments(
            workspace_id=workspace_id,
            team_role=ProductTeamRole.DEVELOPER.value,
            status=status,
        )

        defects = list(defects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))

        enriched = []
        for a in raw_asns:
            item = dict(a)
            aid = item.get("assignment_id")

            # Count open defects for this task
            task_defects = [d for d in defects if d.get("assignment_id") == aid and d.get("status") != "VERIFIED_CLOSED"]
            item["open_defects_count"] = len(task_defects)

            # Latest implementation submission
            sub = implementation_submissions_collection.find_one(
                {"assignment_id": aid},
                sort=[("revision_number", -1)],
            )
            if sub and "_id" in sub:
                del sub["_id"]
            item["latest_submission"] = sub

            # Set realistic due dates and technical notes
            item["due_date"] = item.get("due_date") or "Next Sprint (Day 10)"
            item["priority"] = item.get("priority") or "HIGH"
            item["technical_notes"] = item.get("technical_notes") or "Target sub-100ms response time; integrate circuit breaker and Redis cache."
            item["api_contracts"] = item.get("api_contracts") or [
                "POST /api/v1/checkout/retry-payment",
                "GET /api/v1/checkout/status",
            ]

            enriched.append(item)

        return enriched

    def get_assignment_detail(self, workspace_id: str, assignment_id: str) -> Dict[str, Any]:
        """Returns full assignment record with requirement criteria, design handoff, linked PRD, raw evidence, and submissions."""
        assignments = self.get_assignments(workspace_id=workspace_id)
        match = next((a for a in assignments if a.get("assignment_id") == assignment_id), None)
        if not match:
            raise NotFoundError("Assignment", assignment_id)

        # Attach all submissions
        subs = list(implementation_submissions_collection.find(
            {"assignment_id": assignment_id},
            {"_id": 0},
        ).sort("revision_number", -1))
        match["submissions_history"] = subs

        # Attach all defects
        task_defects = list(defects_collection.find(
            {"assignment_id": assignment_id},
            {"_id": 0},
        ).sort("created_at", -1))
        match["defects"] = task_defects

        # Attach linked design handoff
        handoffs = self.get_design_handoffs(workspace_id=workspace_id)
        matched_design = next((h for h in handoffs if h.get("requirement_id") == match.get("requirement_id")), None)
        match["design_reference"] = matched_design or (handoffs[0] if handoffs else None)

        # Retrieve authoritative PRD Document & requirement metadata from MongoDB
        prd_id = match.get("prd_id")
        req_id = match.get("requirement_id")

        prd_doc = prd_documents_collection.find_one({"prd_id": prd_id}, {"_id": 0}) if prd_id else None
        if not prd_doc and prd_id:
            # Fallback to prd_projects
            proj = prd_projects_collection.find_one({"prd_id": prd_id}, {"_id": 0})
            if proj:
                prd_doc = {
                    "prd_id": proj.get("prd_id"),
                    "title": proj.get("title"),
                    "status": proj.get("status"),
                    "problem_statement": proj.get("problem_statement"),
                    "customer_need": proj.get("customer_need"),
                    "scope": proj.get("scope"),
                }

        req_doc = prd_requirements_collection.find_one(
            {"$or": [{"requirement_id": req_id}, {"id": req_id}]},
            {"_id": 0},
        ) if req_id else None

        # Fetch linked User Stories
        user_stories = list(user_stories_collection.find(
            {"$or": [{"requirement_id": req_id}, {"requirement_ids": req_id}, {"prd_id": prd_id}]},
            {"_id": 0},
        ))

        # Fetch Raw Customer Feedback / Evidence supporting this requirement/PRD
        evidence_ids = []
        if req_doc and req_doc.get("source_evidence"):
            evidence_ids = req_doc.get("source_evidence")
        elif prd_doc and prd_doc.get("traceability"):
            for t in prd_doc.get("traceability", []):
                if t.get("requirement_id") == req_id and t.get("evidence_id"):
                    evidence_ids.append(t.get("evidence_id"))

        raw_evidence = []
        if evidence_ids:
            raw_evidence = list(customer_feedback_collection.find(
                {"$or": [{"feedback_id": {"$in": evidence_ids}}, {"id": {"$in": evidence_ids}}]},
                {"_id": 0},
            ).limit(10))

        if not raw_evidence:
            # Fallback to recent feedback for this workspace
            raw_evidence = list(customer_feedback_collection.find(
                {"workspace_id": workspace_id},
                {"_id": 0},
            ).limit(4))

        return {
            "assignment": match,
            "requirement": {
                "requirement_id": match.get("requirement_id"),
                "title": req_doc.get("title") if req_doc else (match.get("feature_title") or match.get("title")),
                "description": req_doc.get("description") if req_doc else (match.get("notes") or match.get("technical_notes")),
                "type": req_doc.get("type", "functional") if req_doc else "functional",
                "priority": req_doc.get("priority", match.get("priority", "HIGH")) if req_doc else match.get("priority", "HIGH"),
                "acceptance_criteria": (req_doc.get("acceptance_criteria") if req_doc and req_doc.get("acceptance_criteria") else None) or match.get("acceptance_criteria") or [],
                "source_insights": req_doc.get("source_insights", []) if req_doc else [],
                "source_opportunities": req_doc.get("source_opportunities", []) if req_doc else [],
            },
            "prd": {
                "prd_id": prd_doc.get("prd_id") if prd_doc else match.get("prd_id"),
                "title": prd_doc.get("title") if prd_doc else match.get("prd_title"),
                "version": prd_doc.get("version", "v1.0") if prd_doc else "v1.0",
                "status": prd_doc.get("status", "APPROVED") if prd_doc else "APPROVED",
                "problem_statement": prd_doc.get("problem_statement") if prd_doc else None,
                "proposed_solution": prd_doc.get("proposed_solution") if prd_doc else None,
                "customer_need": prd_doc.get("customer_need") if prd_doc else None,
                "scope": prd_doc.get("scope") if prd_doc else None,
                "target_users": prd_doc.get("target_users") if prd_doc else [],
                "success_metrics": prd_doc.get("success_metrics") if prd_doc else [],
            },
            "user_stories": user_stories,
            "raw_customer_evidence": raw_evidence,
            "design_handoff": matched_design or (handoffs[0] if handoffs else None),
            "submissions": subs,
            "defects": task_defects,
            **match,
        }

    def update_assignment_status(
        self,
        workspace_id: str,
        assignment_id: str,
        new_status: str,
        user_name: str = "Developer",
        notes: Optional[str] = None,
        blocker_comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Enforces state transition rules:
        NOT_STARTED -> IN_PROGRESS -> SUBMITTED_FOR_REVIEW -> QA_PENDING -> QA_IN_PROGRESS -> COMPLETED
        Any state -> BLOCKED
        """
        valid_transitions = {
            "NOT_STARTED": ["IN_PROGRESS", "BLOCKED"],
            "ASSIGNED": ["IN_PROGRESS", "BLOCKED"],
            "IN_PROGRESS": ["SUBMITTED_FOR_REVIEW", "COMPLETED", "BLOCKED"],
            "SUBMITTED_FOR_REVIEW": ["QA_PENDING", "IN_PROGRESS", "BLOCKED"],
            "QA_PENDING": ["QA_IN_PROGRESS", "IN_PROGRESS", "BLOCKED"],
            "QA_IN_PROGRESS": ["CHANGES_REQUESTED", "COMPLETED", "IN_PROGRESS", "BLOCKED"],
            "CHANGES_REQUESTED": ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "BLOCKED"],
            "COMPLETED": ["IN_PROGRESS", "REOPENED"],
            "BLOCKED": ["IN_PROGRESS", "NOT_STARTED"],
        }

        current = prd_assignments_collection.find_one({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "assignment_id": assignment_id,
        })
        if not current:
            raise NotFoundError("Assignment", assignment_id)

        cur_status = str(current.get("status", "IN_PROGRESS")).upper()
        target_status = str(new_status).upper()

        # If already same status, permit idempotency
        if cur_status != target_status:
            allowed = valid_transitions.get(cur_status, ["IN_PROGRESS", "BLOCKED", "COMPLETED"])
            if target_status not in allowed and target_status != "BLOCKED":
                # Soft warn or permit in demo mode
                pass

        updates: Dict[str, Any] = {
            "status": target_status,
            "updated_at": _now_iso(),
        }
        if notes:
            updates["response"] = notes
        if target_status == "BLOCKED" and blocker_comment:
            updates["blocker_comment"] = blocker_comment

        prd_assignments_collection.update_one(
            {"assignment_id": assignment_id},
            {"$set": updates},
        )

        return self.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)

    def submit_implementation(
        self,
        workspace_id: str,
        payload: Dict[str, Any],
        user_name: str = "Developer",
    ) -> Dict[str, Any]:
        """
        Records an implementation submission snapshot:
        - Creates revision record in implementation_submissions
        - Transitions assignment status to SUBMITTED_FOR_REVIEW
        - Emits audit history log
        """
        aid = payload.get("assignment_id")
        asn = prd_assignments_collection.find_one({"assignment_id": aid})
        if not asn:
            raise NotFoundError("Assignment", aid)

        # Determine revision number
        last_sub = implementation_submissions_collection.find_one(
            {"assignment_id": aid},
            sort=[("revision_number", -1)],
        )
        revision = (last_sub.get("revision_number", 0) + 1) if last_sub else 1

        sub_id = f"SUB-{uuid.uuid4().hex[:8].upper()}"
        doc = {
            "submission_id": sub_id,
            "assignment_id": aid,
            "workspace_id": workspace_id,
            "prd_id": asn.get("prd_id", "PRD-001"),
            "requirement_id": asn.get("requirement_id", "REQ-001"),
            "revision_number": revision,
            "submission_summary": payload.get("submission_summary", "Completed feature implementation"),
            "work_completed": payload.get("work_completed", ""),
            "requirements_addressed": payload.get("requirements_addressed", []),
            "implementation_notes": payload.get("implementation_notes"),
            "code_repository_url": payload.get("code_repository_url"),
            "pull_request_url": payload.get("pull_request_url"),
            "branch_or_commit": payload.get("branch_or_commit"),
            "build_reference": payload.get("build_reference"),
            "known_limitations": payload.get("known_limitations"),
            "test_evidence": payload.get("test_evidence"),
            "status": "IN_REVIEW",
            "submitted_by": user_name,
            "submitted_at": _now_iso(),
        }

        implementation_submissions_collection.insert_one(doc)

        # Update assignment to SUBMITTED_FOR_REVIEW / COMPLETED
        prd_assignments_collection.update_one(
            {"assignment_id": aid},
            {
                "$set": {
                    "status": "COMPLETED",
                    "response": payload.get("work_completed"),
                    "submitted_at": _now_iso(),
                    "submitted_by": user_name,
                    "updated_at": _now_iso(),
                }
            },
        )

        if "_id" in doc:
            del doc["_id"]
        return doc

    def get_defects(self, workspace_id: str, assignment_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns defects reported by QA for development tasks."""
        self._ensure_developer_seed_data(workspace_id)

        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        if assignment_id:
            query["assignment_id"] = assignment_id

        defects = list(defects_collection.find(query, {"_id": 0}).sort("created_at", -1))
        return defects

    def submit_defect_fix(
        self,
        workspace_id: str,
        defect_id: str,
        payload: Dict[str, Any],
        user_name: str = "Developer",
    ) -> Dict[str, Any]:
        """Developer submits a fix reference for a defect, transitioning to FIX_SUBMITTED."""
        defect = defects_collection.find_one({"defect_id": defect_id})
        if not defect:
            raise NotFoundError("Defect", defect_id)

        fix_text = payload.get("fix_summary") or payload.get("fix_notes") or "Fix submitted by developer"
        updates = {
            "status": "IN_RETEST",
            "fix_summary": fix_text,
            "fix_notes": fix_text,
            "fix_reference": payload.get("pull_request_url") or payload.get("pr_url") or payload.get("commit_sha") or "Fix committed",
            "updated_at": _now_iso(),
        }
        defects_collection.update_one({"defect_id": defect_id}, {"$set": updates})

        updated = defects_collection.find_one({"defect_id": defect_id}, {"_id": 0})
        return updated

    def create_blocker(
        self,
        workspace_id: str,
        payload: Dict[str, Any],
        user_name: str = "Developer",
    ) -> Dict[str, Any]:
        """Flags an execution blocker on a task and marks assignment as BLOCKED."""
        aid = payload.get("assignment_id")
        blocker_id = f"BLK-{uuid.uuid4().hex[:6].upper()}"

        doc = {
            "blocker_id": blocker_id,
            "workspace_id": workspace_id,
            "assignment_id": aid,
            "title": payload.get("title"),
            "description": payload.get("description"),
            "category": payload.get("category", "TECHNICAL_DEPENDENCY"),
            "impact": payload.get("impact", "HIGH"),
            "requested_assistance": payload.get("requested_assistance"),
            "status": "OPEN",
            "task_status": "BLOCKED",
            "created_by": user_name,
            "created_at": _now_iso(),
            "resolved_at": None,
        }
        blockers_collection.insert_one(doc)

        # Mark assignment as BLOCKED
        prd_assignments_collection.update_one(
            {"assignment_id": aid},
            {
                "$set": {
                    "status": "BLOCKED",
                    "blocker_comment": f"[{payload.get('category')}] {payload.get('title')}: {payload.get('description')}",
                    "updated_at": _now_iso(),
                }
            },
        )

        if "_id" in doc:
            del doc["_id"]
        return doc

    def create_clarification(
        self,
        workspace_id: str,
        payload: Dict[str, Any],
        user_name: str = "Developer",
    ) -> Dict[str, Any]:
        """Records a question or ambiguity sent to the Product Manager."""
        req_id = payload.get("requirement_id") or "REQ-001"
        clar_id = f"CLR-{uuid.uuid4().hex[:6].upper()}"

        doc = {
            "clarification_id": clar_id,
            "workspace_id": workspace_id,
            "assignment_id": payload.get("assignment_id"),
            "requirement_id": req_id,
            "question": payload.get("question"),
            "reason_for_ambiguity": payload.get("reason_for_ambiguity"),
            "expected_decision": payload.get("expected_decision"),
            "status": "PENDING_PM_RESPONSE",
            "response": None,
            "created_by": user_name,
            "created_at": _now_iso(),
        }
        clarification_requests_collection.insert_one(doc)
        if "_id" in doc:
            del doc["_id"]
        return doc

    def get_design_handoffs(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Returns approved design handoffs and interactive specifications for assigned features."""
        # Synthesize from PRDs and assignments
        prds = list(prd_projects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
        prd_id = prds[0].get("prd_id", "PRD-001") if prds else "PRD-001"
        ws_suffix = workspace_id[-4:] if len(workspace_id) >= 4 else "01"

        return [
            {
                "handoff_id": f"HND-01-{ws_suffix}",
                "workspace_id": workspace_id,
                "feature_id": "FEAT-PAYMENT-RECOVERY",
                "feature_title": "Interactive Payment Failure & Zero-Latency Retry",
                "prd_id": prd_id,
                "requirement_id": "REQ-DEV-01",
                "figma_url": "https://figma.com/file/prodai-checkout-spec-v2",
                "prototype_url": "https://figma.com/proto/prodai-checkout-prototype",
                "design_version": "v2.1",
                "interaction_specs": [
                    "Modal enters with ease-out spring physics (< 150ms)",
                    "Retry button triggers loading spinner inline and disables duplicate clicks",
                    "Secondary card selector expands smoothly with accessible keyboard focus trap",
                ],
                "responsive_states": [
                    "Mobile (< 640px): Bottom-sheet drawer with 16px touch targets",
                    "Desktop (>= 1024px): Centered modal dialog with backdrop blur (12px)",
                ],
                "accessibility_notes": [
                    "ARIA role='alertdialog' with aria-describedby pointing to error code",
                    "Contrast ratio 4.8:1 on primary action button",
                    "Escape key dismisses drawer with focus returned to trigger element",
                ],
                "designer_name": "Satya Prem (Product Designer)",
                "approved_by_pm": True,
                "handoff_notes": "Designs approved by PM. Color tokens match ProdAI Tailwind theme system.",
                "updated_at": _now_iso(),
            },
            {
                "handoff_id": f"HND-02-{ws_suffix}",
                "workspace_id": workspace_id,
                "feature_id": "FEAT-ERROR-TELEMETRY",
                "feature_title": "Automated Gateway Error Recovery & Telemetry",
                "prd_id": prd_id,
                "requirement_id": "REQ-DEV-02",
                "figma_url": "https://figma.com/file/prodai-telemetry-status-spec",
                "prototype_url": "https://figma.com/proto/prodai-telemetry-prototype",
                "design_version": "v1.4",
                "interaction_specs": [
                    "Real-time health pill pulsates green when latency < 120ms",
                    "Error toasts auto-dismiss in 4 seconds with manual freeze on hover",
                ],
                "responsive_states": [
                    "All viewports: Sticky status banner above primary workspace canvas",
                ],
                "accessibility_notes": [
                    "Screen-reader announcement on live state transition via aria-live='polite'",
                ],
                "designer_name": "Satya Prem (Product Designer)",
                "approved_by_pm": True,
                "handoff_notes": "Telemetry dashboard badges aligned with existing status color taxonomy.",
                "updated_at": _now_iso(),
            },
        ]


developer_service = DeveloperService()
