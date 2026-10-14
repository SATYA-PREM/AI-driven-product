"""
agent.py
--------
PRD Assignment Agent: Product Team Assignment Specialist.
Analyzes PRD requirements and recommends appropriate team members based on content, role responsibility, skills, and workload.
"""

from __future__ import annotations
import json
import re
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.agents.prd_assignment_agent.prompts import (
    ASSIGNMENT_AGENT_SYSTEM_PROMPT,
    ASSIGNMENT_AGENT_USER_PROMPT,
)
from app.agents.prd_assignment_agent.tools import (
    extract_lean_planning_context,
    validate_and_sanitize_recommendations,
    deterministic_assignment_fallback,
)

logger = get_logger(__name__)


class PRDAssignmentAgent:
    """
    PRD Assignment Agent: Product Team Assignment Specialist.
    Analyzes requirements and generates validated team assignment recommendations for PM review.
    """

    def __init__(self):
        self.role = "Product Team Assignment Specialist"
        self.goal = "Analyze PRD requirements and recommend the appropriate product-team members based on requirement type, responsibility, required skills, and downstream work."

    def analyze_assignments(
        self,
        prd_project: Dict[str, Any],
        prd_document: Optional[Dict[str, Any]],
        requirements: List[Dict[str, Any]],
        features: List[Dict[str, Any]],
        acceptance_criteria: List[Dict[str, Any]],
        candidate_members: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Executes assignment analysis for a single PRD's requirements.
        Returns a list of recommendation objects matching RecommendationResponse schema.
        """
        prd_id = prd_project.get("prd_id", "")
        logger.info(f"PRD Assignment Agent starting analysis for PRD {prd_id} with {len(requirements)} requirements and {len(candidate_members)} candidates")

        if not requirements:
            logger.warning(f"No requirements found for PRD {prd_id}. Skipping LLM execution.")
            return []

        if not candidate_members:
            logger.warning(f"No candidate team members provided for workspace. Using default fallback.")
            return deterministic_assignment_fallback(prd_project, requirements, candidate_members)

        # 1. Extract ONLY lean planning context (no feedback dumps, no DB bloat)
        planning_context = extract_lean_planning_context(
            prd_project=prd_project,
            prd_document=prd_document,
            requirements=requirements,
            features=features,
            acceptance_criteria=acceptance_criteria,
        )

        candidate_json = json.dumps([
            {
                "user_id": str(m.get("user_id") or m.get("id")),
                "name": m.get("name", "Team Member"),
                "email": m.get("email", ""),
                "team_role": m.get("team_role", m.get("role", "DEVELOPER")),
            }
            for m in candidate_members
        ], indent=2)

        requirements_json = json.dumps(planning_context["requirements"], indent=2)

        user_prompt = ASSIGNMENT_AGENT_USER_PROMPT.format(
            prd_id=prd_id,
            prd_title=planning_context["prd_title"],
            prd_summary=planning_context["prd_summary"],
            product_goals=planning_context["product_goals"],
            candidate_members_json=candidate_json,
            requirements_json=requirements_json,
        )

        # 2. Invoke Gemini LLM via official google.genai SDK with multi-key pool failover
        try:
            from google.genai import types
            from app.services.ai.gemini_pool import gemini_pool

            primary_model = (getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")).split()[0].strip()
            
            candidate_models = [
                primary_model or "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite-preview",
                "gemini-3.8-flash",
                "gemini-1.5-flash",
            ]
            seen = set()
            models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

            config = types.GenerateContentConfig(
                system_instruction=ASSIGNMENT_AGENT_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json",
            )

            def _call_assignment(client, active_key):
                for model_name in models_to_try:
                    try:
                        logger.info(f"PRD Assignment Agent querying model: {model_name} on key {active_key[:8]}...")
                        response = client.models.generate_content(
                            model=model_name,
                            contents=user_prompt,
                            config=config,
                        )
                        raw = response.text or "{}"
                        if raw and raw.strip() != "{}":
                            return raw
                    except Exception as model_err:
                        err_str = str(model_err).lower()
                        if any(term in err_str for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                            raise model_err
                        logger.warning(f"PRD Assignment Agent call to model {model_name} failed: {model_err}. Trying next model if available.")
                raise RuntimeError("All candidate models returned empty responses on this key.")

            raw_text = gemini_pool.execute_with_failover(_call_assignment)
            from app.agents.prd_agent.tools import parse_and_repair_json
            parsed_json = parse_and_repair_json(raw_text)

            raw_recommendations = parsed_json.get("recommendations", [])
            if not raw_recommendations and isinstance(parsed_json, list):
                raw_recommendations = parsed_json

            # 3. Strictly validate every recommended user against candidates
            sanitized = validate_and_sanitize_recommendations(
                raw_recommendations=raw_recommendations,
                candidate_members=candidate_members,
                requirements=requirements,
                prd_id=prd_id,
            )

            if sanitized:
                logger.info(f"PRD Assignment Agent generated {len(sanitized)} verified recommendations for {prd_id}")
                return sanitized

            logger.warning(f"Sanitization returned empty recommendations. Falling back to deterministic assignment.")
            return deterministic_assignment_fallback(prd_project, requirements, candidate_members)

        except Exception as e:
            logger.warning(f"PRD Assignment Agent LLM call failed or unavailable ({e}). Using deterministic assignment fallback.")
            return deterministic_assignment_fallback(prd_project, requirements, candidate_members)

    def _clean_and_parse_json(self, raw_str: str) -> Dict[str, Any]:
        """Safely parse JSON with markdown code fence cleaning."""
        try:
            cleaned = re.sub(r"^```json\s*", "", raw_str.strip())
            cleaned = re.sub(r"^```\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            return json.loads(cleaned)
        except Exception:
            try:
                # Try finding outermost {}
                m = re.search(r"(\{.*\})", raw_str, re.DOTALL)
                if m:
                    return json.loads(m.group(1))
            except Exception:
                pass
        return {}


prd_assignment_agent = PRDAssignmentAgent()

