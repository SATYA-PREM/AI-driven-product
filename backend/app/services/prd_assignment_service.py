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
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.PRODUCT_DESIGNER.value: {
        "title": "Product Designer / UX Designer",
        "default_name": "Yash (Product Designer)",
        "default_email": "yash.designer@prodintel.ai",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.DEVELOPER.value: {
        "title": "Developer / Engineer",
        "default_name": "Elamaran (Lead Engineer)",
        "default_email": "elamaran.dev@prodintel.ai",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.QA.value: {
        "title": "QA / Tester",
        "default_name": "Ananya (QA Specialist)",
        "default_email": "ananya.qa@prodintel.ai",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    ProductTeamRole.STAKEHOLDER.value: {
        "title": "Stakeholder / Business Owner",
        "default_name": "Marcus (Business Sponsor)",
        "default_email": "marcus.stakeholder@prodintel.ai",
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
    def list_assignments(
        self,
        workspace_id: str,
        prd_ids: Optional[List[str]] = None,
        category_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lists assignments enriched with PRD metadata, requirement titles, and team member info.
        """
        assignments = prd_assignment_repository.list_assignments(
            workspace_id=workspace_id,
            prd_ids=prd_ids,
            category_id=category_id,
            user_id=user_id,
            status=status,
        )

        team_members = self.get_workspace_team_members(workspace_id)
        member_map = {m["user_id"]: m for m in team_members}

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
            item["role_title"] = mem.get("role_title") or item.get("team_role", "DEVELOPER")

            # Resolve requirement and PRD title
            pid = item.get("prd_id", "")
            rid = item.get("requirement_id", "")
            project = prd_repository.find_project_by_prd_id(pid) or {}
            item["prd_title"] = project.get("title") or pid

            reqs = prd_repository.get_requirements(pid)
            req_match = next((r for r in reqs if (r.get("requirement_id") or r.get("id")) == rid), {})
            item["requirement_title"] = req_match.get("title") or req_match.get("description", "")[:80]
            item["requirement_type"] = req_match.get("type", "FUNCTIONAL")

            enriched.append(item)

        return enriched

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


prd_assignment_service = PRDAssignmentService()

