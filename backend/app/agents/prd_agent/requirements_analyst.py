"""
requirements_analyst.py
-----------------------
Agent 2: Requirements Analyst Agent
Answers: "What must the product do to solve the identified problem?"
Inputs:
- Consolidated PM Context
- Agent 1 Problem Analysis
Outputs:
- Functional Requirements with distinct, testable acceptance criteria
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
        self.goal = "Decompose customer friction and feature opportunities into precise, testable, and evidence-backed functional & non-functional requirements with rich, distinct acceptance criteria and traceability."

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
1. Formulate precise Functional Requirements (FR) STRICTLY and ONLY for the approved items in `approved_issues` and `approved_opportunities` in the PM context.
2. For N approved items, create exactly N functional requirements (REQ-001 to REQ-00N) mapping 1:1 to each approved item.
3. CRITICAL: Each functional requirement MUST contain 3 to 4 distinct, domain-specific, testable Acceptance Criteria.
   - Do NOT produce repetitive, generic sentences (e.g. never repeat "System correctly processes requests without failing on...").
   - Criteria must include clear preconditions, expected behavior, specific error handling, and measurable metrics (e.g. latency targets, UI status indicators, validation states).
4. Formulate Non-Functional Requirements (NFR) covering performance, security, permissions, reliability.
5. Identify system constraints and separate assumptions from facts.
6. Identify technical dependencies.
7. Create explicit requirement traceability linking each requirement to source issues, opportunities, and evidence records.

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
        "acceptance_criteria": [
          "Given valid user credentials, the system shall authenticate via SSO within 500ms and persist the session token.",
          "When an invalid token is provided, the UI shall display a clear error message and redirect to the re-authentication prompt.",
          "Biometric credentials must be securely stored using OS keychain / WebAuthn standard with zero cleartext transmission."
        ],
        "source_issues": ["ISSUE-001"],
        "source_opportunities": [],
        "source_evidence": ["FB001", "FB023"]
      }}
    ],
    "non_functional_requirements": [
      {{
        "requirement_id": "NFR-001",
        "title": "API Response Latency SLA",
        "description": "The system must ensure p95 API response times remain below 450ms under peak load.",
        "type": "non_functional",
        "category": "performance",
        "target_metric": "< 450ms p95 latency"
      }}
    ],
    "constraints": ["Constraint 1: Workspace permission enforcement", "Constraint 2: Rate limit compliance"],
    "assumptions": ["Assumption 1: Core intelligence API is reachable", "Assumption 2: Structured data is pre-validated"],
    "dependencies": ["Reporting Service", "Authentication Gateway", "MongoDB Database Cluster"],
    "requirement_traceability": [
      {{
        "requirement_id": "REQ-001",
        "source_issues": ["ISSUE-001"],
        "source_opportunities": [],
        "source_evidence": ["FB001"]
      }}
    ]
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
            if "requirements_analysis" in data and data["requirements_analysis"].get("functional_requirements"):
                return data["requirements_analysis"]
            return self._fallback(consolidated_context, problem_analysis)

        except Exception as e:
            logger.warning(f"Requirements Analyst LLM execution failed: {e}. Using deterministic fallback.")
            return self._fallback(consolidated_context, problem_analysis)

    def _generate_tailored_criteria(self, title: str, item_type: str = "issue") -> List[str]:
        """Generates distinct, rich, testable acceptance criteria based on title semantics."""
        title_lower = title.lower()

        if "auth" in title_lower or "sso" in title_lower or "biometric" in title_lower:
            return [
                "Users can authenticate seamlessly via SAML 2.0 / OIDC identity providers with auto-provisioned sessions.",
                "Biometric credentials (WebAuthn / TouchID) validate in under 300ms with secure hardware key exchange.",
                "Session state is securely cached and auto-refreshed without disrupting active user workspace navigation.",
                "Graceful fallback to standard email OTP occurs if biometric hardware verification fails or is unsupported.",
            ]
        elif "latency" in title_lower or "load" in title_lower or "performance" in title_lower:
            return [
                "Dashboard and report tables render data payloads within 450ms p95 latency under dataset sizes up to 100k rows.",
                "Heavy calculation queries execute asynchronously with real-time UI skeleton loaders and optimistic updates.",
                "Client-side in-memory cache prevents redundant API roundtrips during tab switching and filter adjustments.",
                "System gracefully handles bandwidth throttling with adaptive chunking and compression.",
            ]
        elif "export" in title_lower or "report" in title_lower or "failure" in title_lower:
            return [
                "Export requests (CSV, PDF, JSON) process through an asynchronous background queue with real-time progress percentage.",
                "Generated export files are validated for schema completeness and delivered via secure signed download links.",
                "Automatic retry with exponential backoff triggers if a transient rendering or disk I/O error occurs.",
                "Users receive an in-app notification and email confirmation once bulk exports exceeding 10MB are ready.",
            ]
        elif "notification" in title_lower or "alert" in title_lower:
            return [
                "Critical system alerts deliver to the workspace notification center within 1.5 seconds of trigger event.",
                "Users can configure granular alert preferences (Email, In-App, Slack webhook) by severity category.",
                "Unread notification badge counters update synchronously across open browser tabs via WebSocket events.",
                "Failed webhook deliveries automatically retry up to 3 times with dead-letter queue logging for audit inspection.",
            ]
        elif "upload" in title_lower or "import" in title_lower or "validation" in title_lower:
            return [
                "File upload widget provides instant client-side MIME type and size validation before initiating transmission.",
                "Multipart chunked upload supports resumability in the event of temporary network disconnections.",
                "Detailed schema error feedback highlights specific invalid rows and column headers with actionable guidance.",
                "Uploaded datasets process and index into search collections within 3 seconds of upload completion.",
            ]
        elif "search" in title_lower or "filter" in title_lower:
            return [
                "Search query execution returns ranked results within 200ms with highlighted keyword matching.",
                "Multi-facet filtering supports simultaneous combination of date ranges, tags, status, and authors.",
                "Search state is preserved in URL query parameters allowing seamless bookmarking and sharing.",
                "Zero-result queries offer intelligent typo correction and related search suggestions.",
            ]
        elif "permission" in title_lower or "role" in title_lower or "rbac" in title_lower:
            return [
                "Granular role-based access control (Admin, Editor, Viewer) is enforced at both API gateway and UI levels.",
                "Unauthorized action attempts return structured 403 Forbidden errors with clear permission elevation instructions.",
                "Permission changes take effect immediately across all active user sessions without requiring re-login.",
                "All administrative permission changes generate immutable audit log records with actor timestamps.",
            ]
        else:
            return [
                f"The system provides complete functional capability for {title} aligned with user specifications.",
                "All user actions provide immediate visual confirmation and deterministic state updates.",
                "Input validation prevents malformed data submissions with inline contextual error messages.",
                "Operation execution completes within defined SLA without degrading overall workspace throughput.",
            ]

    def _fallback(self, context: Dict[str, Any], problem_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic requirements synthesis fallback with 100% distinct acceptance criteria."""
        issues = context.get("approved_issues") or []
        opps = context.get("approved_opportunities") or []

        fn_reqs: List[Dict[str, Any]] = []
        traceability: List[Dict[str, Any]] = []

        req_counter = 1

        for iss in issues:
            rid = f"REQ-{req_counter:03d}"
            req_counter += 1
            iid = iss.get("issue_id") or iss.get("id") or f"ISSUE-{req_counter}"
            title = iss.get("title", "Customer Friction Remediation")
            desc = iss.get("recommended_action") or iss.get("problem_description") or f"The system shall provide comprehensive resolution for {title}."
            impact = (iss.get("customer_impact") or iss.get("severity") or "high").lower()
            ev = iss.get("evidence_record_ids", [])

            criteria = self._generate_tailored_criteria(title, item_type="issue")

            fn_reqs.append({
                "requirement_id": rid,
                "title": f"Remediation: {title}",
                "description": f"The system shall {desc.rstrip('.')}.",
                "type": "functional",
                "priority": impact,
                "acceptance_criteria": criteria,
                "source_issues": [iid],
                "source_opportunities": [],
                "source_evidence": ev[:3] if ev else ["FB-001"],
            })

            traceability.append({
                "requirement_id": rid,
                "source_issues": [iid],
                "source_opportunities": [],
                "source_evidence": ev[:3] if ev else ["FB-001"],
            })

        for opp in opps:
            rid = f"REQ-{req_counter:03d}"
            req_counter += 1
            oid = opp.get("opportunity_id") or opp.get("id") or f"OPP-{req_counter}"
            title = opp.get("title", "Feature Capability")
            desc = opp.get("description") or f"The system shall implement {title} capability."
            priority = (opp.get("priority") or "medium").lower()
            ev = opp.get("evidence_record_ids", [])

            criteria = self._generate_tailored_criteria(title, item_type="opportunity")

            fn_reqs.append({
                "requirement_id": rid,
                "title": f"Capability: {title}",
                "description": f"The system shall provide {desc.rstrip('.')}.",
                "type": "functional",
                "priority": priority,
                "acceptance_criteria": criteria,
                "source_issues": [],
                "source_opportunities": [oid],
                "source_evidence": ev[:3] if ev else [],
            })

            traceability.append({
                "requirement_id": rid,
                "source_issues": [],
                "source_opportunities": [oid],
                "source_evidence": ev[:3] if ev else [],
            })

        if not fn_reqs:
            fn_reqs.append({
                "requirement_id": "REQ-001",
                "title": "Automated Workflow Friction Remediation",
                "description": "The system shall streamline core user operations and eliminate recurring customer friction points.",
                "type": "functional",
                "priority": "high",
                "acceptance_criteria": [
                    "User workflows complete within target SLA under standard peak conditions.",
                    "Zero uncaught validation exceptions occur during asynchronous data processing.",
                    "All user actions provide immediate visual confirmation and persistent state updates.",
                ],
                "source_issues": ["ISSUE-001"],
                "source_opportunities": [],
                "source_evidence": ["FB-001"],
            })
            traceability.append({
                "requirement_id": "REQ-001",
                "source_issues": ["ISSUE-001"],
                "source_opportunities": [],
                "source_evidence": ["FB-001"],
            })

        nfr_reqs = [
            {
                "requirement_id": "NFR-001",
                "title": "System Latency & Throughput SLA",
                "description": "The system shall maintain p95 API response times below 450ms and support up to 50 concurrent requests per tenant.",
                "type": "non_functional",
                "category": "performance",
                "target_metric": "< 450ms p95 latency",
            },
            {
                "requirement_id": "NFR-002",
                "title": "End-to-End Encryption & Security",
                "description": "All data in transit must enforce TLS 1.3 encryption and sensitive customer tokens must be encrypted at rest using AES-256.",
                "type": "non_functional",
                "category": "security",
                "target_metric": "100% TLS 1.3 & AES-256 enforcement",
            },
            {
                "requirement_id": "NFR-003",
                "title": "Audit Logging & Observability",
                "description": "Every state-mutating operation must emit structured JSON telemetry with user context and correlation IDs.",
                "type": "non_functional",
                "category": "observability",
                "target_metric": "Zero missing audit traces",
            },
            {
                "requirement_id": "NFR-004",
                "title": "Availability & Resilience",
                "description": "The service architecture shall achieve 99.9% uptime with automated health-check failover.",
                "type": "non_functional",
                "category": "reliability",
                "target_metric": ">= 99.9% availability",
            },
        ]

        return {
            "functional_requirements": fn_reqs,
            "non_functional_requirements": nfr_reqs,
            "constraints": [
                "Strict workspace-level data isolation must be preserved across all tenant queries.",
                "Rate limits of 100 API requests per minute per workspace must be enforced.",
            ],
            "assumptions": [
                "Authentication identity provider and token signing keys are accessible via secure internal network.",
                "Feedback and evidence collections are pre-processed and validated.",
            ],
            "dependencies": [
                "Workspace Authentication Service",
                "Reporting & Export Background Worker",
                "MongoDB Primary Replica Set",
            ],
            "requirement_traceability": traceability,
        }


requirements_analyst_agent = RequirementsAnalystAgent()
