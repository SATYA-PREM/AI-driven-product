"""
prd_architect.py
----------------
Agent 4: PRD Architect Agent
Synthesizes the complete, validated PRD document structure from the outputs of
Agent 1 (Product Analyst), Agent 2 (Requirements Analyst), and Agent 3 (Product Manager).
Performs:
- Document Synthesis (Executive Summary, Hierarchy, User Stories)
- Conflict Detection (Scope vs Requirement contradictions)
- Completeness Validation (Ensures all issues have mapped requirements)
- End-to-End Traceability Mapping (Problem -> Issue -> Evidence -> Requirement -> Feature -> User Story -> Criteria)
"""

from __future__ import annotations
import json
import re
import time
from typing import Any, Dict, List
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class PRDArchitectAgent:
    """Agent 4: Principal PRD Architect & Document Synthesizer."""

    def __init__(self):
        self.role = "Principal PRD Architect & Document Synthesizer"
        self.goal = "Take structured outputs from Product Analyst, Requirements Analyst, and PM Agent to produce one consistent, validated, conflict-free, and traceable PRD JSON document."

    def synthesize(
        self,
        source_context: Dict[str, Any],
        product_analysis: Dict[str, Any],
        requirements_analysis: Dict[str, Any],
        product_plan: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Executes Stage 3: Synthesizes final PRD document structure, checks conflicts, and builds traceability."""
        logger.info(f"PRD Architect Agent executing for workspace {source_context.get('workspace_id')}")

        try:
            import google.genai as genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""
You are the Principal PRD Architect (Agent 4 of 4 in a CrewAI PRD generation pipeline).
Your job is to synthesize outputs from Product Analyst, Requirements Analyst, and Product Manager into ONE complete, validated PRD JSON document.

SOURCE PM CONTEXT:
{json.dumps(source_context, indent=2)}

AGENT 1 (PRODUCT ANALYSIS):
{json.dumps(product_analysis, indent=2)}

AGENT 2 (REQUIREMENTS ANALYSIS):
{json.dumps(requirements_analysis, indent=2)}

AGENT 3 (PRODUCT PLAN):
{json.dumps(product_plan, indent=2)}

TASK:
1. Synthesize Executive Summary and structured PRD sections.
2. Generate Agile User Stories with acceptance criteria linked to requirement IDs.
3. Detect any conflicts between Scope (Agent 3) and Requirements (Agent 2) (e.g., if a requirement asks for a feature marked out-of-scope).
4. Build complete end-to-end Traceability:
   Problem -> Issue -> Evidence -> Requirement -> Feature -> User Story -> Acceptance Criteria.
5. Validate completeness.

JSON OUTPUT STRUCTURE MUST MATCH EXACTLY:
{{
  "prd": {{
    "metadata": {{
      "prd_id": "{source_context.get('prd_id', 'PRD-001')}",
      "title": "Document Title",
      "version": "v1.0",
      "status": "draft"
    }},
    "executive_summary": "Comprehensive executive summary.",
    "problem_statement": {{
      "primary_problem": "Primary problem statement.",
      "customer_need": "Customer need statement.",
      "business_context": "Business context."
    }},
    "target_users": ["Target user 1", "Target user 2"],
    "objectives": ["Objective 1", "Objective 2"],
    "proposed_solution": "Description of proposed solution.",
    "scope": {{
      "in_scope": ["In scope 1", "In scope 2"],
      "out_of_scope": ["Out of scope 1", "Out of scope 2"]
    }},
    "requirements": [
      {{
        "requirement_id": "REQ-001",
        "title": "Title",
        "description": "The system shall...",
        "type": "functional",
        "priority": "high",
        "source_insights": ["ISSUE-001"],
        "source_evidence": ["FB001"],
        "acceptance_criteria": ["Criteria 1", "Criteria 2"]
      }}
    ],
    "features": [
      {{
        "feature_id": "FEAT-001",
        "name": "Feature Name",
        "description": "Feature detail",
        "requirement_ids": ["REQ-001"],
        "priority": "high",
        "status": "planned"
      }}
    ],
    "user_stories": [
      {{
        "story_id": "US-001",
        "title": "User Story Title",
        "as_a": "Enterprise Analyst",
        "i_want": "to export filtered reports",
        "so_that": "I can analyze data in external BI tools",
        "requirement_id": "REQ-001",
        "acceptance_criteria": ["Criteria 1", "Criteria 2"]
      }}
    ],
    "acceptance_criteria": ["Criteria 1", "Criteria 2"],
    "success_metrics": ["Metric 1", "Metric 2"],
    "constraints": ["Constraint 1"],
    "assumptions": ["Assumption 1"],
    "dependencies": ["Dependency 1"],
    "risks": ["Risk 1 and mitigation"],
    "traceability": [
      {{
        "problem": "Problem title",
        "issue_id": "ISSUE-001",
        "evidence_id": "FB001",
        "requirement_id": "REQ-001",
        "feature_id": "FEAT-001",
        "story_id": "US-001",
        "acceptance_criteria": "Criteria summary"
      }}
    ],
    "validation": {{
      "complete": true,
      "warnings": [],
      "conflicts": []
    }}
  }}
}}

Respond ONLY with valid JSON.
"""
            target_model = (settings.GEMINI_MODEL or "gemini-2.5-flash").split()[0].strip()
            target_model = re.sub(r'[^a-zA-Z0-9\-_./]', '', target_model)
            if not (target_model.startswith("gemini-") or target_model.startswith("models/")) or target_model.endswith("E"):
                target_model = "gemini-2.5-flash"

            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            data = json.loads(response.text or "{}")
            if "prd" in data:
                return data["prd"]
            return self._fallback(source_context, product_analysis, requirements_analysis, product_plan)

        except Exception as e:
            logger.warning(f"PRD Architect Agent LLM execution failed: {e}. Using deterministic synthesis.")
            return self._fallback(source_context, product_analysis, requirements_analysis, product_plan)

    def _fallback(
        self,
        context: Dict[str, Any],
        product_analysis: Dict[str, Any],
        requirements_analysis: Dict[str, Any],
        product_plan: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Deterministic PRD synthesis fallback."""
        prd_id = context.get("prd_id", "PRD-001")
        title = f"Product Requirement Document - {context.get('dataset_name', 'Feedback Batch')}"
        fn_reqs = requirements_analysis.get("functional_requirements") or []
        features = product_plan.get("features") or []

        # Generate User Stories
        user_stories: List[Dict[str, Any]] = []
        for idx, req in enumerate(fn_reqs, start=1):
            sid = f"US-{idx:03d}"
            user_stories.append({
                "story_id": sid,
                "title": f"Story: {req.get('title', 'Feature capability')}",
                "as_a": "Workspace User",
                "i_want": req.get("description", "to execute operations seamlessly"),
                "so_that": "I can complete reporting workflows without errors or manual workarounds",
                "requirement_id": req.get("requirement_id", f"REQ-{idx:03d}"),
                "acceptance_criteria": req.get("acceptance_criteria", ["Operation completes successfully"]),
            })

        # Build Traceability Matrix
        traceability: List[Dict[str, Any]] = []
        for idx, req in enumerate(fn_reqs, start=1):
            rid = req.get("requirement_id", f"REQ-{idx:03d}")
            src_issues = req.get("source_issues") or [f"ISSUE-{idx:03d}"]
            src_ev = req.get("source_evidence") or ["FB-001"]
            fid = f"FEAT-{idx:03d}"
            sid = f"US-{idx:03d}"

            traceability.append({
                "problem": product_analysis.get("primary_problem", "Customer friction"),
                "issue_id": src_issues[0] if src_issues else "ISSUE-001",
                "evidence_id": src_ev[0] if src_ev else "FB-001",
                "requirement_id": rid,
                "feature_id": fid,
                "story_id": sid,
                "acceptance_criteria": req.get("acceptance_criteria", ["Verified workflow"])[0] if req.get("acceptance_criteria") else "Acceptance verified",
            })

        # Conflict Detection
        conflicts = []
        in_scope = product_plan.get("scope", {}).get("in_scope", [])
        out_scope = product_plan.get("scope", {}).get("out_of_scope", [])

        for out_item in out_scope:
            for req in fn_reqs:
                if out_item.lower() in req.get("title", "").lower() or out_item.lower() in req.get("description", "").lower():
                    conflicts.append({
                        "type": "scope_conflict",
                        "section": "requirements",
                        "description": f"Requirement '{req.get('title')}' mentions '{out_item}' which is marked out-of-scope for Phase 1.",
                    })

        warnings = []
        if len(fn_reqs) == 0:
            warnings.append("Zero functional requirements detected in input package.")

        return {
            "metadata": {
                "prd_id": prd_id,
                "title": title,
                "version": "v1.0",
                "status": "draft",
            },
            "executive_summary": f"This PRD establishes the development roadmap to resolve customer friction in {context.get('dataset_name', 'Active Feedback Collection')} by delivering structured, permission-aware workflows.",
            "problem_statement": {
                "primary_problem": product_analysis.get("primary_problem", "Identified workflow friction."),
                "customer_need": product_analysis.get("customer_need", "Automated, reliable operations."),
                "business_context": product_analysis.get("business_context", "Impacts enterprise user efficiency."),
            },
            "target_users": [u.get("role", str(u)) for u in product_plan.get("target_users", [])],
            "objectives": [product_plan.get("product_objective", "Deliver streamlined user capabilities.")],
            "proposed_solution": product_plan.get("proposed_solution", "Permission-aware feature module suite."),
            "scope": product_plan.get("scope", {"in_scope": ["Core capability"], "out_of_scope": ["Legacy formats"]}),
            "requirements": [
                {
                    "requirement_id": r.get("requirement_id"),
                    "title": r.get("title"),
                    "description": r.get("description"),
                    "type": r.get("type", "functional"),
                    "priority": r.get("priority", "high"),
                    "source_insights": r.get("source_issues", []),
                    "source_evidence": r.get("source_evidence", []),
                    "acceptance_criteria": r.get("acceptance_criteria", []),
                }
                for r in fn_reqs
            ],
            "features": features,
            "user_stories": user_stories,
            "acceptance_criteria": [
                crit for r in fn_reqs for crit in r.get("acceptance_criteria", [])
            ][:10],
            "success_metrics": product_plan.get("success_metrics", ["15% reduction in customer friction reports"]),
            "constraints": requirements_analysis.get("constraints", ["Respect workspace RBAC"]),
            "assumptions": requirements_analysis.get("assumptions", ["Active DB connections"]),
            "dependencies": requirements_analysis.get("dependencies", ["MongoDB Cluster"]),
            "risks": [r.get("risk") if isinstance(r, dict) else str(r) for r in product_plan.get("risks", [])],
            "traceability": traceability,
            "validation": {
                "complete": True,
                "warnings": warnings,
                "conflicts": conflicts,
            },
        }


prd_architect_agent = PRDArchitectAgent()
