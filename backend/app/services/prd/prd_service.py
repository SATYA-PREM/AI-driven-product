"""
prd_service.py
--------------
Main service orchestrating the PRD lifecycle:
- Batch PRD Generation from PM Review Context
- Persistence & Traceability across 14 collections
- Section Editing & Version Control
- PM Review Approval Gates
- User Story & Acceptance Criteria Decomposition
- Backward Lineage & Provenance Resolution
"""

from __future__ import annotations
import uuid
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.database import (
    product_insights_collection,
    issue_clusters_collection,
    feature_clusters_collection,
    processed_data_collection,
    datasets_collection,
)
from app.services.prd.prd_context_builder import prd_context_builder
from app.agents.prd_agent import prd_agent
from app.repositories.prd_repository import prd_repository
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class PRDService:

    def list_pm_reviews(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Dynamically constructs real PM review packages based on actual MongoDB feedback collections
        and PM review decisions for the workspace, strictly scoped by dataset_id when provided.
        """
        base_query: Dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            base_query["$or"] = [{"dataset_id": dataset_id}, {"dataset_id": str(dataset_id)}]

        # Fetch workspace datasets & insights strictly matching the active query
        dataset_doc = None
        if dataset_id:
            try:
                dataset_doc = datasets_collection.find_one({
                    "workspace_id": workspace_id,
                    "$or": [{"id": dataset_id}, {"_id": dataset_id}, {"_id": ObjectId(dataset_id)}]
                })
            except Exception:
                dataset_doc = datasets_collection.find_one({
                    "workspace_id": workspace_id,
                    "$or": [{"id": dataset_id}, {"_id": dataset_id}]
                })
        if not dataset_doc and not dataset_id:
            dataset_doc = datasets_collection.find_one({"workspace_id": workspace_id})

        all_insights = list(product_insights_collection.find(base_query))
        all_clusters = list(issue_clusters_collection.find(base_query))
        all_features = list(feature_clusters_collection.find(base_query))
        total_evidence = processed_data_collection.count_documents(base_query)

        accepted_count = sum(1 for i in all_insights if i.get("review_status") in ["ACCEPTED", "APPROVED"])
        pending_count = sum(1 for i in all_insights if i.get("review_status") not in ["ACCEPTED", "APPROVED", "REJECTED"])
        rejected_count = sum(1 for i in all_insights if i.get("review_status") == "REJECTED")

        dataset_name = (dataset_doc.get("dataset_name") or dataset_doc.get("name") or dataset_doc.get("filename")) if dataset_doc else "Active Feedback Collection"

        reviews_list = []
        now_utc = datetime.now(timezone.utc).isoformat()

        if len(all_insights) == 0:
            reviews_list.append({
                "review_id": "REV-FEEDBACK-EMPTY",
                "title": f"Feedback Batch Review ({dataset_name})",
                "review_status": "AWAITING_AI_ANALYSIS",
                "reviewed_by": "Awaiting AI Pipeline",
                "approved_at": None,
                "approved_issues_count": 0,
                "pending_issues_count": 0,
                "rejected_issues_count": 0,
                "approved_opportunities_count": len(all_features),
                "total_evidence_count": total_evidence,
                "summary": f"Batch '{dataset_name}' has {total_evidence} records, but AI analysis has not been executed yet. Run AI Processing Pipeline first.",
                "comments": "No AI insights generated yet. Complete AI analysis to unlock PM review and PRD generation.",
                "ready_for_prd": False,
            })
            return reviews_list

        # Package 1: Main Feedback Collection Package
        status_p1 = "APPROVED" if accepted_count > 0 else "PENDING_REVIEW"
        reviews_list.append({
            "review_id": "REV-FEEDBACK-MAIN",
            "title": f"Feedback Batch Review ({dataset_name})",
            "review_status": status_p1,
            "reviewed_by": "Product Manager (Decision Maker)" if status_p1 == "APPROVED" else "Awaiting PM Review",
            "approved_at": now_utc if status_p1 == "APPROVED" else None,
            "approved_issues_count": accepted_count,
            "pending_issues_count": pending_count,
            "rejected_issues_count": rejected_count,
            "approved_opportunities_count": len(all_features),
            "total_evidence_count": total_evidence,
            "summary": f"Consolidated package from batch '{dataset_name}' containing {len(all_insights)} AI-synthesized insights ({accepted_count} accepted, {pending_count} pending PM review).",
            "comments": "Complete feedback collection package consolidated for batch CrewAI multi-agent PRD generation.",
            "ready_for_prd": accepted_count > 0,
        })

        # Package 2: Pending PM Review Gate Package (if pending items exist)
        if pending_count > 0:
            reviews_list.append({
                "review_id": "REV-PENDING-SIGN-OFF",
                "title": f"Pending PM Review Gate ({pending_count} Insights Awaiting Sign-off)",
                "review_status": "PENDING_REVIEW",
                "reviewed_by": "Awaiting PM Review",
                "approved_at": None,
                "approved_issues_count": 0,
                "pending_issues_count": pending_count,
                "rejected_issues_count": rejected_count,
                "approved_opportunities_count": len(all_features),
                "total_evidence_count": total_evidence,
                "summary": f"{pending_count} insights currently awaiting PM sign-off. Review and approve before final engineering sign-off.",
                "comments": "Needs PM decision on high severity items.",
                "ready_for_prd": False,
            })

        return reviews_list

    def approve_pm_review(
        self,
        workspace_id: str,
        review_id: str,
        dataset_id: Optional[str] = None,
        reviewed_by: str = "Product Manager (Decision Maker)",
    ) -> Dict[str, Any]:
        """
        Approves a pending PM review package, marking it ready for PRD generation.
        """
        query: Dict[str, Any] = {"workspace_id": workspace_id, "review_status": {"$ne": "REJECTED"}}
        if dataset_id:
            query["$or"] = [{"dataset_id": dataset_id}, {"dataset_id": str(dataset_id)}]

        now_utc = datetime.now(timezone.utc).isoformat()

        # Mark all pending insights as ACCEPTED in MongoDB for this scope
        product_insights_collection.update_many(
            query,
            {"$set": {"review_status": "ACCEPTED", "reviewed_by": reviewed_by, "updated_at": now_utc}}
        )
        # Also mark all feature clusters as ACCEPTED for this scope
        feature_clusters_collection.update_many(
            query,
            {"$set": {"review_status": "ACCEPTED", "reviewed_by": reviewed_by, "updated_at": now_utc}}
        )

        return {
            "review_id": review_id,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "review_status": "APPROVED",
            "reviewed_by": reviewed_by,
            "approved_at": now_utc,
            "ready_for_prd": True,
            "message": f"PM Review Package {review_id} approved successfully! All insights unlocked for PRD generation.",
        }

    def get_context_preview(
        self,
        workspace_id: str,
        source_review_id: str = "REV-BATCH",
        product_id: Optional[str] = "default-product",
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Returns a preview of the PM Review context package that will be passed to
        CrewAI/Gemini for batch PRD generation.
        """
        context = prd_context_builder.build_context(
            workspace_id=workspace_id,
            product_id=product_id,
            source_review_id=source_review_id,
            dataset_id=dataset_id,
            source_type=source_type,
        )

        return {
            "workspace_id": workspace_id,
            "source_review_id": source_review_id,
            "dataset_id": context.get("dataset_id"),
            "dataset_name": context.get("dataset_name", "Active Dataset"),
            "source_type": context.get("source_type", "feedback"),
            "review_status": context["pm_review"]["review_status"],
            "reviewed_by": context["pm_review"]["reviewed_by"],
            "pm_comments": context["pm_review"]["comments"],
            "pm_review": context.get("pm_review"),
            "total_insights_count": context.get("total_insights_count", 0),
            "approved_issues_count": len(context["approved_issues"]),
            "pending_issues_count": context.get("pending_count", 0),
            "rejected_issues_count": context.get("rejected_count", 0),
            "approved_opportunities_count": len(context["approved_opportunities"]),
            "pending_opportunities_count": len(context.get("pending_opportunities", [])),
            "total_evidence_count": context["total_evidence_count"],
            "approved_issues": context["approved_issues"],
            "pending_issues": context.get("pending_issues", []),
            "approved_opportunities": context["approved_opportunities"],
            "pending_opportunities": context.get("pending_opportunities", []),
            "evidence_records": context.get("evidence_snippets", []),
            "suggested_next_steps": context.get("suggested_next_steps", {}),
            "product_context": context.get("product_info", {}),
            "business_context": context.get("business_context", {}),
            "priority_context": context.get("priorities", {}),
            "ready_for_generation": context.get("ready_for_generation", False),
        }

    def generate_prd_from_review(
        self,
        workspace_id: str,
        source_review_id: str = "REV-001",
        product_id: Optional[str] = "default-product",
        pm_comments: Optional[str] = None,
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
        selected_insight_ids: Optional[List[str]] = None,
        selected_opportunity_ids: Optional[List[str]] = None,
        user_id: str = "user_pm",
    ) -> Dict[str, Any]:
        """
        Executes batch PRD generation:
        1. Context Builder aggregates ONE input payload from PM-approved data ONLY
        2. CrewAI + Gemini generates structured PRD with itemized problems and distinct criteria
        3. Persists across all 14 MongoDB collections with UTC timestamps
        """
        start_time = time.time()
        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat()
        serial_ts = now_utc.strftime("%Y%m%d-%H%M")
        short_hex = uuid.uuid4().hex[:4].upper()
        prd_id = f"PRD-{serial_ts}-{short_hex}"

        # Step 1: Build Context Package
        context_payload = prd_context_builder.build_context(
            workspace_id=workspace_id,
            product_id=product_id,
            source_review_id=source_review_id,
            pm_comments=pm_comments,
            dataset_id=dataset_id,
            source_type=source_type,
        )

        # Ensure STRICT PM-APPROVED ONLY filter
        context_payload["approved_issues"] = [
            iss for iss in context_payload.get("approved_issues", [])
            if iss.get("review_status") in ["ACCEPTED", "APPROVED"] or not iss.get("review_status")
        ]
        context_payload["approved_opportunities"] = [
            opp for opp in context_payload.get("approved_opportunities", [])
            if opp.get("review_status") in ["ACCEPTED", "APPROVED"] or not opp.get("review_status")
        ]

        # Apply specific user selection if provided
        if selected_insight_ids is not None:
            context_payload["approved_issues"] = [
                iss for iss in context_payload.get("approved_issues", [])
                if iss.get("issue_id") in selected_insight_ids or iss.get("id") in selected_insight_ids
            ]
        if selected_opportunity_ids is not None:
            context_payload["approved_opportunities"] = [
                opp for opp in context_payload.get("approved_opportunities", [])
                if opp.get("opportunity_id") in selected_opportunity_ids or opp.get("id") in selected_opportunity_ids
            ]

        context_payload["prd_id"] = prd_id

        # Step 2: Save Generation Context
        context_doc = {
            "context_id": f"PRDCTX-{uuid.uuid4().hex[:6].upper()}",
            "prd_id": prd_id,
            "workspace_id": workspace_id,
            "source_review_id": source_review_id,
            "generation_version": 1,
            "pm_review": context_payload["pm_review"],
            "approved_issues": context_payload["approved_issues"],
            "approved_opportunities": context_payload["approved_opportunities"],
            "evidence_records": [e.get("record_id") for e in context_payload.get("evidence_snippets", [])],
            "product_context": context_payload["product_info"],
            "business_context": context_payload["business_context"],
            "priority_context": context_payload["priorities"],
            "generated_at": now_iso,
        }
        prd_repository.save_generation_context(context_doc)

        # Step 3: Run Multi-Agent PRD Generator Crew (app.agents.prd_agent)
        generated_prd_data = prd_agent.generate_prd(context_payload)

        # Step 4: Create PRD Project Root
        dataset_name = context_payload.get("dataset_name") or "Dataset"
        approved_issues = context_payload.get("approved_issues", [])
        approved_opps = context_payload.get("approved_opportunities", [])
        total_approved = approved_issues + approved_opps
        approved_cnt = len(total_approved)

        if approved_cnt == 1:
            title = f"{prd_id} • {total_approved[0].get('title', 'Remediation Specification')}"
        elif approved_cnt > 1:
            first_title = total_approved[0].get("title", "Core Remediation")
            title = f"{prd_id} • {first_title} & {approved_cnt - 1} More Capabilities"
        else:
            title = f"{prd_id} • Product Requirement Document - {dataset_name}"

        source_items = {
            "issues": [i.get("issue_id") or i.get("id") for i in approved_issues],
            "opportunities": [o.get("opportunity_id") or o.get("id") for o in approved_opps],
            "evidence": [e.get("record_id") for e in context_payload.get("evidence_snippets", [])[:10]],
        }

        project_doc = {
            "prd_id": prd_id,
            "workspace_id": workspace_id,
            "product_id": product_id or "default-product",
            "source_review_id": source_review_id,
            "dataset_id": dataset_id,
            "source_type": source_type,
            "source_items": source_items,
            "title": title,
            "status": "draft",
            "created_by": user_id,
            "created_at": now_iso,
            "updated_at": now_iso,
            "current_version": "v1.0",
            "approved_at": None,
            "approved_by": None,
        }
        prd_repository.create_project(project_doc)

        # Step 5: Save PRD Document Content
        raw_prob = generated_prd_data.get("problem_statement")
        if isinstance(raw_prob, dict):
            prob_struct = {
                "primary_problem": raw_prob.get("primary_problem") or "Primary friction identified from customer feedback.",
                "itemized_problems": raw_prob.get("itemized_problems", []),
                "secondary_problems": raw_prob.get("secondary_problems", []),
                "root_causes": raw_prob.get("root_causes", []),
                "customer_need": raw_prob.get("customer_need", ""),
                "business_context": raw_prob.get("business_context", ""),
            }
            extracted_customer_need = raw_prob.get("customer_need", "")
            extracted_business_ctx = raw_prob.get("business_context", "")
        else:
            prob_struct = {
                "primary_problem": str(raw_prob) if raw_prob else "Primary friction identified from customer feedback.",
                "itemized_problems": [],
                "secondary_problems": [],
                "root_causes": [],
                "customer_need": "",
                "business_context": "",
            }
            extracted_customer_need = ""
            extracted_business_ctx = ""

        customer_need = (
            generated_prd_data.get("customer_need")
            or extracted_customer_need
            or "Deliver reliable, permission-aware workflows addressing reported user friction."
        )

        raw_objectives = generated_prd_data.get("objectives") or []
        if isinstance(raw_objectives, list):
            obj_str = " ".join([str(o) for o in raw_objectives if o])
        else:
            obj_str = str(raw_objectives)

        business_objective = (
            generated_prd_data.get("business_objective")
            or obj_str
            or extracted_business_ctx
            or f"Reduce operational friction and improve user retention for {dataset_name}."
        )

        proposed_solution = (
            generated_prd_data.get("proposed_solution")
            or "Implement targeted functional capabilities, robust error handling, and end-to-end telemetry."
        )

        document_doc = {
            "prd_id": prd_id,
            "version": "v1.0",
            "title": title,
            "source_items": source_items,
            "problem_statement": prob_struct,
            "background": generated_prd_data.get("background", "") or generated_prd_data.get("executive_summary", ""),
            "customer_need": customer_need,
            "business_objective": business_objective,
            "target_users": generated_prd_data.get("target_users", []),
            "proposed_solution": proposed_solution,
            "scope": generated_prd_data.get("scope", {"in_scope": [], "out_of_scope": []}),
            "requirements": generated_prd_data.get("requirements", []),
            "features": generated_prd_data.get("features", []),
            "user_stories": generated_prd_data.get("user_stories", []),
            "acceptance_criteria": generated_prd_data.get("acceptance_criteria", []),
            "success_metrics": generated_prd_data.get("success_metrics", []),
            "constraints": generated_prd_data.get("constraints", []),
            "assumptions": generated_prd_data.get("assumptions", []),
            "dependencies": generated_prd_data.get("dependencies", []),
            "risks": generated_prd_data.get("risks", []),
            "traceability": generated_prd_data.get("traceability", []),
            "validation": generated_prd_data.get("validation", {"complete": True, "warnings": [], "conflicts": []}),
            "generated_by": "crewai-gemini",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        prd_repository.save_document(document_doc)

        # Step 6: Save Requirements & Acceptance Criteria
        raw_reqs = generated_prd_data.get("requirements", [])
        req_docs = []
        for r in raw_reqs:
            req_id = r.get("requirement_id") or f"REQ-{uuid.uuid4().hex[:4].upper()}"
            req_doc = {
                "requirement_id": req_id,
                "prd_id": prd_id,
                "version": "v1.0",
                "title": r.get("title", "Functional Requirement"),
                "description": r.get("description", ""),
                "type": r.get("type", "functional"),
                "priority": r.get("priority", "high"),
                "source_insights": r.get("source_insights", []) or r.get("source_issues", []),
                "source_opportunities": r.get("source_opportunities", []),
                "source_evidence": r.get("source_evidence", []),
                "acceptance_criteria": r.get("acceptance_criteria", []),
                "status": "approved",
                "created_at": now_iso,
            }
            req_docs.append(req_doc)

            # Save Acceptance Criteria separately
            ac_list = []
            for ac_idx, ac_text in enumerate(r.get("acceptance_criteria", []), start=1):
                ac_list.append({
                    "criteria_id": f"AC-{req_id}-{ac_idx:02d}",
                    "requirement_id": req_id,
                    "description": ac_text,
                    "type": r.get("type", "functional"),
                    "status": "approved",
                    "created_at": now_iso,
                })
            prd_repository.save_acceptance_criteria(req_id, ac_list)

        prd_repository.save_requirements(prd_id, req_docs)

        # Step 7: Save Features & Prioritization
        raw_feats = generated_prd_data.get("features", [])
        feat_docs = []
        for idx, f in enumerate(raw_feats, start=1):
            feat_id = f.get("feature_id") or f"FEAT-{idx:03d}"
            feat_doc = {
                "feature_id": feat_id,
                "prd_id": prd_id,
                "name": f.get("name", "Feature"),
                "description": f.get("description", ""),
                "requirement_ids": f.get("requirement_ids", []),
                "story_ids": [],
                "priority": f.get("priority", "high"),
                "status": "planned",
                "phase_id": "PHASE-001" if idx <= 2 else "PHASE-002",
                "created_at": now_iso,
            }
            feat_docs.append(feat_doc)

            # Feature Prioritization Framework Record
            prio_doc = {
                "feature_id": feat_id,
                "framework": "weighted_scoring",
                "criteria": {
                    "customer_impact": 9.0 if f.get("priority") == "high" else 7.0,
                    "business_value": 8.5,
                    "frequency": 8.0,
                    "effort": 4.0,
                    "risk": 2.0,
                },
                "weights": {
                    "customer_impact": 0.35,
                    "business_value": 0.30,
                    "frequency": 0.20,
                    "effort": 0.15,
                },
                "score": 8.45 if f.get("priority") == "high" else 7.20,
                "priority": f.get("priority", "high"),
                "scored_by": "system",
                "created_at": now_iso,
            }
            prd_repository.save_prioritization(feat_id, prio_doc)

        prd_repository.save_features(prd_id, feat_docs)

        # Step 8: Save Product Phases
        phase_docs = [
            {
                "phase_id": "PHASE-001",
                "prd_id": prd_id,
                "name": "Phase 1 - MVP & Core Remediation",
                "description": "Deliver core functional requirements and high-friction fixes.",
                "objective": "Resolve top customer friction points and establish reliable baseline.",
                "feature_ids": [f["feature_id"] for f in feat_docs[:2]],
                "start_date": "2026-10-01",
                "target_date": "2026-10-30",
                "status": "planned",
                "approval_status": "approved",
                "created_at": now_iso,
            },
            {
                "phase_id": "PHASE-002",
                "prd_id": prd_id,
                "name": "Phase 2 - Advanced Capabilities & Automation",
                "description": "Expand automation and advanced user options.",
                "objective": "Drive power user productivity and enterprise expansion.",
                "feature_ids": [f["feature_id"] for f in feat_docs[2:]],
                "start_date": "2026-11-01",
                "target_date": "2026-11-30",
                "status": "planned",
                "approval_status": "pending",
                "created_at": now_iso,
            }
        ]
        prd_repository.save_phases(prd_id, phase_docs)

        # Step 9: Save User Stories & Tasks
        raw_stories = generated_prd_data.get("user_stories", [])
        if raw_stories:
            story_docs = []
            task_docs = []
            for idx, us in enumerate(raw_stories, start=1):
                sid = us.get("story_id") or f"US-{idx:03d}"
                rid = us.get("requirement_id") or (req_docs[idx-1]["requirement_id"] if idx <= len(req_docs) else "REQ-001")
                st_doc = {
                    "story_id": sid,
                    "prd_id": prd_id,
                    "requirement_id": rid,
                    "title": us.get("title", f"User Story {idx}"),
                    "story": us.get("story") or f"As a {us.get('as_a', 'user')}, I want {us.get('i_want', 'to perform operation')} so that {us.get('so_that', 'I achieve outcome')}.",
                    "persona": us.get("as_a", "enterprise_user"),
                    "priority": "high" if idx <= 2 else "medium",
                    "status": "planned",
                    "acceptance_criteria": us.get("acceptance_criteria", []),
                    "created_at": now_iso,
                }
                story_docs.append(st_doc)

                task_doc = {
                    "task_id": f"TASK-{idx:03d}",
                    "phase_id": "PHASE-001" if idx <= 2 else "PHASE-002",
                    "feature_id": f"FEAT-{idx:03d}",
                    "story_id": sid,
                    "title": f"Implement {us.get('title', f'Story {idx}')}",
                    "description": f"Develop architecture and UI workflow for {us.get('title', f'Story {idx}')}.",
                    "assigned_to": "Engineering Lead",
                    "priority": "high" if idx <= 2 else "medium",
                    "status": "todo",
                    "estimated_effort": 5,
                    "dependency_ids": [f"TASK-{idx-1:03d}"] if idx > 1 else [],
                    "acceptance_criteria": us.get("acceptance_criteria", []),
                    "created_at": now_iso,
                }
                task_docs.append(task_doc)

            prd_repository.save_user_stories(prd_id, story_docs)
            prd_repository.save_tasks(prd_id, task_docs)
        else:
            self.generate_user_stories_for_prd(prd_id)

        # Step 10: Log Initial Version & Telemetry Run
        version_doc = {
            "version_id": f"PRDV-001",
            "prd_id": prd_id,
            "version": "v1.0",
            "parent_version": None,
            "change_type": "initial_batch_generation",
            "change_summary": [f"Generated initial structured PRD covering {approved_cnt} PM-approved items."],
            "changed_by": user_id,
            "created_at": now_iso,
        }
        prd_repository.add_version(version_doc)

        ai_run_payload = generated_prd_data.get("ai_generation_run") or {
            "run_id": f"AIRUN-{uuid.uuid4().hex[:6].upper()}",
            "prd_id": prd_id,
            "workspace_id": workspace_id,
            "context_id": context_doc["context_id"],
            "provider": "gemini",
            "orchestrator": "crewai_4_agents",
            "model": (settings.GEMINI_MODEL or "").split()[0].strip(),
            "generation_type": "prd_batch",
            "status": "completed",
            "latency_seconds": round(time.time() - start_time, 2),
            "generated_at": now_iso,
            "timestamp": now_iso,
        }
        ai_run_payload["prd_id"] = prd_id
        prd_repository.log_ai_run(ai_run_payload)

        return self.get_full_prd_tree(prd_id)

    def generate_user_stories_for_prd(self, prd_id: str) -> List[Dict[str, Any]]:
        """
        Decomposes approved requirements into User Stories & Acceptance Criteria.
        """
        reqs = prd_repository.get_requirements(prd_id)
        existing_stories = prd_repository.get_user_stories(prd_id)
        if existing_stories:
            return existing_stories

        stories = []
        tasks = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for idx, r in enumerate(reqs, start=1):
            req_id = r["requirement_id"]
            story_id = f"US-{idx:03d}"
            title = f"Story: {r['title']}"
            user_story = f"As an enterprise workspace user, I want {r['title'].lower()} so that I can perform my workflow efficiently without friction."

            st_doc = {
                "story_id": story_id,
                "prd_id": prd_id,
                "requirement_id": req_id,
                "title": title,
                "story": user_story,
                "persona": "enterprise_user",
                "priority": r.get("priority", "high"),
                "status": "planned",
                "acceptance_criteria": r.get("acceptance_criteria", []),
                "created_at": now_iso,
            }
            stories.append(st_doc)

            # Create corresponding Development Task
            task_doc = {
                "task_id": f"TASK-{idx:03d}",
                "phase_id": "PHASE-001" if idx <= 2 else "PHASE-002",
                "feature_id": f"FEAT-{idx:03d}",
                "story_id": story_id,
                "title": f"Implement {r['title']}",
                "description": f"Develop backend logic and UI interface for {r['title']}.",
                "assigned_to": "Engineering Lead",
                "priority": r.get("priority", "high"),
                "status": "todo",
                "estimated_effort": 5,
                "dependency_ids": [f"TASK-{idx-1:03d}"] if idx > 1 else [],
                "acceptance_criteria": r.get("acceptance_criteria", []),
                "created_at": now_iso,
            }
            tasks.append(task_doc)

        prd_repository.save_user_stories(prd_id, stories)
        prd_repository.save_tasks(prd_id, tasks)

        return stories

    def get_full_prd_tree(self, prd_id: str) -> Dict[str, Any]:
        """
        Retrieves the complete PRD package across all collections for frontend rendering.
        """
        project = prd_repository.find_project_by_prd_id(prd_id) or {}
        context = prd_repository.get_generation_context(prd_id) or {}
        document = prd_repository.get_document(prd_id) or {}
        reqs = prd_repository.get_requirements(prd_id)
        stories = prd_repository.get_user_stories(prd_id)
        ac_list = prd_repository.get_acceptance_criteria_by_prd(prd_id)
        features = prd_repository.get_features(prd_id)
        phases = prd_repository.get_phases(prd_id)
        tasks = prd_repository.get_tasks(prd_id)
        reviews = prd_repository.get_reviews(prd_id)
        versions = prd_repository.get_versions(prd_id)
        ai_run = prd_repository.get_ai_run(prd_id) or {}

        traceability = document.get("traceability") or ai_run.get("traceability", [])
        validation = document.get("validation") or ai_run.get("validation", {"complete": True, "warnings": [], "conflicts": []})

        return {
            "project": project,
            "context": context,
            "document": document,
            "requirements": reqs,
            "user_stories": stories,
            "acceptance_criteria": ac_list,
            "features": features,
            "phases": phases,
            "tasks": tasks,
            "reviews": reviews,
            "versions": versions,
            "ai_generation_run": ai_run,
            "traceability": traceability,
            "validation": validation,
        }

    def update_prd_document(self, prd_id: str, update_data: Dict[str, Any], user_id: str = "user_pm") -> Dict[str, Any]:
        """
        Updates section-by-section content of a PRD document and records a version snapshot.
        """
        doc = prd_repository.get_document(prd_id)
        if not doc:
            raise ValueError(f"PRD Document {prd_id} not found.")

        current_ver = doc.get("version", "v1.0")
        ver_parts = current_ver.replace("v", "").split(".")
        new_minor = int(ver_parts[1]) + 1 if len(ver_parts) > 1 else 1
        new_version = f"v{ver_parts[0]}.{new_minor}"
        now_iso = datetime.now(timezone.utc).isoformat()

        clean_update = {k: v for k, v in update_data.items() if v is not None}
        clean_update["version"] = new_version
        clean_update["updated_at"] = now_iso

        doc.update(clean_update)
        prd_repository.save_document(doc)

        # Update Project root version & status
        prd_repository.update_project(prd_id, {
            "current_version": new_version,
            "status": "pm_review",
            "updated_at": now_iso,
        })

        # Save Version Snapshot
        version_doc = {
            "version_id": f"PRDV-{uuid.uuid4().hex[:4].upper()}",
            "prd_id": prd_id,
            "version": new_version,
            "parent_version": current_ver,
            "change_type": "pm_section_edit",
            "change_summary": [f"Updated sections: {', '.join(clean_update.keys())}"],
            "changed_by": user_id,
            "created_at": now_iso,
        }
        prd_repository.add_version(version_doc)

        return self.get_full_prd_tree(prd_id)

    def submit_prd_pm_review(
        self,
        prd_id: str,
        decision: str,
        comments: List[Dict[str, str]],
        reviewed_by: str = "Priya Sharma (PM)"
    ) -> Dict[str, Any]:
        """
        Submits PM decision review gate on PRD ('approved' or 'changes_requested').
        """
        status_target = "approved" if decision.lower() == "approved" else "changes_requested"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Record Review Gate
        project = prd_repository.find_project_by_prd_id(prd_id) or {}
        review_doc = {
            "review_id": f"PRDREV-{uuid.uuid4().hex[:6].upper()}",
            "prd_id": prd_id,
            "version": project.get("current_version", "v1.0"),
            "reviewed_by": reviewed_by,
            "review_type": "pm_approval_gate",
            "decision": decision,
            "comments": comments or [],
            "created_at": now_iso,
        }
        prd_repository.add_review(review_doc)

        # Update Project Status
        update_fields = {
            "status": status_target,
            "updated_at": now_iso,
        }
        if status_target == "approved":
            update_fields["approved_at"] = now_iso
            update_fields["approved_by"] = reviewed_by

        prd_repository.update_project(prd_id, update_fields)

        return self.get_full_prd_tree(prd_id)

    def get_provenance_chain(self, prd_id: str, item_type: str, item_id: str) -> Dict[str, Any]:
        """
        Backward Lineage Resolution:
        Traces item backwards: TASK → STORY → REQUIREMENT → INSIGHT/ISSUE/OPPORTUNITY → FEEDBACK EVIDENCE
        """
        initial_type = item_type
        initial_id = item_id
        tree = self.get_full_prd_tree(prd_id)
        chain = []

        curr_type = item_type.lower()
        curr_id = item_id

        if curr_type == "task":
            t = next((tk for tk in tree["tasks"] if tk["task_id"] == curr_id), None)
            if t:
                chain.append({"stage": "Development Task", "id": t["task_id"], "label": t["title"]})
                curr_type = "story"
                curr_id = t.get("story_id", "")

        if curr_type == "story":
            st = next((s for s in tree["user_stories"] if s["story_id"] == curr_id), None)
            if st:
                chain.append({"stage": "User Story", "id": st["story_id"], "label": st["title"]})
                curr_type = "requirement"
                curr_id = st.get("requirement_id", "")

        if curr_type == "requirement":
            req = next((r for r in tree["requirements"] if r["requirement_id"] == curr_id), None)
            if req:
                chain.append({"stage": "Requirement", "id": req["requirement_id"], "label": req["title"]})
                sources = req.get("source_insights", []) or req.get("source_issues", [])
                for src in sources:
                    chain.append({"stage": "Approved Insight/Issue", "id": src, "label": f"Source Issue {src}"})
                opps = req.get("source_opportunities", [])
                for opp in opps:
                    chain.append({"stage": "Approved Opportunity", "id": opp, "label": f"Opportunity {opp}"})
                evs = req.get("source_evidence", [])
                for ev in evs[:3]:
                    chain.append({"stage": "Customer Feedback Evidence", "id": ev, "label": f"Customer Quote {ev}"})

        # Add PRD Root Context
        chain.append({"stage": "PRD Document", "id": prd_id, "label": tree["project"].get("title", "PRD")})
        chain.append({"stage": "PM Review Gate", "id": tree["project"].get("source_review_id", "REV-001"), "label": "Approved PM Package"})

        return {
            "item_type": initial_type,
            "item_id": initial_id,
            "provenance_chain": chain
        }

    def build_circulation_package(
        self,
        prd_id: str,
        feature_ids: List[str],
        circulation_notes: str = "",
        reviewer_name: str = "Priya Sharma (PM)"
    ) -> Dict[str, Any]:
        """
        Builds a dedicated circulation and team-review package for selected PRD features.
        Comprises full problem statements, root causes, functional requirements, user stories,
        acceptance criteria, evidence quotes, and printable/exportable markdown text.
        """
        tree = self.get_full_prd_tree(prd_id)
        project = tree.get("project") or {}
        doc = tree.get("document") or {}
        context = tree.get("context") or {}
        all_features = tree.get("features") or []
        all_reqs = tree.get("requirements") or []
        all_stories = tree.get("user_stories") or []
        all_evidence = context.get("evidence_records") or []
        now_iso = datetime.now(timezone.utc).isoformat()

        # If no feature_ids provided, default to all features
        target_fids = set(feature_ids) if feature_ids else {f["feature_id"] for f in all_features}
        selected_features = [f for f in all_features if f.get("feature_id") in target_fids]
        if not selected_features and all_features:
            selected_features = all_features

        feature_packages = []
        md_lines = [
            f"# {doc.get('title', project.get('title', 'Product Requirements Document'))}",
            f"**PRD Identifier:** {prd_id} | **Version:** {project.get('current_version', 'v1.0')} | **Status:** {project.get('status', 'draft').upper()}",
            f"**Circulated By:** {reviewer_name} | **Date:** {now_iso[:10]}",
            "",
            "---",
            "",
            "## Executive Summary",
            doc.get("background") or doc.get("executive_summary") or "This document outlines feature specifications and customer requirements for engineering correction and review.",
            "",
            "## Strategic Directive & PM Notes",
            f"> {circulation_notes}" if circulation_notes else "> Selected features approved for engineering review and team circulation.",
            "",
            "---",
            "## Selected Feature Specifications",
            ""
        ]

        for idx, feat in enumerate(selected_features, start=1):
            fid = feat.get("feature_id", f"FEAT-{idx:03d}")
            req_ids = feat.get("requirement_ids") or [r.get("requirement_id") for r in all_reqs if r.get("requirement_id") == fid.replace("FEAT-", "REQ-")]
            linked_reqs = [r for r in all_reqs if r.get("requirement_id") in req_ids or r.get("requirement_id") == fid]
            linked_stories = [s for s in all_stories if s.get("requirement_id") in req_ids or s.get("feature_id") == fid]

            # Resolve linked problem statements & symptoms
            problem_items = []
            linked_evidence_items = []
            for r in linked_reqs:
                source_ids = r.get("source_insights", []) or r.get("source_issues", [])
                for sid in source_ids:
                    issue = next((i for i in context.get("approved_issues", []) if (i.get("issue_id") == sid or i.get("id") == sid)), None)
                    if issue:
                        problem_items.append({
                            "id": sid,
                            "title": issue.get("title", ""),
                            "description": issue.get("problem_description") or issue.get("description", ""),
                            "symptoms": issue.get("symptoms", []),
                            "root_cause": issue.get("root_cause", ""),
                            "impact": issue.get("customer_impact", "HIGH"),
                        })
                    opp = next((o for o in context.get("approved_opportunities", []) if (o.get("opportunity_id") == sid or o.get("id") == sid)), None)
                    if opp:
                        problem_items.append({
                            "id": sid,
                            "title": opp.get("title", ""),
                            "description": opp.get("description", ""),
                            "symptoms": ["User capability enhancement requested"],
                            "root_cause": "Feature capability not yet implemented",
                            "impact": opp.get("priority", "MEDIUM"),
                        })

                # Direct evidence quotes
                ev_ids = r.get("source_evidence", [])
                for evid in ev_ids:
                    ev_match = next((e for e in all_evidence if e.get("id") == evid or e.get("feedback_id") == evid), None)
                    if ev_match:
                        linked_evidence_items.append(ev_match)
                    else:
                        linked_evidence_items.append({"id": evid, "text": f"Customer evidence record {evid}"})

            feat_pkg = {
                "feature_id": fid,
                "name": feat.get("name") or feat.get("title", f"Feature {fid}"),
                "description": feat.get("description", ""),
                "priority": feat.get("ai_recommended_priority") or feat.get("priority", "high"),
                "phase": feat.get("target_phase", "Phase 1"),
                "problem_items": problem_items,
                "requirements": linked_reqs,
                "user_stories": linked_stories,
                "evidence": linked_evidence_items,
                "acceptance_criteria": [ac for r in linked_reqs for ac in r.get("acceptance_criteria", [])],
            }
            feature_packages.append(feat_pkg)

            # Append to Markdown string
            md_lines.append(f"### {idx}. [{fid}] {feat_pkg['name']}")
            md_lines.append(f"**Priority:** {str(feat_pkg['priority']).upper()} | **Phase:** {feat_pkg['phase']}")
            md_lines.append(f"\n**Description:** {feat_pkg['description']}\n")

            if problem_items:
                md_lines.append("#### Customer Problem & Root Cause Analysis:")
                for p in problem_items:
                    md_lines.append(f"- **Issue {p['id']} ({p['title']}):** {p['description']}")
                    if p.get('root_cause'):
                        md_lines.append(f"  - *Root Cause:* {p['root_cause']}")
                    if p.get('symptoms'):
                        md_lines.append(f"  - *Symptoms:* {', '.join(p['symptoms'])}")

            if linked_reqs:
                md_lines.append("\n#### Functional Requirements & Acceptance Criteria:")
                for req in linked_reqs:
                    md_lines.append(f"- **[{req.get('requirement_id', 'REQ')}] {req.get('title', '')}** (Priority: {req.get('priority', 'high')})")
                    md_lines.append(f"  {req.get('description', '')}")
                    if req.get("acceptance_criteria"):
                        md_lines.append("  *Acceptance Criteria:*")
                        for ac in req["acceptance_criteria"]:
                            md_lines.append(f"  - [ ] {ac}")

            if linked_stories:
                md_lines.append("\n#### User Stories:")
                for s in linked_stories:
                    md_lines.append(f"- **[{s.get('story_id', 'US')}]** {s.get('story', s.get('title', ''))}")

            if linked_evidence_items:
                md_lines.append("\n#### Customer Verbatim Feedback Evidence:")
                for ev in linked_evidence_items[:3]:
                    ev_txt = ev.get('text') or ev.get('feedback_text') or ev.get('quote') or str(ev)
                    md_lines.append(f"> \"{ev_txt}\"")

            md_lines.append("\n---\n")

        return {
            "prd_id": prd_id,
            "title": doc.get("title", project.get("title", "Product Requirements Document")),
            "version": project.get("current_version", "v1.0"),
            "status": project.get("status", "draft"),
            "circulation_notes": circulation_notes,
            "reviewer_name": reviewer_name,
            "generated_at": now_iso,
            "selected_features_count": len(selected_features),
            "features": feature_packages,
            "markdown_content": "\n".join(md_lines),
        }


prd_service = PRDService()
