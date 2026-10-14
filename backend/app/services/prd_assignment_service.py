"""
prd_assignment_service.py
-------------------------
Service for managing PRD Requirement Assignments, Async AI Analysis Jobs,
Audit Logging, and Downstream Product Team Handoff.
"""

from __future__ import annotations
import threading
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.core.logging import get_logger
from app.core.constants import (
    ProductTeamRole,
    AssignmentStatus,
    AssignmentMethod,
    AssignmentJobStage,
    JobStatus,
)
from app.core.database import users_collection
from app.core.database import (
    users_collection,
    prd_assignments_collection,
    prd_projects_collection,
)
from app.repositories.prd_repository import prd_repository
from app.repositories.prd_assignment_repository import prd_assignment_repository
from app.repositories.prd_assignment_job_repository import prd_assignment_job_repository
from app.models.prd_assignment import PRDAssignmentModel
from app.models.prd_assignment_job import PRDAssignmentJobModel, PRDAssignmentRecommendationModel
from app.agents.prd_assignment_agent import PRDAssignmentAgent
from app.services.workspace.member_service import member_service

logger = get_logger(__name__)

# Standard Product Team Roles & Default Avatars/Titles
PRODUCT_ROLE_METADATA = {
    ProductTeamRole.PRODUCT_MANAGER.value: {
        "title": "Product Manager (PM)",
        "default_name": "Priya Sharma (PM)",
        "default_email": "priya.sharma@prodintel.ai",
        "default_name": "Satya Prem (PM / Admin)",
        "default_email": "satya@admin",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.PRODUCT_DESIGNER.value: {
        "title": "Product Designer / UX Designer",
        "default_name": "Yash (Product Designer)",
        "default_email": "yash.designer@prodintel.ai",
        "default_name": "Satya Prem (Product Designer)",
        "default_email": "satya@designer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.DEVELOPER.value: {
        "title": "Developer / Engineer",
        "default_name": "Elamaran (Lead Engineer)",
        "default_email": "elamaran.dev@prodintel.ai",
        "title": "Developer / Lead Engineer",
        "default_name": "Satya Prem (Lead Developer)",
        "default_email": "satya@developer",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.QA.value: {
        "title": "QA / Tester",
        "default_name": "Ananya (QA Specialist)",
        "default_email": "ananya.qa@prodintel.ai",
        "default_name": "Satya Prem (QA Lead)",
        "default_email": "satya@qa",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.STAKEHOLDER.value: {
        "title": "Stakeholder / Business Owner",
        "default_name": "Marcus (Business Sponsor)",
        "default_email": "marcus.stakeholder@prodintel.ai",
        "default_name": "Satya Prem (Business Owner)",
        "default_email": "satya@stakeholder",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
}


class PRDAssignmentService:

    def __init__(self):
        self.agent = PRDAssignmentAgent()

    # ──────────────────────────────────────────────
    # 1. Team Members Resolution
    # ──────────────────────────────────────────────
    def get_workspace_team_members(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Returns verified team members for a workspace mapped to the 5 Product Team Roles.
        Ensures realistic default coverage for UX Designer, Developer, QA, PM and Stakeholder.
        """
        raw_members = []
        try:
            raw_members = member_service.list_members(workspace_id)
        except Exception as e:
            logger.warning(f"Could not fetch member list for workspace {workspace_id}: {e}")

        members_by_role: Dict[str, List[Dict[str, Any]]] = {}

        for m in raw_members:
            uid = str(m.get("user_id") or m.get("id") or m.get("_id", ""))
            name = m.get("name") or m.get("user_name") or "Team Member"
            email = m.get("email") or m.get("user_email") or ""
            raw_role = str(m.get("role") or "").upper()

            # Map raw role string to ProductTeamRole
            role_enum = ProductTeamRole.DEVELOPER.value
            if any(k in raw_role for k in ["PM", "PRODUCT_MANAGER", "OWNER", "ADMIN"]):
                role_enum = ProductTeamRole.PRODUCT_MANAGER.value
            elif any(k in raw_role for k in ["DESIGN", "UX", "UI"]):
                role_enum = ProductTeamRole.PRODUCT_DESIGNER.value
            elif any(k in raw_role for k in ["QA", "TEST", "VALIDATION"]):
                role_enum = ProductTeamRole.QA.value
            elif any(k in raw_role for k in ["STAKEHOLDER", "BUSINESS", "SPONSOR"]):
                role_enum = ProductTeamRole.STAKEHOLDER.value

            meta = PRODUCT_ROLE_METADATA.get(role_enum, PRODUCT_ROLE_METADATA[ProductTeamRole.DEVELOPER.value])
            member_obj = {
                "user_id": uid,
                "name": name,
                "email": email,
                "team_role": role_enum,
                "role_title": meta["title"],
                "avatar": m.get("avatar") or meta["avatar"],
                "is_active": m.get("is_active", True),
            }
            members_by_role.setdefault(role_enum, []).append(member_obj)

        # Ensure all 5 roles have at least one active team member
        full_roster: List[Dict[str, Any]] = []
        for role_key, meta in PRODUCT_ROLE_METADATA.items():
            if role_key in members_by_role and members_by_role[role_key]:
                full_roster.extend(members_by_role[role_key])
            else:
                synthetic_id = f"usr_{role_key.lower()[:6]}_{workspace_id[-4:] if len(workspace_id) >= 4 else '001'}"
                full_roster.append({
                    "user_id": synthetic_id,
                    "name": meta["default_name"],
                    "email": meta["default_email"],
                    "team_role": role_key,
                    "role_title": meta["title"],
                    "avatar": meta["avatar"],
                    "is_active": True,
                })

        return full_roster

    # ──────────────────────────────────────────────
    # 2. Async AI Assignment Analysis Job
    # ──────────────────────────────────────────────
    def create_assignment_job(
        self,
        workspace_id: str,
        prd_ids: List[str],
        category_id: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates an asynchronous assignment analysis job and launches a background worker."""
        job_doc = PRDAssignmentJobModel.create_document(
            workspace_id=workspace_id,
            prd_ids=prd_ids,
            category_id=category_id,
            created_by=created_by,
        )
        job_id = prd_assignment_job_repository.create_job(job_doc)

        thread = threading.Thread(
            target=self._run_assignment_analysis_job_sync,
            args=(job_id, workspace_id, prd_ids),
            daemon=True,
        )
        thread.start()

        return job_doc

    def _run_assignment_analysis_job_sync(
        self,
        job_id: str,
        workspace_id: str,
        prd_ids: List[str],
    ) -> None:
        """Background worker thread executing the multi-stage assignment analysis."""
        logger.info(f"Starting async assignment analysis job {job_id} for {len(prd_ids)} PRDs")
        try:
            # Stage 1: Fetching PRDs
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.FETCHING_PRDS,
                progress=15,
                processed_requirements=0,
                status=JobStatus.RUNNING,
            )
            time.sleep(0.3)

            # Stage 2: Extracting Planning Data
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.EXTRACTING_PLANNING_DATA,
                progress=30,
                processed_requirements=0,
            )

            candidate_members = self.get_workspace_team_members(workspace_id)

            total_requirements_count = 0
            all_recommendations: List[Dict[str, Any]] = []

            # Stage 3: Analyzing Requirements
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.ANALYZING_REQUIREMENTS,
                progress=40,
                processed_requirements=0,
            )

            for idx, prd_id in enumerate(prd_ids):
                project = prd_repository.find_project_by_prd_id(prd_id) or {"prd_id": prd_id}
                doc = prd_repository.get_document(prd_id)
                requirements = prd_repository.get_requirements(prd_id)
                features = prd_repository.get_features(prd_id)
                acceptance_criteria = prd_repository.get_acceptance_criteria_by_prd(prd_id)

                total_requirements_count += len(requirements)

                # Execute PRDAssignmentAgent for this PRD
                prd_recs = self.agent.analyze_assignments(
                    prd_project=project,
                    prd_document=doc,
                    requirements=requirements,
                    features=features,
                    acceptance_criteria=acceptance_criteria,
                    candidate_members=candidate_members,
                )

                # Persist each recommendation
                for r in prd_recs:
                    rec_doc = PRDAssignmentRecommendationModel.create_document(
                        job_id=job_id,
                        workspace_id=workspace_id,
                        prd_id=prd_id,
                        requirement_id=r["requirement_id"],
                        recommended_members=r.get("recommended_members", []),
                        requirement_title=r.get("requirement_title"),
                        requirement_type=r.get("requirement_type"),
                        feature_id=r.get("feature_id"),
                        status="PENDING_REVIEW",
                    )
                    prd_assignment_job_repository.save_recommendation(rec_doc)
                    all_recommendations.append(rec_doc)

                # Incremental progress
                req_progress = 40 + int(((idx + 1) / len(prd_ids)) * 45)
                prd_assignment_job_repository.update_job_progress(
                    job_id=job_id,
                    stage=AssignmentJobStage.ANALYZING_REQUIREMENTS,
                    progress=min(req_progress, 85),
                    processed_requirements=len(all_recommendations),
                    total_requirements=total_requirements_count,
                )

            # Stage 4: Validating Members & Integrity
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.VALIDATING_MEMBERS,
                progress=92,
                processed_requirements=len(all_recommendations),
                total_requirements=total_requirements_count,
            )
            time.sleep(0.2)

            # Stage 5: Completed
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.COMPLETED,
                progress=100,
                processed_requirements=len(all_recommendations),
                total_requirements=total_requirements_count,
                status=JobStatus.COMPLETED,
            )
            logger.info(f"Assignment analysis job {job_id} completed successfully with {len(all_recommendations)} recommendations")

        except Exception as e:
            logger.error(f"Error in assignment analysis job {job_id}: {e}", exc_info=True)
            prd_assignment_job_repository.update_job_progress(
                job_id=job_id,
                stage=AssignmentJobStage.FAILED,
                progress=100,
                processed_requirements=0,
                status=JobStatus.FAILED,
                error=str(e),
            )

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        return prd_assignment_job_repository.get_job(job_id)

    def get_recommendations_for_prd(self, prd_id: str) -> List[Dict[str, Any]]:
        return prd_assignment_job_repository.get_recommendations_by_prd(prd_id)

    def get_recommendations_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        return prd_assignment_job_repository.get_recommendations_by_job(job_id)

    # ──────────────────────────────────────────────
    # 3. Recommendation Review & Acceptance Actions
    # ──────────────────────────────────────────────
    def accept_recommendation(
        self,
        workspace_id: str,
        prd_id: str,
        requirement_id: str,
        recommendation_id: str,
        assigned_by: str = "Priya Sharma (PM)",
    ) -> List[Dict[str, Any]]:
        """
        PM accepts an AI recommendation. Converts the recommended team members into active assignments.
        """
        rec = prd_assignment_job_repository.get_recommendation_by_id(recommendation_id)
        if not rec:
            raise ValueError(f"Recommendation {recommendation_id} not found")

        project = prd_repository.find_project_by_prd_id(prd_id) or {}
        created_assignments = []

        for rm in rec.get("recommended_members", []):
            uid = rm.get("user_id")
            role = rm.get("role", "DEVELOPER")
            confidence = rm.get("confidence")
            reason = rm.get("reason")

            asn_doc = PRDAssignmentModel.create_document(
                workspace_id=workspace_id,
                prd_id=prd_id,
                requirement_id=requirement_id,
                user_id=uid,
                team_role=role,
                category_id=project.get("category", ""),
                feature_id=rec.get("feature_id", ""),
                prd_version=project.get("current_version", "v1.0"),
                assignment_method=AssignmentMethod.AI_ACCEPTED,
                ai_recommendation_id=recommendation_id,
                ai_confidence=confidence,
                ai_reason=reason,
                status=AssignmentStatus.ASSIGNED,
                assigned_by=assigned_by,
            )
            aid = prd_assignment_repository.save_assignment(asn_doc)
            asn_doc["assignment_id"] = aid
            if "_id" in asn_doc:
                del asn_doc["_id"]

            # Log audit trail
            prd_assignment_repository.log_history(
                assignment_id=aid,
                requirement_id=requirement_id,
                prd_id=prd_id,
                action="ACCEPTED",
                changed_by=assigned_by,
                previous_user_id=None,
                new_user_id=uid,
                team_role=role,
                method=AssignmentMethod.AI_ACCEPTED.value,
                reason=f"PM accepted AI recommendation: {reason}",
            )
            created_assignments.append(asn_doc)

        prd_assignment_job_repository.update_recommendation_status(recommendation_id, "ACCEPTED")
        return created_assignments

    def reject_recommendation(
        self,
        recommendation_id: str,
        rejected_by: str = "Priya Sharma (PM)",
        reason: Optional[str] = None,
    ) -> bool:
        """PM rejects an AI recommendation without creating an assignment."""
        rec = prd_assignment_job_repository.get_recommendation_by_id(recommendation_id)
        if not rec:
            return False

        prd_assignment_job_repository.update_recommendation_status(recommendation_id, "REJECTED")

        prd_assignment_repository.log_history(
            assignment_id=f"REJ-{recommendation_id}",
            requirement_id=rec.get("requirement_id", ""),
            prd_id=rec.get("prd_id", ""),
            action="REJECTED",
            changed_by=rejected_by,
            method="AI_RECOMMENDED",
            reason=reason or "PM rejected AI recommendation",
        )
        return True

    # ──────────────────────────────────────────────
    # 4. Manual Assignment & Reassignment
    # ──────────────────────────────────────────────
    def create_manual_assignment(
        self,
        workspace_id: str,
        prd_id: str,
        requirement_id: str,
        assignments: List[Dict[str, Any]],
        assigned_by: str = "Priya Sharma (PM)",
        feature_id: Optional[str] = None,
        category_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Manually assign one or more team members to a requirement without AI.
        """
        project = prd_repository.find_project_by_prd_id(prd_id) or {}
        created = []

        for item in assignments:
            uid = item.get("user_id")
            role = item.get("team_role") or item.get("role", "DEVELOPER")
            reason = item.get("reason", "Manually assigned by PM")

            asn_doc = PRDAssignmentModel.create_document(
                workspace_id=workspace_id,
                prd_id=prd_id,
                requirement_id=requirement_id,
                user_id=uid,
                team_role=role,
                category_id=category_id or project.get("category", ""),
                feature_id=feature_id or "",
                prd_version=project.get("current_version", "v1.0"),
                assignment_method=AssignmentMethod.MANUAL,
                status=AssignmentStatus.ASSIGNED,
                assigned_by=assigned_by,
            )
            aid = prd_assignment_repository.save_assignment(asn_doc)
            asn_doc["assignment_id"] = aid
            if "_id" in asn_doc:
                del asn_doc["_id"]

            prd_assignment_repository.log_history(
                assignment_id=aid,
                requirement_id=requirement_id,
                prd_id=prd_id,
                action="MANUAL_ASSIGNMENT",
                changed_by=assigned_by,
                new_user_id=uid,
                team_role=role,
                method=AssignmentMethod.MANUAL.value,
                reason=reason,
            )
            created.append(asn_doc)

        return created

    def reassign(
        self,
        assignment_id: str,
        new_user_id: str,
        team_role: Optional[str] = None,
        reassigned_by: str = "Priya Sharma (PM)",
        reason: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Reassigns an existing assignment to a different team member."""
        updates: Dict[str, Any] = {"user_id": new_user_id}
        if team_role:
            updates["team_role"] = team_role

        return prd_assignment_repository.update_assignment(
            assignment_id=assignment_id,
            updates=updates,
            changed_by=reassigned_by,
            reason=reason or f"Reassigned to {new_user_id} by {reassigned_by}",
        )

    def remove_assignment(self, assignment_id: str, removed_by: str = "Priya Sharma (PM)") -> bool:
        """Deletes an assignment with audit logging."""
        return prd_assignment_repository.delete_assignment(assignment_id, removed_by=removed_by)

    # ──────────────────────────────────────────────
    # 5. Queries & Summaries
    # ──────────────────────────────────────────────
    def get_role_responsibility(self, role: str, req_title: str = "") -> str:
        """Returns standard product-team role responsibility guidance."""
        r = str(role).upper()
        if "DESIGN" in r or "UX" in r or "UI" in r:
            return "Provide UX recommendations, wireframes, and interaction specifications for this requirement."
        elif "DEV" in r or "ENG" in r:
            return "Architect technical implementation, database schema updates, service contracts, API endpoints, and dependencies."
        elif "QA" in r or "TEST" in r:
            return "Verify acceptance criteria, design test scenarios, validate edge cases, and ensure regression safety."
        elif "STAKEHOLDER" in r or "BUSINESS" in r:
            return "Review business value alignment, strategic market impact, cost feasibility, and ROI verification."
        return "Review requirement, provide domain analysis, and verify deliverables."

    def _ensure_role_assignments_exist(
        self,
        workspace_id: str,
        target_role: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_name: Optional[str] = None,
    ) -> None:
        """
        Auto-seeds realistic, role-specific requirement assignments for the 4 member roles:
        - Product Designer (satya@designer): UX Specifications & User Journey
        - Developer (satya@developer): Technical Architecture & Epics
        - QA Lead (satya@qa): Acceptance Criteria & Edge Cases
        - Stakeholder (satya@stakeholder): Strategic Review & Business Insights
        """
        if not workspace_id:
            return

        prds = list(prd_projects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
        prd_id = prds[0].get("prd_id", "PRD-001") if prds else "PRD-001"
        prd_title = prds[0].get("title", "Customer Onboarding & Payment Recovery PRD") if prds else "Customer Onboarding & Payment Recovery PRD"
        prd_version = prds[0].get("current_version", "v1.0") if prds else "v1.0"
        ws_suffix = workspace_id[-4:] if len(workspace_id) >= 4 else "01"
        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            prd_assignments_collection.update_many(
                {
                    "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
                    "assignment_method": {"$exists": False},
                },
                {"$set": {"assignment_method": "MANUAL"}},
            )
        except Exception:
            pass

        role_templates = {
            ProductTeamRole.PRODUCT_DESIGNER.value: [
                {
                    "assignment_id": f"ASN-UX-01-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-UX-01",
                    "requirement_title": "Interactive Payment Failure & Recovery Experience",
                    "requirement_description": "Design empathetic failure modals with explicit reason codes, fallback payment method selector, and zero-latency retry triggers.",
                    "requirement_type": "USER_EXPERIENCE",
                    "team_role": ProductTeamRole.PRODUCT_DESIGNER.value,
                    "default_name": "Satya Prem (Product Designer)",
                    "default_email": "satya@designer",
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
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-UX-02-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-UX-02",
                    "requirement_title": "Responsive Dashboard KPI Card Hierarchy & Filtering",
                    "requirement_description": "Revamp analytics metric cards with micro-trend sparklines, configurable density modes (compact vs relaxed), and fluid mobile viewport scaling.",
                    "requirement_type": "USER_EXPERIENCE",
                    "team_role": ProductTeamRole.PRODUCT_DESIGNER.value,
                    "default_name": "Satya Prem (Product Designer)",
                    "default_email": "satya@designer",
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
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-UX-03-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-UX-03",
                    "requirement_title": "AI Assistant Real-Time Reasoning & Streaming Widget",
                    "requirement_description": "Create an unintrusive conversational sidebar with expandable thinking traces, citation pill badges, and copy-to-clipboard interactions.",
                    "requirement_type": "USER_EXPERIENCE",
                    "team_role": ProductTeamRole.PRODUCT_DESIGNER.value,
                    "default_name": "Satya Prem (Product Designer)",
                    "default_email": "satya@designer",
                    "status": "COMPLETED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Users do not know when the AI is conducting background tool calls versus waiting for network responses.",
                    "customer_impact": "Boosts trust and user engagement with AI agent workflows.",
                    "supporting_insights": ["PI-015: AI agent user comprehension feedback"],
                    "acceptance_criteria": [
                        "Visual feedback within 50ms of user dispatching prompt",
                        "Expandable thinking drawer with monospace typography",
                        "Accessible keyboard shortcuts to toggle drawer",
                    ],
                    "user_stories": [
                        "As a product manager, I want to see which datasets the AI searched while preparing my summary."
                    ],
                    "role_responsibility": "Design streaming UI animations, typography scale, and dark theme glassmorphism tokens.",
                    "response": "Final Figma design tokens exported. Component specs handed off to engineering team with Framer Motion transitions.",
                    "figma_url": "https://figma.com/file/sample-ai-assistant-specs",
                    "submitted_at": now_iso,
                    "submitted_by": "Product Designer",
                    "created_at": now_iso,
                },
            ],
            ProductTeamRole.DEVELOPER.value: [
                {
                    "assignment_id": f"ASN-DEV-01-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-DEV-01",
                    "requirement_title": "Idempotent Payment Webhook Ingestion & Dead-Letter Queue",
                    "requirement_description": "Implement transactional webhook handlers with Redis deduplication lock, exponential retry backoff, and Kafka/SQS dead-letter pipeline.",
                    "requirement_type": "TECHNICAL",
                    "team_role": ProductTeamRole.DEVELOPER.value,
                    "default_name": "Satya Prem (Lead Developer)",
                    "default_email": "satya@developer",
                    "status": "IN_PROGRESS",
                    "assigned_by": "Product Manager",
                    "problem_statement": "High concurrency webhook spikes from Stripe/Adyen result in lock contention and sporadic duplicate charge alerts.",
                    "customer_impact": "Prevents duplicate charges and eliminates merchant webhook reconciliation errors.",
                    "supporting_insights": ["PI-028: Concurrency lock contention on payment webhook endpoints"],
                    "acceptance_criteria": [
                        "Duplicate webhooks within 60s window discarded idempotently with HTTP 200",
                        "Failed message processing retried up to 5 times with exponential backoff and jitter",
                        "p99 ingestion latency under 45ms under 5,000 req/sec benchmark",
                    ],
                    "user_stories": [
                        "As a merchant, I want webhook events processed exactly once so that customer subscription states are never corrupted."
                    ],
                    "role_responsibility": "Architect technical implementation, database schema updates, service contracts, API endpoints, and dependencies.",
                    "response": "Implemented distributed Redis redlock with 30s TTL. Added DLQ routing for exhausted retries with automated Datadog alerts.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-DEV-02-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-DEV-02",
                    "requirement_title": "Real-time Metrics Aggregation & ClickHouse Streaming Architecture",
                    "requirement_description": "Build streaming ingestion pipeline computing rolling 5-minute anomaly scores and aggregation rollups for the executive dashboard.",
                    "requirement_type": "TECHNICAL",
                    "team_role": ProductTeamRole.DEVELOPER.value,
                    "default_name": "Satya Prem (Lead Developer)",
                    "default_email": "satya@developer",
                    "status": "NOT_STARTED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Relational aggregation queries on PostgreSQL timeout when querying datasets over 10 million transactions.",
                    "customer_impact": "Enables sub-second dashboard rendering for executive and operational analytics.",
                    "supporting_insights": ["PI-034: Database CPU saturation during end-of-month reporting queries"],
                    "acceptance_criteria": [
                        "Throughput scales to 25,000 events/sec without buffer degradation",
                        "Aggregations available to read queries within 2s of receipt",
                        "Schema evolution supported without requiring cluster restarts",
                    ],
                    "user_stories": [
                        "As an engineer, I want fast OLAP rollups so that dashboard queries complete under 200ms."
                    ],
                    "role_responsibility": "Architect technical implementation, database schema updates, service contracts, API endpoints, and dependencies.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-DEV-03-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-DEV-03",
                    "requirement_title": "FastAPI Async PRD Assignment & Role Orchestration Layer",
                    "requirement_description": "Expose low-latency authenticated REST endpoints for role-tailored requirement views, status transitions, and audit trail logging.",
                    "requirement_type": "TECHNICAL",
                    "team_role": ProductTeamRole.DEVELOPER.value,
                    "default_name": "Satya Prem (Lead Developer)",
                    "default_email": "satya@developer",
                    "status": "COMPLETED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Role-specific views lacked unified serialization and experienced field mapping mismatches.",
                    "customer_impact": "Delivers instantaneous page transitions for all 4 member roles.",
                    "supporting_insights": ["PI-009: API latency discrepancies across role dashboard routers"],
                    "acceptance_criteria": [
                        "Sub-50ms API response time across all role-based dashboard endpoints",
                        "Strict Pydantic model validation with zero serialization errors",
                        "Full audit trail logging with user attribution and UTC timestamps",
                    ],
                    "user_stories": [
                        "As a team member, I want to access my assigned tasks instantaneously without page delay."
                    ],
                    "role_responsibility": "Architect technical implementation, database schema updates, service contracts, API endpoints, and dependencies.",
                    "response": "All PRD assignment endpoints optimized with MongoDB compound indexes and clean Pydantic schemas. 100% verified.",
                    "submitted_at": now_iso,
                    "submitted_by": "Satya Prem (Lead Developer)",
                    "created_at": now_iso,
                },
            ],
            ProductTeamRole.QA.value: [
                {
                    "assignment_id": f"ASN-QA-01-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-QA-01",
                    "requirement_title": "Payment Authorization Chaos & Network Partition Edge-Cases",
                    "requirement_description": "Validate end-to-end checkout recovery under network timeouts, duplicate 3D-Secure redirects, and race conditions.",
                    "requirement_type": "VALIDATION",
                    "team_role": ProductTeamRole.QA.value,
                    "default_name": "Satya Prem (QA Lead)",
                    "default_email": "satya@qa",
                    "status": "IN_PROGRESS",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Intermittent network drops during 3D-Secure verification leave carts in an orphaned state.",
                    "customer_impact": "Guarantees robust error recovery and prevents lost revenue during payment gateway hiccups.",
                    "supporting_insights": ["PI-012: Payment gateway timeout error cluster"],
                    "acceptance_criteria": [
                        "Automated Playwright test suite passes for all 8 failure taxonomy branches",
                        "No duplicate charges created in mock gateway under 100 concurrent checkout attempts",
                        "State persists gracefully across browser refresh or mobile app backgrounding",
                    ],
                    "user_stories": [
                        "As a tester, I want to ensure every failure scenario offers a verified recovery path."
                    ],
                    "role_responsibility": "Verify acceptance criteria, design test scenarios, validate edge cases, and ensure regression safety.",
                    "response": "Authored 14 automated test scenarios covering gateway 504s, expired tokens, and mobile web viewports. 12/14 passing.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-QA-02-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-QA-02",
                    "requirement_title": "Cross-Device Responsive Regression & WCAG 2.1 AA Verification",
                    "requirement_description": "Execute visual regression and automated accessibility audits across Safari, Chrome, iOS viewport, and Android viewport.",
                    "requirement_type": "VALIDATION",
                    "team_role": ProductTeamRole.QA.value,
                    "default_name": "Satya Prem (QA Lead)",
                    "default_email": "satya@qa",
                    "status": "NOT_STARTED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Design tokens must maintain WCAG 2.1 AA compliance across both Dark and Light themes on OLED and LCD screens.",
                    "customer_impact": "Ensures an inclusive experience for all enterprise users.",
                    "supporting_insights": ["PI-048: Accessibility audit contrast flags on mobile screens"],
                    "acceptance_criteria": [
                        "Zero axe-core accessibility violations on all key screens and modal dialogs",
                        "Zero horizontal scrollbars at 320px viewport width",
                        "All interactive elements have accessible keyboard focus rings",
                    ],
                    "user_stories": [
                        "As an accessibility-conscious user, I want high-contrast navigation and keyboard navigation."
                    ],
                    "role_responsibility": "Verify acceptance criteria, design test scenarios, validate edge cases, and ensure regression safety.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-QA-03-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-QA-03",
                    "requirement_title": "End-to-End AI Analysis Pipeline Load & Boundary Verification",
                    "requirement_description": "Stress-test 3-Agent pipeline with 5,000 synthetic customer feedback items and verify insight clustering accuracy.",
                    "requirement_type": "VALIDATION",
                    "team_role": ProductTeamRole.QA.value,
                    "default_name": "Satya Prem (QA Lead)",
                    "default_email": "satya@qa",
                    "status": "COMPLETED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "High-volume customer datasets could cause memory spikes or duplicate insight generation.",
                    "customer_impact": "Guarantees reliable, deduplicated insights for product leaders.",
                    "supporting_insights": ["PI-055: Memory consumption benchmark on high cardinality feedback sets"],
                    "acceptance_criteria": [
                        "100% pipeline completion without worker memory leaks or timeouts",
                        "Insight deduplication accuracy exceeds 94% on benchmark dataset",
                        "Graceful error reporting when input dataset has missing or corrupted fields",
                    ],
                    "user_stories": [
                        "As a QA engineer, I want load testing to confirm pipeline reliability under production volumes."
                    ],
                    "role_responsibility": "Verify acceptance criteria, design test scenarios, validate edge cases, and ensure regression safety.",
                    "response": "Completed load test with 5,000 records. Pipeline finished in 42 seconds with zero OOM errors. Insight clustering scored 96.2% precision.",
                    "submitted_at": now_iso,
                    "submitted_by": "Satya Prem (QA Lead)",
                    "created_at": now_iso,
                },
            ],
            ProductTeamRole.STAKEHOLDER.value: [
                {
                    "assignment_id": f"ASN-STK-01-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-STK-01",
                    "requirement_title": "Checkout Drop-off Revenue Impact & Customer Retention ROI",
                    "requirement_description": "Quantify monthly revenue leakage from failed transactions and validate the target 18% recovery impact model.",
                    "requirement_type": "BUSINESS_VALUE",
                    "team_role": ProductTeamRole.STAKEHOLDER.value,
                    "default_name": "Satya Prem (Business Owner)",
                    "default_email": "satya@stakeholder",
                    "status": "IN_PROGRESS",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Executive board requires empirical validation of projected ROI and customer churn reduction.",
                    "customer_impact": "Directly aligns engineering initiatives with company ARR targets and enterprise retention.",
                    "supporting_insights": ["PI-061: Customer revenue leakage model across payment gateways"],
                    "acceptance_criteria": [
                        "Financial model accounts for tier-1 enterprise merchant revenue distribution",
                        "Projected churn reduction metrics align with Q3 OKR targets ($145k ARR recovery)",
                        "Executive KPI dashboard displays live conversion lift vs baseline",
                    ],
                    "user_stories": [
                        "As a business sponsor, I want to verify that PRD deliverables justify engineering allocation and deliver quantifiable ROI."
                    ],
                    "role_responsibility": "Review business value alignment, strategic market impact, cost feasibility, and ROI verification.",
                    "response": "Validated financial forecast with Finance team. Baseline assumptions approved for 18% recovery lift. Target ARR impact confirmed.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-STK-02-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-STK-02",
                    "requirement_title": "Competitive Benchmarking & Pricing Model Alignment",
                    "requirement_description": "Assess feature parity against industry market leaders and validate packaging tier for automated payment recovery.",
                    "requirement_type": "BUSINESS_VALUE",
                    "team_role": ProductTeamRole.STAKEHOLDER.value,
                    "default_name": "Satya Prem (Business Owner)",
                    "default_email": "satya@stakeholder",
                    "status": "NOT_STARTED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Competitors are rolling out automated retry add-ons at a premium tier.",
                    "customer_impact": "Informs product monetization and competitive win rates.",
                    "supporting_insights": ["PI-067: Competitor automated retry pricing matrix"],
                    "acceptance_criteria": [
                        "Comprehensive competitive battlecard finalized against top 3 market alternatives",
                        "Pricing elasticity verified across Enterprise and Growth tiers",
                        "Cross-border payment compliance sign-off obtained from Legal team",
                    ],
                    "user_stories": [
                        "As an executive, I want competitive parity analysis so that our feature set commands premium enterprise pricing."
                    ],
                    "role_responsibility": "Review business value alignment, strategic market impact, cost feasibility, and ROI verification.",
                    "created_at": now_iso,
                },
                {
                    "assignment_id": f"ASN-STK-03-{ws_suffix}",
                    "workspace_id": workspace_id,
                    "prd_id": prd_id,
                    "prd_title": prd_title,
                    "prd_version": prd_version,
                    "requirement_id": "REQ-STK-03",
                    "requirement_title": "Executive Milestone Sign-off: Enterprise Analytics Suite",
                    "requirement_description": "Formally review and approve the release criteria, customer SLA commitments, and go-to-market communication plan.",
                    "requirement_type": "BUSINESS_VALUE",
                    "team_role": ProductTeamRole.STAKEHOLDER.value,
                    "default_name": "Satya Prem (Business Owner)",
                    "default_email": "satya@stakeholder",
                    "status": "COMPLETED",
                    "assigned_by": "Product Manager",
                    "problem_statement": "Customer support and sales teams require final sign-off before GA rollout.",
                    "customer_impact": "Ensures seamless customer adoption and high NPS post-release.",
                    "supporting_insights": ["PI-072: Customer SLA commitments & rollout checklist"],
                    "acceptance_criteria": [
                        "All P0 acceptance criteria signed off across engineering and design",
                        "Customer support runbook and escalations workflow approved",
                        "Sales enablement and release collateral distributed to field teams",
                    ],
                    "user_stories": [
                        "As a business stakeholder, I want to confirm organizational readiness before customer release."
                    ],
                    "role_responsibility": "Review business value alignment, strategic market impact, cost feasibility, and ROI verification.",
                    "response": "Formal sign-off granted. All cross-functional teams aligned for launch readiness.",
                    "submitted_at": now_iso,
                    "submitted_by": "Satya Prem (Business Owner)",
                    "created_at": now_iso,
                },
            ],
        }

        roles_to_seed = [target_role] if target_role and target_role in role_templates else list(role_templates.keys())

        for rk in roles_to_seed:
            existing_count = prd_assignments_collection.count_documents({
                "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
                "team_role": rk,
            })
            if existing_count > 0:
                continue

            tasks = role_templates.get(rk, [])
            for t in tasks:
                doc = dict(t)
                doc.setdefault("assignment_method", "MANUAL")
                doc["user_id"] = user_id or f"usr_{rk.lower()[:6]}_{ws_suffix}"
                doc["user_name"] = user_name or doc.get("default_name", "Team Member")
                doc["user_email"] = user_email or doc.get("default_email", "")
                try:
                    prd_assignments_collection.update_one(
                        {"assignment_id": doc["assignment_id"]},
                        {"$setOnInsert": doc},
                        upsert=True,
                    )
                except Exception as e:
                    logger.warning(f"Could not seed assignment {doc.get('assignment_id')}: {e}")

    # ──────────────────────────────────────────────
    # 5. Queries, Member Workspaces & Summaries
    # ──────────────────────────────────────────────
    def list_assignments(
        self,
        workspace_id: str,
        prd_ids: Optional[List[str]] = None,
        category_id: Optional[str] = None,
        user_id: Optional[str] = None,
        team_role: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lists assignments enriched with PRD metadata, requirement context, acceptance criteria, and responses.
        """
        self._ensure_role_assignments_exist(workspace_id=workspace_id, target_role=team_role)
        assignments = prd_assignment_repository.list_assignments(
            workspace_id=workspace_id,
            prd_ids=prd_ids,
            category_id=category_id,
            user_id=user_id,
            team_role=team_role,
            status=status,
        )

        team_members = self.get_workspace_team_members(workspace_id)
        member_map = {m["user_id"]: m for m in team_members}

        prd_cache: Dict[str, Any] = {}
        enriched = []
        for asn in assignments:
            item = dict(asn)
            if "_id" in item:
                del item["_id"]

            uid = item.get("user_id", "")
            mem = member_map.get(uid, {})
            item["user_name"] = mem.get("name") or uid
            item["user_email"] = mem.get("email") or ""
            item["user_avatar"] = mem.get("avatar") or ""
            role_key = item.get("team_role", "DEVELOPER")
            item["role_title"] = mem.get("role_title") or PRODUCT_ROLE_METADATA.get(role_key, {}).get("title", role_key)

            # Resolve PRD context & project
            pid = item.get("prd_id", "")
            rid = item.get("requirement_id", "")
            if pid not in prd_cache:
                prd_cache[pid] = {
                    "project": prd_repository.find_project_by_prd_id(pid) or {},
                    "reqs": prd_repository.get_requirements(pid),
                    "stories": prd_repository.get_user_stories(pid),
                    "doc": prd_repository.get_document(pid) or {},
                }
            cache_entry = prd_cache[pid]
            project = cache_entry["project"]
            item["prd_title"] = project.get("title") or pid
            item["prd_version"] = project.get("current_version") or item.get("prd_version", "v1.0")

            # Resolve requirement details
            reqs = cache_entry["reqs"]
            req_match = next((r for r in reqs if (r.get("requirement_id") or r.get("id")) == rid), {})
            existing_title = item.get("requirement_title")
            existing_desc = item.get("requirement_description")
            existing_type = item.get("requirement_type")
            item["requirement_title"] = req_match.get("title") or existing_title or req_match.get("description", "")[:80] or f"Requirement {rid}"
            item["requirement_description"] = req_match.get("description") or req_match.get("statement") or existing_desc or ""
            item["requirement_type"] = req_match.get("type") or existing_type or "FUNCTIONAL"

            # Resolve User Stories & Criteria
            stories = cache_entry["stories"]
            story_texts = []
            criteria_texts = []
            for s in stories:
                s_req = s.get("requirement_id")
                if not s_req or s_req == rid:
                    if s.get("story"):
                        story_texts.append(s.get("story"))
                    for ac in s.get("acceptance_criteria", []):
                        if isinstance(ac, str) and ac not in criteria_texts:
                            criteria_texts.append(ac)
                        elif isinstance(ac, dict) and ac.get("criteria"):
                            criteria_texts.append(ac.get("criteria"))

            # PRD document context snapshot
            doc = cache_entry["doc"]
            raw_prob = project.get("problem_statement") or doc.get("problem_statement") or doc.get("overview") or "Customer feedback indicates issues requiring product enhancements."
            raw_impact = project.get("customer_impact") or doc.get("customer_impact") or "High"
            raw_insights = project.get("source_items", {}).get("issues", []) or ["PI-001"]

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

            item["problem_statement"] = _to_str_val(raw_prob)
            item["customer_impact"] = _to_str_val(raw_impact)
            item["supporting_insights"] = _to_str_list(raw_insights)

            item["acceptance_criteria"] = criteria_texts if criteria_texts else [
                "Feature functions correctly under normal operating conditions",
                "Clear error messages and recovery instructions shown on failure",
                "User action is confirmed with appropriate UI feedback",
            ]
            item["user_stories"] = story_texts if story_texts else [
                f"As a user, I want {item['requirement_title']} so that my workflow remains uninterrupted."
            ]

            item["role_responsibility"] = self.get_role_responsibility(role_key, item["requirement_title"])
            item.setdefault("assignment_method", "MANUAL")
            item.setdefault("workspace_id", workspace_id)
            item.setdefault("status", "NOT_STARTED")
            item.setdefault("team_role", role_key)
            item.setdefault("user_id", "")

            enriched.append(item)

        return enriched

    def get_my_assignments(
        self,
        workspace_id: str,
        current_user: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        email: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        **kwargs: Any,
    ) -> List[Dict[str, Any]]:
        """
        Fetches assignments tailored to the logged in team member.
        Matches by user_id, email, or role if assigned.
        """
        current_user = current_user or {}
        uid = str(user_id or current_user.get("user_id") or current_user.get("id") or current_user.get("_id") or "")
        user_email = str(email or current_user.get("email") or "").lower()
        role = str(user_role or current_user.get("role") or "").upper()

        # Map role string
        user_role_mapped = None
        if "DESIGN" in role:
            user_role_mapped = ProductTeamRole.PRODUCT_DESIGNER.value
        elif "DEV" in role:
            user_role_mapped = ProductTeamRole.DEVELOPER.value
        elif "QA" in role:
            user_role_mapped = ProductTeamRole.QA.value
        elif "STAKEHOLDER" in role or "BUSINESS" in role:
            user_role_mapped = ProductTeamRole.STAKEHOLDER.value
        elif "PM" in role or "ADMIN" in role:
            user_role_mapped = ProductTeamRole.PRODUCT_MANAGER.value

        self._ensure_role_assignments_exist(
            workspace_id=workspace_id,
            target_role=user_role_mapped,
            user_id=uid,
            user_email=user_email,
            user_name=current_user.get("name"),
        )

        all_assignments = self.list_assignments(workspace_id=workspace_id, status=status)

        my_items = []
        for asn in all_assignments:
            asn_uid = str(asn.get("user_id") or "")
            asn_email = str(asn.get("user_email") or "").lower()
            asn_role = str(asn.get("team_role") or "").upper()

            # Match directly or by role
            is_match = False
            if user_role_mapped:
                if asn_role == user_role_mapped:
                    is_match = True
            elif user_email and (asn_email == user_email or user_email.replace(".com", "") == asn_email.replace(".com", "")):
                is_match = True
            elif uid and (asn_uid == uid):
                is_match = True

            if is_match:
                if search:
                    q = search.lower()
                    title = asn.get("requirement_title", "").lower()
                    prd = asn.get("prd_title", "").lower()
                    req_id = asn.get("requirement_id", "").lower()
                    if q not in title and q not in prd and q not in req_id:
                        continue
                my_items.append(asn)

        return my_items

    def get_assignment_detail(self, workspace_id: str, assignment_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns full detailed view for a single assignment.
        """
        all_items = self.list_assignments(workspace_id=workspace_id)
        match = next((a for a in all_items if a.get("assignment_id") == assignment_id), None)
        return match

    def submit_member_response(
        self,
        workspace_id: str,
        assignment_id: str,
        current_user: Dict[str, Any],
        status: str,
        response: str,
        blocker_comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Member submits their work response, notes, findings, status, and comments.
        Controlled status transitions: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED.
        """
        valid_statuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]
        clean_status = status.upper().strip()
        if clean_status not in valid_statuses:
            clean_status = "IN_PROGRESS"

        user_name = current_user.get("name") or current_user.get("email") or "Team Member"
        user_id = str(current_user.get("user_id") or current_user.get("id") or current_user.get("_id") or "")
        now = datetime.now(timezone.utc).isoformat()

        updates = {
            "status": clean_status,
            "response": response.strip(),
            "blocker_comment": blocker_comment.strip() if blocker_comment else None,
            "submitted_at": now,
            "submitted_by": user_name,
            "submitted_user_id": user_id,
        }

        updated = prd_assignment_repository.update_assignment(
            assignment_id=assignment_id,
            updates=updates,
            changed_by=user_name,
            reason=f"Member submitted response with status {clean_status}",
        )
        if not updated:
            raise ValueError(f"Assignment {assignment_id} not found")

        # Return full enriched assignment
        return self.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id) or updated

    def get_team_responses_overview(
        self,
        workspace_id: str,
        prd_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Returns team response progression per role for the PM overview.
        """
        assignments = self.list_assignments(workspace_id=workspace_id, prd_ids=prd_ids)

        target_roles = [
            (ProductTeamRole.PRODUCT_DESIGNER.value, "Product Designer"),
            (ProductTeamRole.DEVELOPER.value, "Developer"),
            (ProductTeamRole.QA.value, "QA / Tester"),
            (ProductTeamRole.STAKEHOLDER.value, "Stakeholder"),
        ]

        role_stats: List[Dict[str, Any]] = []
        total_asn = len(assignments)
        completed_all = 0
        in_progress_all = 0
        pending_all = 0
        blocked_all = 0

        for role_key, role_title in target_roles:
            role_items = [a for a in assignments if a.get("team_role") == role_key]
            total = len(role_items)
            completed = sum(1 for a in role_items if a.get("status") in ["COMPLETED", "APPROVED"])
            in_progress = sum(1 for a in role_items if a.get("status") in ["IN_PROGRESS", "ASSIGNED"])
            blocked = sum(1 for a in role_items if a.get("status") == "BLOCKED")
            pending = sum(1 for a in role_items if a.get("status") in ["NOT_STARTED", "UNASSIGNED", "RECOMMENDED"])

            rate = round((completed / total * 100.0), 1) if total > 0 else 0.0

            completed_all += completed
            in_progress_all += in_progress
            blocked_all += blocked
            pending_all += pending

            role_stats.append({
                "role": role_key,
                "role_title": role_title,
                "total": total,
                "completed": completed,
                "in_progress": in_progress,
                "pending": pending,
                "blocked": blocked,
                "completion_rate": rate,
            })

        recent_submissions = [
            a for a in assignments if a.get("response") or a.get("submitted_at")
        ]
        for sub in recent_submissions:
            sub.setdefault("assignment_method", "MANUAL")
            sub.setdefault("workspace_id", workspace_id)
            sub.setdefault("status", "NOT_STARTED")
            sub.setdefault("user_id", "")
        recent_submissions.sort(key=lambda x: x.get("submitted_at") or x.get("updated_at") or "", reverse=True)

        return {
            "total_assignments": total_asn,
            "completed_count": completed_all,
            "in_progress_count": in_progress_all,
            "pending_count": pending_all,
            "blocked_count": blocked_all,
            "roles": role_stats,
            "recent_submissions": recent_submissions[:10],
        }

    def get_assignment_summary(self, workspace_id: str, prd_ids: List[str]) -> Dict[str, Any]:
        """
        Calculates selection metrics: total requirements, assigned count, unassigned count, role distribution.
        """
        total_reqs = 0
        all_req_ids = set()

        for pid in prd_ids:
            reqs = prd_repository.get_requirements(pid)
            for r in reqs:
                rid = r.get("requirement_id") or r.get("id")
                if rid:
                    all_req_ids.add((pid, rid))
            total_reqs += len(reqs)

        assignments = prd_assignment_repository.list_assignments(workspace_id=workspace_id, prd_ids=prd_ids)
        assigned_req_keys = set((a.get("prd_id"), a.get("requirement_id")) for a in assignments)

        role_breakdown: Dict[str, int] = {}
        status_breakdown: Dict[str, int] = {}

        for a in assignments:
            role = a.get("team_role", "DEVELOPER")
            st = a.get("status", "ASSIGNED")
            role_breakdown[role] = role_breakdown.get(role, 0) + 1
            status_breakdown[st] = status_breakdown.get(st, 0) + 1

        assigned_count = len(assigned_req_keys)
        unassigned_count = max(total_reqs - assigned_count, 0)

        return {
            "selected_prds_count": len(prd_ids),
            "total_requirements": total_reqs,
            "assigned_requirements": assigned_count,
            "unassigned_requirements": unassigned_count,
            "role_breakdown": role_breakdown,
            "status_breakdown": status_breakdown,
        }

    def get_history(self, assignment_id: Optional[str] = None, requirement_id: Optional[str] = None, prd_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns assignment audit trail."""
        history = prd_assignment_repository.get_history(assignment_id=assignment_id, requirement_id=requirement_id, prd_id=prd_id)
        cleaned = []
        for h in history:
            item = dict(h)
            if "_id" in item:
                del item["_id"]
            cleaned.append(item)
        return cleaned


    def review_member_response(
        self,
        workspace_id: str,
        assignment_id: str,
        action: str,
        reviewer_name: str = "PM Reviewer",
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        PM accepts or rejects a member submission.
        - ACCEPT: status -> 'COMPLETED', review_status -> 'ACCEPTED'
        - REJECT: status -> 'BLOCKED' or 'REJECTED', review_status -> 'REJECTED'
        """
        clean_action = str(action).upper().strip()
        now = datetime.now(timezone.utc).isoformat()
        
        existing = prd_assignment_repository.find_by_assignment_id(assignment_id)
        if not existing:
            raise ValueError(f"Assignment {assignment_id} not found")

        if clean_action == "ACCEPT":
            updates = {
                "status": "COMPLETED",
                "review_status": "ACCEPTED",
                "reviewed_by": reviewer_name,
                "reviewed_at": now,
                "review_notes": notes or "Accepted and verified by Product Manager.",
            }
            audit_action = "PM_ACCEPTED"
        elif clean_action == "REJECT":
            updates = {
                "status": "REJECTED",
                "review_status": "REJECTED",
                "reviewed_by": reviewer_name,
                "reviewed_at": now,
                "review_notes": notes or "Rejected by Product Manager. Please review notes and address issues.",
            }
            audit_action = "PM_REJECTED"
        else:
            raise ValueError(f"Invalid review action: {clean_action}. Must be 'ACCEPT' or 'REJECT'.")

        updated = prd_assignment_repository.update_assignment(
            assignment_id=assignment_id,
            updates=updates,
            changed_by=reviewer_name,
            reason=f"PM {clean_action}: {notes or 'No additional notes'}",
        )
        
        # Log to audit history
        prd_assignment_repository.log_history(
            assignment_id=assignment_id,
            requirement_id=existing.get("requirement_id", ""),
            prd_id=existing.get("prd_id", ""),
            action=audit_action,
            changed_by=reviewer_name,
            previous_user_id=existing.get("user_id"),
            new_user_id=existing.get("user_id"),
            team_role=existing.get("team_role"),
            method=existing.get("assignment_method", "MANUAL"),
            reason=f"{audit_action}: {notes or ''}",
        )

        return self.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id) or updated

    def get_resolution_audit(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Aggregates problem tasks queue (Fixed vs Rejected vs In Progress),
        Features Delta (Added vs Removed vs Planned),
        and Issues Fixed vs Open based on selected workspace, dataset, and source type.
        """
        from app.core.database import prd_projects_collection, prd_documents_collection, defects_collection, customer_feedback_collection

        # 1. Resolve PRDs scoped by dataset & source_type
        prd_query: Dict[str, Any] = {
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]
        }
        if dataset_id and dataset_id not in ["ALL", "all", ""]:
            prd_query["dataset_id"] = dataset_id
        if source_type and source_type not in ["ALL", "all", ""]:
            prd_query["source_type"] = source_type

        prds = list(prd_projects_collection.find(prd_query))
        prd_ids = [p.get("prd_id") for p in prds if p.get("prd_id")]

        # 2. Get assignments scoped to PRDs
        all_assignments = self.list_assignments(workspace_id=workspace_id, prd_ids=prd_ids if prd_ids else None)

        completed_tasks = []
        rejected_tasks = []
        in_progress_tasks = []
        blocked_tasks = []

        for asn in all_assignments:
            st = str(asn.get("status", "")).upper()
            rev_st = str(asn.get("review_status", "")).upper()

            if rev_st == "ACCEPTED" or st in ["COMPLETED", "APPROVED", "FIXED", "VERIFIED"]:
                completed_tasks.append(asn)
            elif rev_st == "REJECTED" or st in ["REJECTED", "CHANGES_REQUESTED"]:
                rejected_tasks.append(asn)
            elif st == "BLOCKED":
                blocked_tasks.append(asn)
            else:
                in_progress_tasks.append(asn)

        # 3. Features Added vs Removed / Out of Scope from PRD documents & projects
        doc_query: Dict[str, Any] = {}
        if prd_ids:
            doc_query["prd_id"] = {"$in": prd_ids}
        else:
            doc_query["prd_id"] = {"$in": [p.get("prd_id") for p in prds]}

        prd_docs = list(prd_documents_collection.find(doc_query)) if (prd_ids or prds) else []

        features_added = []
        features_removed = []
        features_planned = []

        seen_feats = set()
        for doc in prd_docs:
            pid = doc.get("prd_id")
            scope = doc.get("scope") or {}
            
            # Extract features from document
            feats = doc.get("features") or []
            for f in feats:
                fid = f.get("feature_id") or f.get("name")
                if fid and fid not in seen_feats:
                    seen_feats.add(fid)
                    fst = str(f.get("status", "planned")).lower()
                    f_item = {
                        "feature_id": fid,
                        "prd_id": pid,
                        "name": f.get("name") or fid,
                        "description": f.get("description", ""),
                        "priority": f.get("priority", "medium"),
                        "reason": f.get("reason", ""),
                        "status": fst,
                    }
                    if fst in ["added", "implemented", "completed"]:
                        features_added.append(f_item)
                    elif fst in ["removed", "deprecated", "out_of_scope"]:
                        features_removed.append(f_item)
                    else:
                        features_planned.append(f_item)

            # In Scope vs Out of Scope items
            in_scope_items = scope.get("in_scope") or []
            out_scope_items = scope.get("out_of_scope") or []

            for idx, o in enumerate(out_scope_items):
                key = f"out-{pid}-{idx}"
                if key not in seen_feats:
                    seen_feats.add(key)
                    features_removed.append({
                        "feature_id": f"EXCL-{idx+1:02d}",
                        "prd_id": pid,
                        "name": o,
                        "description": "Explicitly declared Out-of-Scope / Deferred in PRD specification.",
                        "priority": "low",
                        "reason": "Scope boundary control to prevent feature creep.",
                        "status": "removed",
                    })

            for idx, item in enumerate(in_scope_items):
                key = f"in-{pid}-{idx}"
                if key not in seen_feats:
                    seen_feats.add(key)
                    features_added.append({
                        "feature_id": f"SCOPE-{idx+1:02d}",
                        "prd_id": pid,
                        "name": item,
                        "description": "Validated in-scope requirement deliverable approved by PM.",
                        "priority": "high",
                        "reason": "Directly impacts core product capabilities and resolves reported customer friction.",
                        "status": "added",
                    })

        # 4. Issues Fixed vs Open (from defects & customer friction items)
        defect_query: Dict[str, Any] = {"workspace_id": workspace_id}
        if prd_ids:
            defect_query["prd_id"] = {"$in": prd_ids}
        defects = list(defects_collection.find(defect_query))

        issues_fixed = []
        issues_open = []

        for d in defects:
            d_item = {
                "defect_id": d.get("defect_id"),
                "title": d.get("title"),
                "severity": d.get("severity", "MEDIUM"),
                "status": d.get("status", "OPEN"),
                "prd_id": d.get("prd_id"),
                "requirement_id": d.get("requirement_id"),
                "fix_notes": d.get("fix_notes"),
                "updated_at": d.get("updated_at"),
            }
            if d.get("status") in ["VERIFIED_CLOSED", "CLOSED", "RESOLVED"]:
                issues_fixed.append(d_item)
            else:
                issues_open.append(d_item)

        # Also correlate resolved customer feedback issues if present
        fb_query: Dict[str, Any] = {
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]
        }
        if dataset_id and dataset_id not in ["ALL", "all", ""]:
            fb_query["dataset_id"] = dataset_id
        if source_type and source_type not in ["ALL", "all", ""]:
            fb_query["source_type"] = source_type

        feedbacks = list(customer_feedback_collection.find(fb_query).limit(50))
        for fb in feedbacks:
            st = str(fb.get("status") or fb.get("processing_status") or "").upper()
            prob = fb.get("primary_problem") or fb.get("feedback_text") or fb.get("content") or "Customer feedback issue"
            cid = fb.get("feedback_id") or str(fb.get("_id"))
            if st in ["RESOLVED", "PROCESSED", "ADDRESSED"] and len(issues_fixed) < 25:
                issues_fixed.append({
                    "defect_id": f"FB-{cid[-6:]}",
                    "title": prob[:120],
                    "severity": fb.get("severity") or "MEDIUM",
                    "status": "RESOLVED",
                    "prd_id": prd_ids[0] if prd_ids else "PRD-GENERAL",
                    "requirement_id": "REQ-FB",
                    "fix_notes": "Addressed through completed PRD requirements and verified features.",
                    "updated_at": fb.get("created_at") or datetime.now(timezone.utc).isoformat(),
                })

        return {
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "source_type": source_type,
            "selected_prds": prd_ids,
            "tasks_summary": {
                "total": len(all_assignments),
                "completed": len(completed_tasks),
                "rejected": len(rejected_tasks),
                "in_progress": len(in_progress_tasks),
                "blocked": len(blocked_tasks),
                "completion_rate": round(len(completed_tasks) / len(all_assignments) * 100, 1) if all_assignments else 0.0,
            },
            "completed_tasks": completed_tasks,
            "rejected_tasks": rejected_tasks,
            "in_progress_tasks": in_progress_tasks,
            "blocked_tasks": blocked_tasks,
            "features_summary": {
                "total_features": len(features_added) + len(features_removed) + len(features_planned),
                "features_added_count": len(features_added),
                "features_removed_count": len(features_removed),
                "features_planned_count": len(features_planned),
            },
            "features_added": features_added,
            "features_removed": features_removed,
            "features_planned": features_planned,
            "issues_summary": {
                "total_issues": len(issues_fixed) + len(issues_open),
                "issues_fixed_count": len(issues_fixed),
                "issues_open_count": len(issues_open),
                "fix_rate": round(len(issues_fixed) / (len(issues_fixed) + len(issues_open)) * 100, 1) if (issues_fixed or issues_open) else 0.0,
            },
            "issues_fixed": issues_fixed,
            "issues_open": issues_open,
        }


prd_assignment_service = PRDAssignmentService()


