"""
requirements_analyst.py
-----------------------
Agent 2: Requirements Analyst Agent
Answers: "What must the product do to solve the identified problem?"
Inputs:
- Consolidated PM Context
- Agent 1 Problem Analysis
Outputs:
- Functional Requirements (with acceptance criteria)
- Non-Functional Requirements (security, performance, permissions)
- Constraints & Assumptions
- System Dependencies
- Requirement Traceability mapping
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RequirementsAnalystAgent:
    """Agent 2: Lead Technical Requirements Analyst."""

    def __init__(self):
        self.role = "Lead Technical Requirements Analyst"
        self.goal = "Decompose customer friction and feature opportunities into precise, testable, and evidence-backed functional & non-functional requirements with acceptance criteria and traceability."

    def analyze(
        self,
        consolidated_context: Dict[str, Any],
        problem_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Executes Stage 2 (Requirements): Generates requirements from PM context + Agent 1 output."""
        logger.info(f"Requirements Analyst Agent executing for workspace {consolidated_context.get('workspace_id')}")

        try:
            import google.genai as genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""
You are the Lead Technical Requirements Analyst (Agent 2 of 4 in a CrewAI PRD generation pipeline).
You formulate functional and non-functional requirements based on the PM Context AND the Problem Analysis from Agent 1.

PM CONSOLIDATED CONTEXT:
{json.dumps(consolidated_context, indent=2)}

AGENT 1 (PROBLEM ANALYSIS):
{json.dumps(problem_analysis, indent=2)}

TASK:
1. Formulate precise Functional Requirements (FR) with acceptance criteria.
2. Formulate Non-Functional Requirements (NFR) covering performance, security, permissions, reliability.
3. Identify system constraints and separate assumptions from facts.
4. Identify technical dependencies.
5. Create explicit requirement traceability linking each requirement to source issues, opportunities, and evidence records.

JSON OUTPUT STRUCTURE MUST MATCH EXACTLY:
{{
  "requirements_analysis": {{
    "functional_requirements": [
      {{
        "requirement_id": "REQ-001",
        "title": "Title of functional requirement",
        "description": "The system shall...",
        "type": "functional",
        "priority": "high",
        "acceptance_criteria": ["Criteria 1", "Criteria 2"],
        "source_issues": ["ISSUE-001"],
        "source_opportunities": ["OPP-001"],
        "source_evidence": ["FB001", "FB023"]
      }}
    ],
    "non_functional_requirements": [
      {{
        "requirement_id": "NFR-001",
        "title": "Performance / Security requirement",
        "description": "The system must ensure...",
        "type": "non_functional",
        "category": "performance",
        "target_metric": "< 500ms p95 latency"
      }}
    ],
    "constraints": ["Constraint 1: Workspace permission enforcement", "Constraint 2: Rate limit compliance"],
    "assumptions": ["Assumption 1: Core intelligence API is reachable", "Assumption 2: Structured data is pre-validated"],
    "dependencies": ["Reporting Service", "Authentication Gateway", "MongoDB Database Cluster"],
    "requirement_traceability": [
      {{
        "requirement_id": "REQ-001",
        "source_issues": ["ISSUE-001"],
        "source_evidence": ["FB001"]
      }}
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
            if "requirements_analysis" in data:
                return data["requirements_analysis"]
            return self._fallback(consolidated_context, problem_analysis)

        except Exception as e:
            logger.warning(f"Requirements Analyst LLM execution failed: {e}. Using deterministic fallback.")
            return self._fallback(consolidated_context, problem_analysis)

    def _fallback(self, context: Dict[str, Any], problem_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic requirements synthesis fallback."""
        issues = context.get("approved_issues") or []
        opps = context.get("approved_opportunities") or []

        fn_reqs: List[Dict[str, Any]] = []
        traceability: List[Dict[str, Any]] = []

        for idx, iss in enumerate(issues, start=1):
            rid = f"REQ-{idx:03d}"
            ev = iss.get("evidence_record_ids", [])
            fn_reqs.append({
                "requirement_id": rid,
                "title": f"Remediation for {iss.get('title', 'Customer Issue')}",
                "description": f"The system shall {iss.get('recommended_action') or iss.get('problem_description', 'resolve identified friction point.')}",
                "type": "functional",
                "priority": (iss.get("customer_impact") or "high").lower(),
                "acceptance_criteria": [
                    f"System correctly processes requests without failing on {iss.get('title')}",
                    "User interface provides clear feedback on operation completion",
                ],
                "source_issues": [iss.get("issue_id", f"ISSUE-{idx:03d}")],
                "source_opportunities": [],
                "source_evidence": ev[:3],
            })
            traceability.append({
                "requirement_id": rid,
                "source_issues": [iss.get("issue_id", f"ISSUE-{idx:03d}")],
                "source_evidence": ev[:3],
            })

        for idx, opp in enumerate(opps, start=len(issues) + 1):
            rid = f"REQ-{idx:03d}"
            fn_reqs.append({
                "requirement_id": rid,
                "title": f"Capability: {opp.get('title', 'Feature Opportunity')}",
                "description": f"The system shall provide {opp.get('description', 'enhanced functionality requested by users.')}",
                "type": "functional",
                "priority": (opp.get("priority") or "medium").lower(),
                "acceptance_criteria": [
                    "Capability is accessible from the main workspace toolbar",
                    "User permissions are verified before executing operation",
                ],
                "source_issues": [],
                "source_opportunities": [opp.get("opportunity_id", f"OPP-{idx:03d}")],
                "source_evidence": [],
            })
            traceability.append({
                "requirement_id": rid,
                "source_issues": [],
                "source_evidence": [],
            })

        if not fn_reqs:
            fn_reqs.append({
                "requirement_id": "REQ-001",
                "title": "Automated Workflow Friction Remediation",
                "description": "The system shall streamline core user operations and eliminate recurring customer friction.",
                "type": "functional",
                "priority": "high",
                "acceptance_criteria": [
                    "User workflows complete within target SLA",
                    "Zero uncaught validation exceptions during execution",
                ],
                "source_issues": ["ISSUE-001"],
                "source_opportunities": [],
                "source_evidence": ["FB-001"],
            })
            traceability.append({
                "requirement_id": "REQ-001",
                "source_issues": ["ISSUE-001"],
                "source_evidence": ["FB-001"],
            })

        nfr_reqs = [
            {
                "requirement_id": "NFR-001",
                "title": "Workspace Permission Enforcement",
                "description": "All data export and remediation operations must strictly respect workspace RBAC permissions.",
                "type": "non_functional",
                "category": "security",
                "target_metric": "100% permission check coverage",
            },
            {
                "requirement_id": "NFR-002",
                "title": "API Response & Processing Latency",
                "description": "All interactive endpoints must respond within 500ms p95 under standard load.",
                "type": "non_functional",
                "category": "performance",
                "target_metric": "< 500ms p95 latency",
            },
        ]

        return {
            "functional_requirements": fn_reqs,
            "non_functional_requirements": nfr_reqs,
            "constraints": [
                "Only authorized workspace users may initiate batch actions",
                "Must operate over existing MongoDB collections without schema destruction",
            ],
            "assumptions": [
                "User permissions are populated in active session context",
                "Feedback records have passed ingestion validation",
            ],
            "dependencies": [
                "Authentication Service",
                "MongoDB Product Intelligence Collections",
                "Gemini AI Pipeline Client",
            ],
            "requirement_traceability": traceability,
        }


requirements_analyst_agent = RequirementsAnalystAgent()
