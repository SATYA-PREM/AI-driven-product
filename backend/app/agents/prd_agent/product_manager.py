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
- Feature Definitions mapped to all requirements
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
You convert customer problems and technical requirements into an actionable, comprehensive Product Plan.

PM CONSOLIDATED CONTEXT:
{json.dumps(consolidated_context, indent=2)}

AGENT 1 (PROBLEM ANALYSIS):
{json.dumps(problem_analysis, indent=2)}

AGENT 2 (REQUIREMENTS ANALYSIS):
{json.dumps(requirements_analysis, indent=2)}

TASK:
1. Define a clear, strategic Product Objective synthesizing the business impact.
2. Identify Primary and Secondary Target Users with specific persona benefits.
3. Outline the Proposed Solution Architecture.
4. Establish strict Scope Boundaries: explicitly define what is In-Scope and what is Out-of-Scope.
5. Define Features mapped 1:1 or 1:N to every requirement ID in `functional_requirements`.
6. Formulate quantifiable Success Metrics (realistic KPIs with baseline and target SLAs).
7. Identify key Product Risks and practical, concrete mitigations.

JSON OUTPUT STRUCTURE MUST MATCH EXACTLY:
{{
  "product_plan": {{
    "product_objective": "Strategic objective statement.",
    "target_users": [
      {{"role": "Enterprise Product Managers", "type": "primary", "benefit": "Fast automated PRD synthesis and review gate visibility"}},
      {{"role": "Software Engineers", "type": "secondary", "benefit": "Unambiguous requirements with testable acceptance criteria"}}
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
        "priority": "high",
        "reason": "Directly resolves high-friction customer feedback item",
        "status": "planned"
      }}
    ],
    "success_metrics": [
      "90% reduction in user-reported workflow friction within 30 days of release",
      "p95 API response times remain below 450ms across all data queries",
      "Zero unhandled security or permission regression reports"
    ],
    "priorities": [
      {{"item": "Core Remediation Engine", "priority": "P0", "timeline": "Sprint 1-2"}},
      {{"item": "Advanced Capabilities & Automation", "priority": "P1", "timeline": "Sprint 3-4"}}
    ],
    "risks": [
      {{"risk": "Data volume scaling latency during bulk exports", "mitigation": "Implement asynchronous background streaming workers"}},
      {{"risk": "Complex authentication edge cases across federated identity providers", "mitigation": "Enforce strict OIDC/SAML validation and token refresh logic"}}
    ],
    "assumptions": [
      "Target users access the workspace via modern standards-compliant web browsers",
      "Workspace admin permissions are managed through centralized RBAC"
    ]
  }}
}}

Respond ONLY with valid JSON.
"""
            target_model = (settings.GEMINI_MODEL or "").split()[0].strip()
            from app.agents.prd_agent.tools import call_gemini_with_retry
            response = call_gemini_with_retry(
                client=client,
                model=target_model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            data = json.loads(response.text or "{}")
            if "product_plan" in data and data["product_plan"].get("features"):
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
            rid = req.get("requirement_id", f"REQ-{idx:03d}")
            title = req.get("title", f"Feature {idx}").replace("Remediation: ", "").replace("Capability: ", "")
            prio = req.get("priority", "high")

            features.append({
                "feature_id": fid,
                "name": title,
                "description": f"Provides comprehensive implementation of {title.lower()} with end-to-end telemetry and validation.",
                "requirement_ids": [rid],
                "priority": prio,
                "reason": f"Directly addresses {rid} from PM-approved product intelligence package.",
                "status": "planned",
            })

        dataset_name = context.get("dataset_name", "Active Feedback Batch")

        in_scope = [f"Module: {f['name']}" for f in features] + [
            "RBAC Permission Enforcement & Audit Telemetry",
            "Real-time Client-side State Synchronization",
        ]

        out_of_scope = [
            "Third-party legacy tool integration and data migration scripts",
            "Custom on-premise hardware biometric driver customization",
            "Unapproved ad-hoc feature additions outside the PM review package",
        ]

        success_metrics = [
            f"85% reduction in customer friction reports for {dataset_name} within 30 days of release",
            "p95 API response times remain under 450ms across all core endpoints",
            "Zero high-severity permission or security regression vulnerabilities",
            "95% adoption rate among targeted workspace power users within first quarter",
        ]

        risks = [
            {
                "risk": "Large dataset export payload sizes causing browser memory exhaustion",
                "mitigation": "Deploy chunked background streaming workers with progress telemetry.",
            },
            {
                "risk": "Authentication state invalidation during intermittent network drops",
                "mitigation": "Implement resilient offline token caching and silent re-authentication.",
            },
            {
                "risk": "High event volume overwhelming realtime notification dispatch",
                "mitigation": "Use Redis-backed rate-limiting queues and debounced WebSocket broadcasts.",
            },
        ]

        return {
            "product_objective": f"Eliminate operational bottlenecks, resolve customer-reported friction, and deliver high-reliability workflows for {dataset_name}.",
            "target_users": [
                {"role": "Enterprise Product Managers", "type": "primary", "benefit": "Direct alignment of development execution with customer intelligence"},
                {"role": "Software Engineers & Tech Leads", "type": "primary", "benefit": "Unambiguous, verifiable requirements with full source traceability"},
                {"role": "End Users & Analysts", "type": "secondary", "benefit": "Smooth, error-free daily workspace operations and fast data retrieval"},
            ],
            "proposed_solution": f"Deploy modular, permission-aware workflow enhancements with end-to-end telemetry, async task workers, and automated validation for {dataset_name}.",
            "scope": {
                "in_scope": in_scope,
                "out_of_scope": out_of_scope,
            },
            "features": features,
            "success_metrics": success_metrics,
            "priorities": [
                {"item": "Core Remediation & High-Impact Fixes", "priority": "P0", "timeline": "Phase 1 (Sprint 1-2)"},
                {"item": "Advanced Automation & Performance Optimization", "priority": "P1", "timeline": "Phase 2 (Sprint 3-4)"},
            ],
            "risks": risks,
            "assumptions": [
                "Target users access the workspace via modern web browsers with WebSocket support",
                "Workspace authentication provider enforces standard OAuth2/OIDC protocols",
            ],
        }


product_manager_agent = ProductManagerAgent()
