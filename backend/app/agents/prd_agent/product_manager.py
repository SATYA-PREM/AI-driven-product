"""
product_manager.py
------------------
Agent 3: Product Manager Agent
Answers: "What should we build, for whom, why, and within what scope?"
Inputs:
- Consolidated PM Context
- Agent 1 Problem Analysis
- Agent 2 Requirements Analysis
Outputs:
- Product Objective & Value Proposition
- Target Users (Primary, Secondary)
- Proposed Solution Architecture
- Scope Boundaries (In Scope vs Out of Scope)
- Feature Definitions with AI-recommended priorities
- Quantifiable Success Metrics & KPI definitions
- Product Risks & Mitigation Strategies
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ProductManagerAgent:
    """Agent 3: Principal Technical Product Manager."""

    def __init__(self):
        self.role = "Principal Technical Product Manager"
        self.goal = "Define strategic business objectives, target user personas, solution scope (in/out), feature priorities, and success metrics aligned with PM review directives."

    def plan(
        self,
        consolidated_context: Dict[str, Any],
        problem_analysis: Dict[str, Any],
        requirements_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Executes Stage 2 (Product Planning): Converts problems and requirements into a strategic product plan."""
        logger.info(f"Product Manager Agent executing for workspace {consolidated_context.get('workspace_id')}")

        try:
            import google.genai as genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""
You are the Principal Technical Product Manager (Agent 3 of 4 in a CrewAI PRD generation pipeline).
You convert the customer problems and technical requirements into an actionable Product Plan.

PM CONSOLIDATED CONTEXT:
{json.dumps(consolidated_context, indent=2)}

AGENT 1 (PROBLEM ANALYSIS):
{json.dumps(problem_analysis, indent=2)}

AGENT 2 (REQUIREMENTS ANALYSIS):
{json.dumps(requirements_analysis, indent=2)}

TASK:
1. Define a clear, strategic Product Objective.
2. Identify Primary and Secondary Target Users.
3. Outline the Proposed Solution.
4. Establish strict Scope Boundaries: explicitly define what is In-Scope and what is Out-of-Scope (e.g. legacy migrations or unrelated feature requests are out-of-scope).
5. Define Features mapped to requirement IDs, including AI-recommended priorities and rationales.
6. Formulate Success Metrics (measurable criteria, not fabricated numbers).
7. Identify key Product Risks and practical mitigations.

JSON OUTPUT STRUCTURE MUST MATCH EXACTLY:
{{
  "product_plan": {{
    "product_objective": "Strategic objective statement.",
    "target_users": [
      {{"role": "Enterprise Analysts", "type": "primary", "benefit": "Fast automated data extraction"}},
      {{"role": "Product Managers", "type": "secondary", "benefit": "Clear visibility into feedback impact"}}
    ],
    "proposed_solution": "Architecture and workflow description of the solution.",
    "scope": {{
      "in_scope": ["Feature capability 1", "Feature capability 2", "Permission validation"],
      "out_of_scope": ["Third-party legacy export formats", "Custom ad-hoc BI dashboarding"]
    }},
    "features": [
      {{
        "feature_id": "FEAT-001",
        "name": "Feature Name",
        "description": "Description of feature capability",
        "requirement_ids": ["REQ-001"],
        "ai_recommended_priority": "high",
        "reason": "Directly resolves highest-frequency customer friction point",
        "status": "planned"
      }}
    ],
    "success_metrics": [
      "15% reduction in friction reports within 30 days of release",
      "95% adoption rate among targeted enterprise user accounts",
      "Zero high-severity security or permission regression reports"
    ],
    "priorities": [
      {{"item": "Core Remediation Engine", "priority": "P0", "timeline": "Sprint 1-2"}},
      {{"item": "Advanced Feature Capabilities", "priority": "P1", "timeline": "Sprint 3-4"}}
    ],
    "risks": [
      {{"risk": "Data volume scaling latency during bulk export", "mitigation": "Implement asynchronous chunked streaming"}},
      {{"risk": "Complex permission edge cases across workspaces", "mitigation": "Strict RBAC middleware and audit logging"}}
    ],
    "assumptions": [
      "Target users have standard browser and network connectivity",
      "Workspace admin permissions are managed via existing auth provider"
    ]
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
            if "product_plan" in data:
                return data["product_plan"]
            return self._fallback(consolidated_context, problem_analysis, requirements_analysis)

        except Exception as e:
            logger.warning(f"Product Manager Agent LLM execution failed: {e}. Using deterministic fallback.")
            return self._fallback(consolidated_context, problem_analysis, requirements_analysis)

    def _fallback(
        self,
        context: Dict[str, Any],
        problem_analysis: Dict[str, Any],
        requirements_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Deterministic product plan synthesis fallback."""
        fn_reqs = requirements_analysis.get("functional_requirements") or []
        features: List[Dict[str, Any]] = []

        for idx, req in enumerate(fn_reqs, start=1):
            fid = f"FEAT-{idx:03d}"
            features.append({
                "feature_id": fid,
                "name": f"Module: {req.get('title', 'Feature Module')}",
                "description": req.get("description", "Core capability implementing requirement."),
                "requirement_ids": [req.get("requirement_id", f"REQ-{idx:03d}")],
                "ai_recommended_priority": req.get("priority", "high"),
                "reason": "Directly maps to PM-approved requirement and customer evidence",
                "status": "planned",
            })

        if not features:
            features.append({
                "feature_id": "FEAT-001",
                "name": "Customer Friction Remediation Suite",
                "description": "Comprehensive feature package addressing high-impact customer pain points.",
                "requirement_ids": ["REQ-001"],
                "ai_recommended_priority": "high",
                "reason": "Derived from approved PM Review package",
                "status": "planned",
            })

        return {
            "product_objective": f"Eliminate operational bottlenecks and deliver enhanced workflows for {context.get('dataset_name', 'Feedback Collection')}.",
            "target_users": [
                {"role": "Enterprise Product Managers", "type": "primary", "benefit": "Structured feedback synthesis and backlog alignment"},
                {"role": "Software Engineers", "type": "secondary", "benefit": "Clear acceptance criteria and requirement traceability"},
                {"role": "End Users", "type": "primary", "benefit": "Seamless product workflows without friction"},
            ],
            "proposed_solution": "Deploy modular, permission-aware workflow enhancements with end-to-end telemetry and automated validation.",
            "scope": {
                "in_scope": [f["name"] for f in features] + ["RBAC Permission Enforcement", "Audit Telemetry"],
                "out_of_scope": ["Third-party legacy tool integration", "Custom on-premise hardware drivers"],
            },
            "features": features,
            "success_metrics": [
                "15% reduction in customer support tickets related to core friction points",
                "99.9% uptime with < 500ms p95 API response times",
                "> 80% satisfaction score in post-release customer feedback",
            ],
            "priorities": [
                {"item": "Core System Remediation", "priority": "P0", "timeline": "Phase 1"},
                {"item": "Feature Enhancements", "priority": "P1", "timeline": "Phase 2"},
            ],
            "risks": [
                {"risk": "Data latency during concurrent operations", "mitigation": "Implement caching and optimized index queries"},
                {"risk": "Scope creep during implementation", "mitigation": "Strict adherence to Phase 1 in-scope boundaries"},
            ],
            "assumptions": [
                "User adoption will follow existing engagement patterns",
                "Backend services maintain backwards compatibility with existing APIs",
            ],
        }


product_manager_agent = ProductManagerAgent()
