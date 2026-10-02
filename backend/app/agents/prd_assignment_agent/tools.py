"""
tools.py
--------
Sanitization, validation and deterministic assignment utilities for the PRD Assignment Agent.
"""

from __future__ import annotations
import json
import re
from typing import Dict, Any, List, Optional
from app.core.logging import get_logger

logger = get_logger(__name__)


def extract_lean_planning_context(
    prd_project: Dict[str, Any],
    prd_document: Optional[Dict[str, Any]],
    requirements: List[Dict[str, Any]],
    features: List[Dict[str, Any]],
    acceptance_criteria: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Extract ONLY minimal planning data necessary for assignment analysis.
    Strips raw feedback, dataset dumps, and unrelated metadata to optimize token usage & protect privacy.
    """
    doc = prd_document or {}
    lean_reqs = []

    # Map acceptance criteria by requirement_id
    ac_map: Dict[str, List[str]] = {}
    for ac in acceptance_criteria:
        rid = ac.get("requirement_id", "")
        crit = ac.get("criterion") or ac.get("description") or ac.get("text", "")
        if rid and crit:
            ac_map.setdefault(rid, []).append(crit)

    for req in requirements:
        rid = req.get("requirement_id") or req.get("id") or ""
        fid = req.get("feature_id") or ""
        desc = req.get("description") or req.get("title") or req.get("summary") or ""
        criteria = req.get("acceptance_criteria") or ac_map.get(rid, [])

        lean_reqs.append({
            "requirement_id": rid,
            "feature_id": fid,
            "title": req.get("title") or desc[:80],
            "description": desc,
            "type": req.get("type", "FUNCTIONAL"),
            "acceptance_criteria": criteria[:4],
            "technical_notes": req.get("technical_notes", "")[:200],
            "ui_ux_guidance": req.get("ui_ux_guidance", "")[:200],
        })

    return {
        "prd_id": prd_project.get("prd_id", ""),
        "prd_title": prd_project.get("title") or doc.get("title") or "Product Requirements Document",
        "prd_summary": doc.get("executive_summary") or doc.get("background") or prd_project.get("description", "")[:300],
        "product_goals": doc.get("goals") or prd_project.get("category", "General Software Feature"),
        "requirements": lean_reqs,
    }


def validate_and_sanitize_recommendations(
    raw_recommendations: List[Dict[str, Any]],
    candidate_members: List[Dict[str, Any]],
    requirements: List[Dict[str, Any]],
    prd_id: str,
) -> List[Dict[str, Any]]:
    """
    Strict validation gate:
    1. Ensures every recommended user_id exists in candidate_members.
    2. Validates product team roles.
    3. Guarantees requirements belong to the targeted PRD.
    """
    valid_member_ids = {str(m.get("user_id") or m.get("id")): m for m in candidate_members}
    valid_req_ids = {str(r.get("requirement_id") or r.get("id")): r for r in requirements}

    sanitized: List[Dict[str, Any]] = []

    for rec in raw_recommendations:
        rid = str(rec.get("requirement_id", ""))
        if rid not in valid_req_ids:
            # Try fuzzy matching
            matched = next((k for k in valid_req_ids.keys() if rid.lower() in k.lower()), None)
            if matched:
                rid = matched
            else:
                continue

        req_info = valid_req_ids[rid]
        valid_rec_members: List[Dict[str, Any]] = []

        for rm in rec.get("recommended_members", []):
            uid = str(rm.get("user_id", ""))
            member_obj = valid_member_ids.get(uid)

            # Fallback matching by role or name if model returned role instead of valid ID
            if not member_obj:
                target_role = str(rm.get("role", "")).upper()
                member_obj = next(
                    (m for m in candidate_members if str(m.get("team_role", "")).upper() == target_role),
                    None
                )
                if member_obj:
                    uid = str(member_obj.get("user_id") or member_obj.get("id"))

            if member_obj and uid in valid_member_ids:
                valid_rec_members.append({
                    "user_id": uid,
                    "user_name": member_obj.get("name", "Team Member"),
                    "role": member_obj.get("team_role", rm.get("role", "DEVELOPER")),
                    "reason": str(rm.get("reason") or f"Matched to {member_obj.get('name')} based on role specialization"),
                    "confidence": float(rm.get("confidence", 0.85)),
                })

        if not valid_rec_members:
            # Assign fallback member based on requirement text
            fallback_member = get_best_fallback_member(req_info, candidate_members)
            if fallback_member:
                valid_rec_members.append(fallback_member)

        sanitized.append({
            "prd_id": prd_id,
            "requirement_id": rid,
            "feature_id": req_info.get("feature_id", rec.get("feature_id", "")),
            "requirement_title": req_info.get("title") or req_info.get("description", "")[:80],
            "requirement_type": rec.get("requirement_type", req_info.get("type", "FUNCTIONAL")),
            "recommended_members": valid_rec_members,
            "status": "PENDING_REVIEW",
        })

    return sanitized


def get_best_fallback_member(requirement: Dict[str, Any], candidate_members: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Determine best fallback member based on keyword heuristics."""
    text = (str(requirement.get("description", "")) + " " + str(requirement.get("title", "")) + " " + str(requirement.get("type", ""))).lower()

    target_role = "DEVELOPER"
    reason = "Requirement requires software engineering implementation"

    if any(k in text for k in ["ui", "ux", "design", "layout", "modal", "button", "theme", "visual", "mockup", "interaction", "screen", "wireframe"]):
        target_role = "PRODUCT_DESIGNER"
        reason = "Requirement includes visual layout, interaction design and UX styling"
    elif any(k in text for k in ["test", "qa", "verify", "validation", "coverage", "edge case", "sla", "performance test", "security audit"]):
        target_role = "QA"
        reason = "Requirement necessitates test validation and acceptance verification"
    elif any(k in text for k in ["business", "stakeholder", "legal", "compliance", "monetization", "revenue", "partner", "roi"]):
        target_role = "STAKEHOLDER"
        reason = "Requirement aligns with commercial metrics and stakeholder business direction"
    elif any(k in text for k in ["scope", "priority", "roadmap", "release schedule", "tradeoff", "governance"]):
        target_role = "PRODUCT_MANAGER"
        reason = "Requirement requires product scope governance and priority alignment"

    # Find member matching target_role
    matched = next((m for m in candidate_members if str(m.get("team_role", "")).upper() == target_role), None)
    if not matched and candidate_members:
        matched = candidate_members[0]

    if matched:
        return {
            "user_id": str(matched.get("user_id") or matched.get("id")),
            "user_name": matched.get("name", "Team Member"),
            "role": matched.get("team_role", target_role),
            "reason": reason,
            "confidence": 0.82,
        }
    return None


def deterministic_assignment_fallback(
    prd_project: Dict[str, Any],
    requirements: List[Dict[str, Any]],
    candidate_members: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Deterministic, resilient offline fallback matching requirements to team members."""
    results = []
    prd_id = prd_project.get("prd_id", "")

    for req in requirements:
        rid = str(req.get("requirement_id") or req.get("id", ""))
        desc = (str(req.get("description", "")) + " " + str(req.get("title", ""))).lower()

        recs = []
        is_designer = any(k in desc for k in ["ui", "ux", "design", "layout", "interaction", "mockup", "screen", "theme", "button"])
        is_dev = any(k in desc for k in ["api", "backend", "database", "endpoint", "query", "logic", "auth", "token", "service", "code", "implementation", "frontend"])
        is_qa = any(k in desc for k in ["test", "qa", "verify", "validation", "criteria", "acceptance", "sla", "latency", "exception", "error handling"])
        is_stakeholder = any(k in desc for k in ["business", "stakeholder", "revenue", "monetization", "compliance", "audit"])
        is_pm = any(k in desc for k in ["scope", "priority", "phase", "roadmap", "decision"])

        # If none matched, default to Developer + QA
        if not (is_designer or is_dev or is_qa or is_stakeholder or is_pm):
            is_dev = True
            is_qa = True

        for role_name, flag, reason, conf in [
            ("PRODUCT_DESIGNER", is_designer, "Requirement contains UI and user experience interaction design work", 0.91),
            ("DEVELOPER", is_dev, "Requirement requires technical software engineering and API/frontend implementation", 0.88),
            ("QA", is_qa, "Requirement requires acceptance criteria testing and edge case validation", 0.86),
            ("STAKEHOLDER", is_stakeholder, "Requirement requires business validation and commercial review", 0.80),
            ("PRODUCT_MANAGER", is_pm, "Requirement requires product scope and roadmap prioritization governance", 0.85),
        ]:
            if flag:
                m = next((cand for cand in candidate_members if str(cand.get("team_role", "")).upper() == role_name), None)
                if m:
                    recs.append({
                        "user_id": str(m.get("user_id") or m.get("id")),
                        "user_name": m.get("name", "Team Member"),
                        "role": role_name,
                        "reason": reason,
                        "confidence": conf,
                    })

        if not recs and candidate_members:
            recs.append({
                "user_id": str(candidate_members[0].get("user_id") or candidate_members[0].get("id")),
                "user_name": candidate_members[0].get("name", "Team Member"),
                "role": candidate_members[0].get("team_role", "DEVELOPER"),
                "reason": "Default requirement assignment for technical evaluation",
                "confidence": 0.75,
            })

        results.append({
            "prd_id": prd_id,
            "requirement_id": rid,
            "feature_id": req.get("feature_id", ""),
            "requirement_title": req.get("title") or req.get("description", "")[:80],
            "requirement_type": "UI_UX" if is_designer else ("BACKEND" if is_dev else "QA_TESTING"),
            "recommended_members": recs,
            "status": "PENDING_REVIEW",
        })

    return results

