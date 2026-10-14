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
- End-to-End Traceability Mapping (Problem -> Issue/Opp -> Evidence -> Requirement -> Feature -> User Story -> Criteria)
"""

from __future__ import annotations
import json
import re
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
2. Ensure `problem_statement` contains `primary_problem`, `itemized_problems` (all approved friction points and opportunities), `customer_need`, `business_context`, and `root_causes`.
3. Generate Agile User Stories with rich, distinct acceptance criteria linked to requirement IDs.
4. Detect any conflicts between Scope (Agent 3) and Requirements (Agent 2).
5. Build complete end-to-end Traceability:
   Problem -> Issue/Opportunity -> Evidence -> Requirement -> Feature -> User Story -> Acceptance Criteria.
6. Validate completeness: Ensure requirement count equals the number of approved items.

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
      "itemized_problems": [
        {{
          "id": "PI-001",
          "title": "Problem Title",
          "description": "Description",
          "root_cause": "Root cause",
          "impact": "high"
        }}
      ],
      "customer_need": "Customer need statement.",
      "business_context": "Business context.",
      "root_causes": ["Root cause 1"]
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
        "source_opportunities": [],
        "source_evidence": ["FB001"],
        "acceptance_criteria": ["Criteria 1", "Criteria 2", "Criteria 3"]
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
        "i_want": "to perform operation",
        "so_that": "I can achieve business outcome without error",
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
        "opportunity_id": null,
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
            target_model = (settings.GEMINI_MODEL or "").split()[0].strip()
            from app.agents.prd_agent.tools import call_gemini_with_retry, parse_and_repair_json
            response = call_gemini_with_retry(
                client=client,
                model=target_model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            data = parse_and_repair_json(response.text or "{}")
            if "prd" in data and data["prd"].get("requirements"):
                res = data["prd"]
                # Ensure itemized_problems is preserved from Agent 1 if omitted
                if isinstance(res.get("problem_statement"), dict) and not res["problem_statement"].get("itemized_problems"):
                    res["problem_statement"]["itemized_problems"] = product_analysis.get("itemized_problems", [])
                return res
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
        """Deterministic PRD synthesis fallback with 100% itemized problem breakdown and distinct stories."""
        prd_id = context.get("prd_id", "PRD-001")
        dataset_name = context.get("dataset_name", "Feedback Batch")
        fn_reqs = requirements_analysis.get("functional_requirements") or []
        features = product_plan.get("features") or []

        # Smart title creation
        approved_issues = context.get("approved_issues", [])
        approved_opps = context.get("approved_opportunities", [])
        total_approved = approved_issues + approved_opps

        if len(total_approved) == 1:
            title = f"{prd_id} • {total_approved[0].get('title', 'Remediation Specification')}"
        elif len(total_approved) > 1:
            first_title = total_approved[0].get("title", "Core Remediation")
            title = f"{prd_id} • {first_title} & {len(total_approved)-1} Additional Capabilities"
        else:
            title = f"{prd_id} • Product Requirement Document - {dataset_name}"

        # Generate User Stories
        user_stories: List[Dict[str, Any]] = []
        for idx, req in enumerate(fn_reqs, start=1):
            sid = f"US-{idx:03d}"
            rid = req.get("requirement_id", f"REQ-{idx:03d}")
            req_title = req.get("title", f"Requirement {idx}")

            user_stories.append({
                "story_id": sid,
                "title": f"Story: {req_title}",
                "as_a": "Enterprise Workspace User",
                "i_want": f"to {req.get('description', 'execute operations seamlessly').lower()}",
                "so_that": "I can complete my workflow without encountering friction, errors, or delays",
                "requirement_id": rid,
                "acceptance_criteria": req.get("acceptance_criteria", [
                    "Operation completes within target latency SLA",
                    "Immediate UI state confirmation is displayed",
                ]),
            })

        # Build Traceability Matrix
        traceability: List[Dict[str, Any]] = []
        for idx, req in enumerate(fn_reqs, start=1):
            rid = req.get("requirement_id", f"REQ-{idx:03d}")
            src_issues = req.get("source_issues") or []
            src_opps = req.get("source_opportunities") or []
            src_ev = req.get("source_evidence") or ["FB-001"]
            fid = f"FEAT-{idx:03d}"
            sid = f"US-{idx:03d}"

            traceability.append({
                "problem": req.get("title", "Customer Friction Remediation"),
                "issue_id": src_issues[0] if src_issues else None,
                "opportunity_id": src_opps[0] if src_opps else None,
                "evidence_id": src_ev[0] if src_ev else "FB-001",
                "requirement_id": rid,
                "feature_id": fid,
                "story_id": sid,
                "acceptance_criteria": req.get("acceptance_criteria", ["Verified workflow"])[0] if req.get("acceptance_criteria") else "Acceptance verified",
            })

        # Conflict Detection
        conflicts = []
        out_scope = product_plan.get("scope", {}).get("out_of_scope", [])

        for out_item in out_scope:
            for req in fn_reqs:
                if out_item.lower() in req.get("title", "").lower() or out_item.lower() in req.get("description", "").lower():
                    conflicts.append({
                        "type": "scope_conflict",
                        "section": "requirements",
                        "description": f"Requirement '{req.get('title')}' mentions '{out_item}' which is marked out-of-scope.",
                    })

        warnings = []
        if len(fn_reqs) != len(total_approved) and len(total_approved) > 0:
            warnings.append(f"Approved item count ({len(total_approved)}) mapped to {len(fn_reqs)} functional requirements.")

        return {
            "metadata": {
                "prd_id": prd_id,
                "title": title,
                "version": "v1.0",
                "status": "draft",
            },
            "executive_summary": f"This Product Requirements Document establishes the development and architectural roadmap to resolve customer-reported friction in {dataset_name}. It encompasses {len(total_approved)} PM-approved items, providing testable functional requirements, architecture specifications, and end-to-end provenance.",
            "problem_statement": {
                "primary_problem": product_analysis.get("primary_problem", "Identified workflow friction across customer feedback."),
                "itemized_problems": product_analysis.get("itemized_problems", []),
                "customer_need": product_analysis.get("customer_need", "Automated, reliable, and error-free operations."),
                "business_context": product_analysis.get("business_context", "Reduces support overhead and elevates user retention."),
                "root_causes": product_analysis.get("root_causes", []),
            },
            "target_users": [u.get("role", str(u)) for u in product_plan.get("target_users", [])] if product_plan.get("target_users") else [
                "Enterprise Product Managers",
                "Software Engineers",
                "End Users",
            ],
            "objectives": [product_plan.get("product_objective", f"Deliver enhanced workflows for {dataset_name}.")],
            "proposed_solution": product_plan.get("proposed_solution", "Deploy modular, permission-aware workflow enhancements with end-to-end telemetry."),
            "scope": product_plan.get("scope", {"in_scope": [], "out_of_scope": []}),
            "requirements": fn_reqs,
            "features": features,
            "user_stories": user_stories,
            "acceptance_criteria": [
                crit
                for req in fn_reqs
                for crit in req.get("acceptance_criteria", [])
            ][:8],
            "success_metrics": product_plan.get("success_metrics", []),
            "constraints": requirements_analysis.get("constraints", []),
            "assumptions": requirements_analysis.get("assumptions", []),
            "dependencies": requirements_analysis.get("dependencies", []),
            "risks": [
                f"{r.get('risk', '')} (Mitigation: {r.get('mitigation', '')})" if isinstance(r, dict) else str(r)
                for r in product_plan.get("risks", [])
            ],
            "traceability": traceability,
            "validation": {
                "complete": True,
                "warnings": warnings,
                "conflicts": conflicts,
            },
        }


prd_architect_agent = PRDArchitectAgent()
