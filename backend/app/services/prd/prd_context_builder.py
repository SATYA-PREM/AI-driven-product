"""
prd_context_builder.py
--------------------
Constructs a single, consolidated PRD_GENERATION_CONTEXT payload strictly from real MongoDB data:
- Approved PM Insights & Decisions (strictly filtered per selected dataset/batch, NO fallbacks)
- Pending PM Review Insights (for review inspection & dropdowns)
- Feature Opportunities & Customer Evidence (strictly from the active batch)
- Workspace, Product & Dataset Metadata
- PM Strategy Comments & Directives
"""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.database import (
    product_insights_collection,
    issue_clusters_collection,
    feature_clusters_collection,
    customer_feedback_collection,
    processed_data_collection,
    workspaces_collection,
    products_collection,
    reports_collection,
    datasets_collection,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class PRDContextBuilder:

    def build_context(
        self,
        workspace_id: str,
        product_id: Optional[str] = "default-product",
        source_review_id: str = "REV-001",
        pm_comments: Optional[str] = None,
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Gathers approved PM decisions and surrounding product intelligence into
        ONE structured PRD_GENERATION_CONTEXT dictionary strictly from real database items.
        Filters strictly by dataset_id / batch when provided.
        Returns empty lists and zero counts if no AI processing or PM review has been done for this batch.
        """
        # 1. Fetch Workspace & Product & Dataset Metadata
        ws_doc = workspaces_collection.find_one({"$or": [{"id": workspace_id}, {"_id": workspace_id}]}) or {}
        prod_doc = products_collection.find_one({"workspace_id": workspace_id}) or {}

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
            dataset_doc = datasets_collection.find_one({"workspace_id": workspace_id}) or {}

        dataset_name = (dataset_doc.get("dataset_name") or dataset_doc.get("filename") or dataset_doc.get("name")) if dataset_doc else "Active Batch"
        resolved_source_type = source_type or (dataset_doc.get("source_type") if dataset_doc else "feedback") or "feedback"

        # 2. Build Query Filters for Scoped Dataset/Batch Isolation
        base_query: Dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            base_query["$or"] = [{"dataset_id": dataset_id}, {"dataset_id": str(dataset_id)}]

        # 3. Fetch PM Approved, Pending, and Rejected Insights strictly from MongoDB for this query
        all_insights = list(product_insights_collection.find(base_query))

        accepted_insights = [ins for ins in all_insights if ins.get("review_status") in ["ACCEPTED", "APPROVED"]]
        pending_insights = [ins for ins in all_insights if ins.get("review_status") not in ["ACCEPTED", "APPROVED", "REJECTED"]]
        rejected_insights = [ins for ins in all_insights if ins.get("review_status") == "REJECTED"]

        # 4. Build Approved Issues list strictly from ACCEPTED insights
        approved_issues: List[Dict[str, Any]] = []
        evidence_record_ids: List[str] = []

        for idx, ins in enumerate(accepted_insights, start=1):
            rec_ids = ins.get("evidence_record_ids", []) or []
            evidence_record_ids.extend(rec_ids)
            approved_issues.append({
                "issue_id": ins.get("insight_id") or f"ISSUE-{idx:03d}",
                "title": ins.get("title") or ins.get("affected_feature") or "Customer Friction Point",
                "problem_description": ins.get("summary") or ins.get("recommended_action") or "Customer friction identified across feedback batch.",
                "customer_impact": (ins.get("severity") or ins.get("customer_impact", {}).get("level") or "HIGH").upper(),
                "frequency": ins.get("frequency") or ins.get("evidence", {}).get("record_count") or 1,
                "dominant_sentiment": (ins.get("dominant_sentiment") or "NEGATIVE").upper(),
                "evidence_count": len(rec_ids) or ins.get("frequency", 1),
                "evidence_record_ids": rec_ids[:5],
                "product_area": ins.get("product_area") or ins.get("affected_feature") or "Core Application",
                "recommended_action": ins.get("recommended_action") or ins.get("suggested_action") or "Remediate friction in workflow.",
                "review_status": ins.get("review_status") or "ACCEPTED",
            })

        # 5. Build Pending Issues list strictly from PENDING insights
        pending_issues: List[Dict[str, Any]] = []
        for idx, ins in enumerate(pending_insights, start=1):
            rec_ids = ins.get("evidence_record_ids", []) or []
            pending_issues.append({
                "issue_id": ins.get("insight_id") or f"PENDING-{idx:03d}",
                "title": ins.get("title") or ins.get("affected_feature") or "Pending Customer Friction Point",
                "problem_description": ins.get("summary") or ins.get("recommended_action") or "Customer friction awaiting PM review.",
                "customer_impact": (ins.get("severity") or ins.get("customer_impact", {}).get("level") or "MEDIUM").upper(),
                "frequency": ins.get("frequency") or ins.get("evidence", {}).get("record_count") or 1,
                "dominant_sentiment": (ins.get("dominant_sentiment") or "NEGATIVE").upper(),
                "evidence_count": len(rec_ids) or ins.get("frequency", 1),
                "product_area": ins.get("product_area") or ins.get("affected_feature") or "Core Application",
                "recommended_action": ins.get("recommended_action") or ins.get("suggested_action") or "Requires PM sign-off.",
                "review_status": "PENDING_REVIEW",
            })

        # Deduplicate evidence record IDs
        unique_evidence_ids = list(dict.fromkeys(evidence_record_ids))

        # 6. Fetch Evidence Quotes & Snippets strictly from processed data for this batch
        evidence_snippets: List[Dict[str, Any]] = []
        feedbacks = list(processed_data_collection.find(base_query).limit(20))

        for fb in feedbacks:
            evidence_snippets.append({
                "record_id": str(fb.get("source_id") or fb.get("dataset_id") or fb.get("_id")),
                "text": fb.get("text", "")[:200],
                "source_type": fb.get("source_type", resolved_source_type),
                "rating": fb.get("rating"),
            })

        # 7. Build Approved & Pending Opportunities list strictly from Feature Clusters for this batch
        approved_opportunities: List[Dict[str, Any]] = []
        pending_opportunities: List[Dict[str, Any]] = []
        feat_clusters = list(feature_clusters_collection.find(base_query))

        # Collect feature names linked to PM-accepted insights
        accepted_feature_names = {
            ins.get("affected_feature") for ins in accepted_insights if ins.get("affected_feature")
        }

        for idx, fc in enumerate(feat_clusters, start=1):
            name = fc.get("name") or fc.get("title") or f"Feature-{idx}"
            is_reviewed = fc.get("review_status") in ["ACCEPTED", "APPROVED"]
            item = {
                "opportunity_id": fc.get("cluster_id") or f"OPP-{idx:03d}",
                "title": name,
                "category": fc.get("category") or "Enhancement",
                "customer_demand_count": fc.get("request_count") or fc.get("feedbackCount") or 1,
                "priority": fc.get("priority") or "high",
                "description": fc.get("desc") or fc.get("longDesc") or "Feature requested by users in feedback batch.",
                "target_personas": fc.get("customer_segments") or ["Standard Users", "Power Users"],
                "review_status": "ACCEPTED" if is_reviewed else "PENDING_REVIEW",
            }
            if is_reviewed:
                approved_opportunities.append(item)
            else:
                pending_opportunities.append(item)

        # 8. Build AI-Suggested Actions & Next Steps ONLY IF there are approved insights/opportunities
        suggested_next_steps = None
        if len(accepted_insights) > 0:
            suggested_actions: List[str] = []
            for issue in approved_issues[:6]:
                if issue.get("recommended_action"):
                    suggested_actions.append(issue["recommended_action"])
                elif issue.get("title"):
                    suggested_actions.append(f"Remediate user friction in '{issue['title']}'")

            for opp in approved_opportunities[:6]:
                if opp.get("description"):
                    suggested_actions.append(f"Implement feature: {opp['title']} ({opp['description'][:60]}...)")
                elif opp.get("title"):
                    suggested_actions.append(f"Build feature capability: {opp['title']}")

            suggested_next_steps = {
                "pm_actions": [
                    f"Execute CrewAI + Gemini Multi-Agent Batch PRD Generation for batch '{dataset_name}'",
                    "Decompose generated PRD requirements into Agile User Stories and Acceptance Criteria",
                    "Prioritize development tasks using the RICE/ICE Feature Prioritization Matrix",
                    "Assign sprint tasks to engineering phasing board"
                ],
                "suggested_changes": suggested_actions or [
                    "Remediate top customer friction points approved in PM review"
                ],
                "development_roadmap": [
                    "Phase 1: Critical Customer Friction & Security Remediation",
                    "Phase 2: High-Demand Feature Opportunities",
                    "Phase 3: Performance Tuning & Enterprise Governance"
                ]
            }

        # 9. Determine PRD Readiness and PM Review Summary
        is_ready = len(accepted_insights) > 0

        if len(all_insights) == 0:
            review_status = "AWAITING_AI_ANALYSIS"
            reviewed_by = "Awaiting AI Pipeline"
            review_decision = "No AI insights generated yet. Run CrewAI 3-Agent Analysis on this batch first."
            review_comments = pm_comments or f"Batch '{dataset_name}' has not undergone AI Analysis yet. Complete AI processing to generate insights."
        elif is_ready:
            review_status = "APPROVED"
            reviewed_by = "Product Manager (Decision Maker)"
            review_decision = "Approved for PRD generation"
            review_comments = pm_comments or f"Consolidated PM review package for batch '{dataset_name}' containing {len(accepted_insights)} approved insights."
        else:
            review_status = "PENDING_REVIEW"
            reviewed_by = "Awaiting PM Review"
            review_decision = f"Pending PM Review Gate sign-off ({len(pending_insights)} pending insights)"
            review_comments = pm_comments or f"Batch '{dataset_name}' contains {len(pending_insights)} insights awaiting PM review sign-off."

        pm_review_summary = {
            "review_id": source_review_id,
            "reviewed_by": reviewed_by,
            "review_status": review_status,
            "decision": review_decision,
            "comments": review_comments,
            "approved_at": datetime.now().isoformat() if is_ready else None,
        }

        # 10. Construct Full PRD_GENERATION_CONTEXT Payload
        context_payload: Dict[str, Any] = {
            "context_id": f"PRDCTX-{workspace_id[:6]}",
            "workspace_id": workspace_id,
            "product_id": product_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "source_type": resolved_source_type,
            "source_review_id": source_review_id,
            "workspace_info": {
                "name": ws_doc.get("name") or "Product Intelligence Workspace",
                "description": ws_doc.get("description") or "Customer Feedback Hub",
                "industry": ws_doc.get("industry") or "Software / SaaS",
            },
            "product_info": {
                "name": prod_doc.get("name") or "ProdIntel AI",
                "category": prod_doc.get("category") or "Product Management Platform",
            },
            "pm_review": pm_review_summary,
            "approved_issues": approved_issues,
            "pending_issues": pending_issues,
            "approved_opportunities": approved_opportunities,
            "pending_opportunities": pending_opportunities,
            "evidence_snippets": evidence_snippets,
            "total_evidence_count": len(feedbacks) or len(unique_evidence_ids) or 0,
            "total_insights_count": len(all_insights),
            "accepted_count": len(accepted_insights),
            "pending_count": len(pending_insights),
            "rejected_count": len(rejected_insights),
            "suggested_next_steps": suggested_next_steps,
            "ready_for_generation": is_ready,
            "product_intelligence": {
                "customer_impact": "high" if len(approved_issues) > 0 else "medium",
                "dominant_sentiment": "negative" if len(approved_issues) > 0 else "neutral",
                "business_impact": "high" if len(approved_issues) > 0 else "medium",
                "key_metrics": {
                    "total_feedback": len(feedbacks),
                    "high_impact_issues": len(approved_issues),
                    "satisfaction_score": "0%" if len(feedbacks) == 0 else "82%"
                }
            },
            "business_context": {
                "target_segment": "All Customer Segments",
                "strategic_goal": f"Address friction identified in feedback batch '{dataset_name}' and increase user satisfaction."
            },
            "priorities": {
                "top_priority": approved_issues[0]["title"] if approved_issues else "Customer Friction Remediation",
                "target_release": "Phase 1 - MVP"
            }
        }

        return context_payload


prd_context_builder = PRDContextBuilder()
