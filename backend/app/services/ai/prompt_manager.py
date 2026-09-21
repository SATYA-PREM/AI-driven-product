"""
prompt_manager.py
-----------------
Prompt templates and formatting utilities for Agent 1, Agent 2, and Agent 3.
"""

from __future__ import annotations

import json
from typing import Any

from app.core.constants import DEFAULT_PRODUCT_THEMES


class PromptManager:
    """Centralized prompt manager for AI agents."""

    @staticmethod
    def build_feedback_analysis_prompt(record: dict[str, Any]) -> str:
        """Construct the prompt for Agent 1 (Feedback Analysis Agent)."""
        feedback_id = record.get("feedback_id") or record.get("source_id") or record.get("signal_id") or "UNKNOWN"
        feedback_text = record.get("text") or record.get("feedback_text") or record.get("feedback") or ""
        rating = record.get("rating")
        metadata = record.get("metadata") or {}

        context_info = {
            "feedback_id": feedback_id,
            "feedback_text": feedback_text,
            "rating": rating,
            "module_context": metadata.get("module") or record.get("module"),
            "platform_context": metadata.get("platform") or record.get("platform"),
            "customer_segment": metadata.get("customer_segment") or record.get("customer_segment"),
        }

        return f"""Analyze this customer feedback record and return a strictly valid JSON object.

Allowed Themes: {', '.join(DEFAULT_PRODUCT_THEMES)}

Record to analyze:
{json.dumps(context_info, indent=2)}

Required JSON Schema:
{{
  "feedback_id": "{feedback_id}",
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentiment_confidence": 0.0 - 1.0,
  "intent": "complaint" | "bug_report" | "feature_request" | "question" | "praise" | "general_feedback",
  "intent_confidence": 0.0 - 1.0,
  "theme": "string (broad category from Allowed Themes)",
  "theme_confidence": 0.0 - 1.0,
  "product_area": "string (specific sub-feature directly referenced in text)",
  "pain_points": ["customer emotional friction or operational difficulty experienced"],
  "issues": ["concrete product bugs, errors, defects, or performance failures"],
  "feature_requests": ["explicit customer requests or proposals for new or altered capabilities"],
  "keywords": ["specific analytical terms present in the text"],
  "overall_confidence": 0.0 - 1.0,
  "urgency_level": "critical" | "high" | "medium" | "low",
  "customer_impact": "concise description of customer disruption or adoption barrier",
  "suggested_action": "recommended immediate tactical or roadmap action",
  "root_cause_hint": "subsystem or architectural defect hint based strictly on stated issue",
  "source_platform": "e.g. Web, Mobile, API, or Unknown"
}}

Operational "Do Not Infer" Policy & Strict Classification Rules:
1. Use ONLY information explicitly stated in the supplied feedback record.
2. Distinct Categories:
   - pain_points: The customer's emotional friction or obstacle (e.g. "slow loading experience").
   - issues: Concrete failure or defect (e.g. "timeout error on checkout").
   - feature_requests: Explicit proposals for new/expanded features. DO NOT infer a feature request from negative experience alone. If none requested, return [].
3. Do not classify a bug solely because the experience is negative.
4. Do not invent product areas, architectural causes, or technical root causes.
5. Every extracted issue, pain point, and feature request must be directly traceable to the feedback text.
6. If information is unavailable or unstated, return an empty array [] rather than guessing.
7. All confidence scores must be floating-point numbers between 0.0 and 1.0.
"""

    @staticmethod
    def build_batch_feedback_analysis_prompt(records: list[dict[str, Any]]) -> str:
        """Construct prompt to analyze a full batch of feedback records at once."""
        items = []
        for rec in records:
            orig = rec.get("original_record") or {}
            feedback_id = (
                rec.get("feedback_id")
                or rec.get("source_id")
                or rec.get("signal_id")
                or rec.get("source_record_id")
                or orig.get("feedback_id")
                or orig.get("customer_id")
                or str(rec.get("_id", "UNKNOWN"))
            )
            feedback_text = (
                rec.get("text")
                or rec.get("feedback_text")
                or rec.get("feedback")
                or orig.get("feedback_text")
                or orig.get("text")
                or orig.get("feedback")
                or ""
            )
            rating = rec.get("rating") if rec.get("rating") is not None else orig.get("rating")
            items.append({
                "feedback_id": feedback_id,
                "feedback_text": feedback_text,
                "rating": rating,
                "module_context": rec.get("module") or orig.get("module"),
                "platform_context": rec.get("platform") or orig.get("platform"),
                "customer_segment": rec.get("customer_segment") or orig.get("customer_segment"),
            })

        return f"""Analyze the following list of customer feedback records and return a strictly valid JSON array containing the 10-dimension classification object for EACH record in the exact same order.

Allowed Themes: {', '.join(DEFAULT_PRODUCT_THEMES)}

Records to analyze ({len(items)} items):
{json.dumps(items, indent=2)}

Required Output Format:
Return a JSON array of objects with schema:
[
  {{
    "feedback_id": "string",
    "sentiment": "positive" | "negative" | "neutral" | "mixed",
    "sentiment_confidence": 0.0 - 1.0,
    "intent": "complaint" | "bug_report" | "feature_request" | "question" | "praise" | "general_feedback",
    "intent_confidence": 0.0 - 1.0,
    "theme": "string (broad category from Allowed Themes)",
    "theme_confidence": 0.0 - 1.0,
    "product_area": "string (specific sub-feature directly referenced in text)",
    "pain_points": ["customer emotional friction or operational difficulty experienced"],
    "issues": ["concrete product bugs, errors, defects, or performance failures"],
    "feature_requests": ["explicit customer requests or proposals for new or altered capabilities"],
    "keywords": ["specific analytical terms present in the text"],
    "overall_confidence": 0.0 - 1.0,
    "urgency_level": "critical" | "high" | "medium" | "low",
    "customer_impact": "concise description of customer disruption or adoption barrier",
    "suggested_action": "recommended immediate tactical or roadmap action",
    "root_cause_hint": "subsystem or architectural defect hint based strictly on stated issue",
    "source_platform": "e.g. Web, Mobile, API, or Unknown"
  }}
]

Operational Rules:
1. Every input record MUST have a corresponding object in the returned array with the matching feedback_id.
2. Use ONLY facts explicitly stated in each feedback record. Do not invent product areas or root causes.
3. If no pain points, issues, or feature requests are present, provide an empty array [].
4. Return ONLY the raw JSON array.
"""

    @staticmethod
    def build_clustering_prompt(
        analyzed_records: list[dict[str, Any]],
        taxonomy: list[str] | None = None,
    ) -> str:
        """Construct the prompt for Agent 2 (Pattern & Trend Agent)."""
        taxonomy_list = taxonomy or DEFAULT_PRODUCT_THEMES

        # Distill records for semantic clustering
        condensed_records = []
        for r in analyzed_records:
            analysis = r.get("analysis", {})
            condensed_records.append({
                "feedback_id": r.get("feedback_id"),
                "sentiment": analysis.get("sentiment"),
                "theme": analysis.get("theme"),
                "product_area": analysis.get("product_area"),
                "issues": analysis.get("issues", []),
                "feature_requests": analysis.get("feature_requests", []),
            })

        return f"""You are analyzing multiple customer feedback records to perform semantic clustering.

Allowed Themes: {', '.join(taxonomy_list)}

Analyzed Records:
{json.dumps(condensed_records, indent=2)}

Return a strictly valid JSON object grouping these items into semantically cohesive clusters:
{{
  "issue_clusters": [
    {{
      "cluster_id": "ISSUE-001",
      "name": "Normalized issue name (e.g. Payment Gateway Timeouts)",
      "related_issues": ["Issue phrase 1", "Issue phrase 2"],
      "evidence_record_ids": ["FB001", "FB013"],
      "confidence": 0.90
    }}
  ],
  "feature_clusters": [
    {{
      "cluster_id": "FEATURE-001",
      "name": "Normalized feature name (e.g. One-Click Card Retry)",
      "related_requests": ["Request phrase 1", "Request phrase 2"],
      "evidence_record_ids": ["FB009", "FB021"],
      "confidence": 0.90
    }}
  ]
}}

Analytical & Statistical Rules:
1. Semantic similarity alone is INSUFFICIENT to establish a recurring product problem.
2. Group items ONLY when their underlying customer friction or requested capability is materially similar.
3. Do NOT merge issues merely because they share a broad product area or theme.
4. Preserving original evidence feedback IDs for every cluster is MANDATORY. Never invent feedback IDs.
5. Do NOT fabricate frequency counts or percentages; cluster composition directly defines counts.
6. Do NOT make product-priority decisions or assign severity levels (priority belongs to Agent 3 / PM).
"""

    @staticmethod
    def build_product_intelligence_prompt(
        issue_clusters: list[dict[str, Any]],
        feature_clusters: list[dict[str, Any]],
        trends: list[dict[str, Any]],
    ) -> str:
        """Construct prompt for Agent 3 (Product Intelligence Agent)."""
        input_data = {
            "issue_clusters": issue_clusters,
            "feature_clusters": feature_clusters,
            "trends": trends,
        }

        return f"""You are a Senior Product Intelligence Strategist.
Transform these customer feedback patterns, clusters, and trends into high-impact product intelligence insights.
Transform these customer feedback patterns, clusters, and trends into high-impact, decision-grade product intelligence insights for the PM Dashboard.

Pattern Data:
{json.dumps(input_data, indent=2)}

Return a strictly valid JSON object:
Return a strictly valid JSON object with the following schema:
{{
  "insights": [
    {{
      "insight_id": "PI-001",
      "insight_type": "HIGH_PRIORITY_ISSUE" | "EMERGING_ISSUE" | "RECURRING_ISSUE" | "PRODUCT_OPPORTUNITY" | "HIGH_DEMAND_FEATURE" | "NEGATIVE_TREND" | "POSITIVE_TREND" | "CUSTOMER_EXPERIENCE_RISK",
      "title": "Concise, actionable headline",
      "summary": "Executive summary of the issue or opportunity",
      "product_area": "Product area name",
      "title": "Concise, actionable executive headline",
      "summary": "Executive problem or opportunity synthesis",
      "product_area": "Target product area (e.g., search, onboarding, checkout, ui_ux)",
      "affected_feature": "Specific feature component name e.g. Product Search & Filter Engine",
      "severity": "low" | "medium" | "high" | "critical",
      "priority_level": "low" | "medium" | "high" | "critical",
      "customer_impact": "low" | "medium" | "high" | "critical",
      "customer_impact": {{
        "level": "low" | "medium" | "high" | "critical",
        "description": "Concrete user pain point or friction description"
      }},
      "business_impact": {{
        "level": "low" | "medium" | "high" | "critical",
        "impact_areas": ["user_retention", "task_completion", "conversion_rate"],
        "description": "Quantified risk or opportunity to business metrics and retention"
      }},
      "root_cause": {{
        "status": "hypothesis",
        "description": "Underlying UX, architectural, or workflow hypothesis",
        "confidence": 0.75
      }},
      "feature_opportunity": {{
        "identified": true,
        "area": "Search Usability",
        "opportunity": "Smart autocomplete & typo-tolerant product discovery",
        "expected_value": "Expected uplift in conversion and drop in abandoned queries"
      }},
      "product_recommendation": {{
        "action": "Strategic PM decision recommendation",
        "rationale": "Evidence-backed rationale justifying this action",
        "priority": "high" | "medium" | "low"
      }},
      "recommended_next_steps": [
        "1. Instrument query drop-off telemetry",
        "2. Prototype filter state persistence",
        "3. Run A/B usability test with affected customer segment"
      ],
      "evidence_record_ids": ["FB001", "FB013"],
      "recommended_action": "Strategic product recommendation for PM review"
    }}
  ]
}}

Core Operating Guardrails & Decision Boundaries:
1. Evidence Integrity: Every insight MUST contain at least one valid customer evidence feedback ID from the supplied clusters. Never invent feedback IDs.
2. Evidence Consistency: If frequency == 1, insight_type MUST NOT be 'RECURRING_ISSUE'. Use 'EMERGING_ISSUE' or 'CUSTOMER_EXPERIENCE_RISK'.
3. Hypothesis Labeling: root_cause status MUST be designated as 'hypothesis' with explicit confidence score (0.0 to 1.0).
4. Advisory Scope Only:
   - Recommendations are advisory and require human PM approval.
   - Recommendations must be strategic product decisions (e.g. streamline checkout flow), NOT developer bug fixes or task tickets.
   - Do NOT create PRDs, development tasks, sprint assignments, or alter roadmap status.
5. Deterministic Alignment: Do NOT override or alter the deterministic priority score; ground all business and customer impacts strictly in the provided cluster metrics.
"""


prompt_manager = PromptManager()

