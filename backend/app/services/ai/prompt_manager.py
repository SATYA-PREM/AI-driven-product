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
  "theme": "string (broad category e.g. checkout, reporting, authentication)",
  "theme_confidence": 0.0 - 1.0,
  "product_area": "string (specific sub-feature e.g. payment_confirmation, report_export)",
  "pain_points": ["customer friction/difficulty"],
  "issues": ["concrete product bugs or problems"],
  "feature_requests": ["new or improved functionality requested"],
  "keywords": ["specific analytical keywords"],
  "overall_confidence": 0.0 - 1.0
}}

Important Guidelines:
1. Do not invent facts not supported by the feedback text.
2. If no issues exist (e.g. praise), return issues as [].
3. If no feature requests exist, return feature_requests as [].
4. Confidence scores must be floating point numbers between 0.0 and 1.0.
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
      "name": "Normalized issue name (e.g. Payment Problems)",
      "related_issues": ["Issue phrase 1", "Issue phrase 2"],
      "evidence_record_ids": ["FB001", "FB013"],
      "confidence": 0.90
    }}
  ],
  "feature_clusters": [
    {{
      "cluster_id": "FEATURE-001",
      "name": "Normalized feature name (e.g. Dark Mode)",
      "related_requests": ["Request phrase 1", "Request phrase 2"],
      "evidence_record_ids": ["FB009", "FB021"],
      "confidence": 0.90
    }}
  ]
}}

Rules:
1. Only group items that are genuinely semantically related.
2. Every cluster MUST include the list of evidence feedback IDs that contributed to it.
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
      "recommended_action": "High-level summary of PM recommendation"
    }}
  ]
}}

Rules:
Strict Rules:
1. Evidence record IDs are MANDATORY and must come directly from the supplied clusters.
2. Recommendations must be product-level (e.g. improve checkout confirmation flow), not developer task assignments.
2. If frequency == 1, insight_type MUST NOT be "RECURRING_ISSUE". Use "EMERGING_ISSUE" or "CUSTOMER_EXPERIENCE_RISK".
3. root_cause status MUST be "hypothesis" unless verified with production telemetry.
4. Recommendations must be strategic PM/product-level decisions, not developer bug fixes.
"""


prompt_manager = PromptManager()

