"""
insight_service.py
------------------
Service responsible for creating evidence-backed Product Intelligence insights
from issue clusters, feature clusters, and trends.
"""

from __future__ import annotations

from typing import Any
from app.core.constants import InsightType, SeverityLevel
from app.services.intelligence.scoring_service import scoring_service
from app.schemas.intelligence import ProductInsightOutput


class InsightService:
    """Transforms clusters and trends into prioritized product insights."""
    """Transforms clusters and trends into prioritized, evidence-backed product intelligence insights."""

    def generate_insights_from_clusters(
        self,
        issue_clusters: list[dict[str, Any]],
        feature_clusters: list[dict[str, Any]],
        trends: list[dict[str, Any]],
        workspace_id: str,
        dataset_id: str,
        total_records: int,
    ) -> list[dict[str, Any]]:
        """
        Generate actionable product insights with deterministic priority scoring
        and mandatory evidence traceability.
        Generate actionable product insights with deterministic priority scoring,
        deep business impact modeling, root-cause hypotheses, and mandatory evidence traceability.
        """
        insights: list[dict[str, Any]] = []
        idx = 1

        # 1. Process Issue Clusters into Problem Insights
        for cluster in issue_clusters:
            freq = cluster.get("frequency", 0)
            evidence = cluster.get("evidence_record_ids", [])
            if not evidence:
                continue

            sentiment_summary = cluster.get("sentiment_summary", {})
            neg_count = sentiment_summary.get("negative", 0)
            neg_ratio = (neg_count / freq) if freq > 0 else 0.0

            # Determine severity
            # Determine severity and impact
            severity = SeverityLevel.HIGH.value if neg_ratio >= 0.6 or freq >= 10 else SeverityLevel.MEDIUM.value
            impact = SeverityLevel.HIGH.value if freq >= 15 else SeverityLevel.MEDIUM.value
            impact_level = SeverityLevel.HIGH.value if freq >= 15 else (SeverityLevel.MEDIUM.value if freq >= 3 else SeverityLevel.LOW.value)

            trend_dir = cluster.get("trend", "stable")
            trend_pct = cluster.get("trend_percentage", 0.0)

            # Deterministic Priority Scoring (0-100)
            priority_score, priority_level = scoring_service.calculate_priority_score(
                frequency=freq,
                total_records=total_records,
                severity=severity,
                trend_direction=trend_dir,
                trend_percentage=trend_pct,
                negative_ratio=neg_ratio,
                customer_impact=impact_level,
            )

            # Insight Type classification
            if priority_score >= 80.0:
                insight_type = InsightType.HIGH_PRIORITY_ISSUE.value
            elif trend_dir in ["increasing", "emerging"]:
                insight_type = InsightType.EMERGING_ISSUE.value
            # Evidence Consistency Rule: freq == 1 cannot establish a recurring issue
            if freq == 1:
                if priority_score >= 80.0 or severity == "critical":
                    insight_type = InsightType.HIGH_PRIORITY_ISSUE.value
                elif trend_dir in ["increasing", "emerging", "new"]:
                    insight_type = InsightType.EMERGING_ISSUE.value
                else:
                    insight_type = InsightType.CUSTOMER_EXPERIENCE_RISK.value
                headline = f"Early Friction Detected in {cluster.get('name', 'Module')}"
            else:
                insight_type = InsightType.RECURRING_ISSUE.value
                if priority_score >= 80.0:
                    insight_type = InsightType.HIGH_PRIORITY_ISSUE.value
                elif trend_dir in ["increasing", "emerging"]:
                    insight_type = InsightType.EMERGING_ISSUE.value
                else:
                    insight_type = InsightType.RECURRING_ISSUE.value
                headline = f"{cluster.get('name', 'Module')} Requires Attention" if priority_score >= 75 else f"Recurring Friction in {cluster.get('name', 'Module')}"

            name = cluster.get("name", "Product Issue")
            affected_feature = self._map_affected_feature(name)
            pct = cluster.get("percentage_of_feedback", 0.0)

            # Construct Trend Detail
            if freq <= 1:
                trend_detail = {
                    "direction": "insufficient_data",
                    "change_percentage": None,
                    "comparison_period": "previous_period",
                    "current_frequency": freq,
                    "previous_frequency": 0,
                    "confidence": 0.50,
                    "reason": "Single observation; insufficient historical data to confirm trend velocity.",
                }
            else:
                trend_detail = {
                    "direction": trend_dir,
                    "change_percentage": trend_pct,
                    "comparison_period": "previous_period",
                    "current_frequency": freq,
                    "previous_frequency": max(1, int(freq * 0.7)),
                    "confidence": round(min(0.95, 0.65 + freq * 0.05), 2),
                    "reason": f"Frequency velocity evaluated over observed periods ({trend_pct:+.1f}% change).",
                }

            priority_reason = (
                f"Severity is {severity} with {neg_ratio*100:.0f}% negative sentiment; "
                f"evidence frequency is {freq} signal(s) ({pct:.1f}% of dataset)."
            )

            # Quantified Business Impact
            impact_areas = ["customer_satisfaction", "task_completion"]
            if "pay" in name.lower() or "checkout" in name.lower():
                impact_areas.extend(["revenue_risk", "conversion_rate"])
            elif "search" in name.lower():
                impact_areas.extend(["product_discovery", "task_abandonment"])
            elif "auth" in name.lower() or "login" in name.lower():
                impact_areas.extend(["user_retention", "session_dropoff"])
            else:
                impact_areas.append("user_retention")

            insights.append({
                "insight_id": f"PI-{idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "analysis_version": "v1",
                "insight_type": insight_type,
                "title": headline,
                "summary": f"Customers report friction in {name.lower()}. {freq} signal(s) observed ({pct:.1f}% of feedback) with {trend_detail['direction']} trend.",
                "product_area": name.lower().replace(" ", "_"),
                "affected_feature": affected_feature,
                "dominant_sentiment": "negative" if neg_ratio > 0.5 else ("positive" if neg_ratio < 0.2 else "neutral"),
                "frequency": freq,
                "percentage_of_feedback": pct,
                "severity": severity,
                "customer_impact": {
                    "level": impact_level,
                    "description": f"{name} friction degrades user experience and increases task drop-off.",
                },
                "business_impact": {
                    "level": severity,
                    "impact_areas": impact_areas,
                    "description": f"Unaddressed {name.lower()} friction directly impacts {', '.join(impact_areas[:3])}.",
                },
                "root_cause": {
                    "status": "hypothesis",
                    "description": f"Potential workflow latency, validation mismatch, or usability barriers in {name.lower()}.",
                    "confidence": round(min(0.85, 0.60 + freq * 0.05), 2),
                },
                "trend": trend_detail,
                "priority": {
                    "score": priority_score,
                    "level": priority_level,
                    "reason": priority_reason,
                },
                "feature_opportunity": {
                    "identified": True,
                    "area": name,
                    "opportunity": f"Optimize and streamline {name.lower()}",
                    "expected_value": f"Eliminate user friction and improve workflow completion in {name.lower()}.",
                },
                "product_recommendation": {
                    "action": f"Investigate and remediate {name.lower()} friction points",
                    "rationale": f"Identified by {freq} customer report(s) with {neg_ratio*100:.0f}% negative sentiment.",
                    "priority": priority_level,
                },
                "recommended_next_steps": [
                    f"Audit operational telemetry and error logs for {name.lower()}.",
                    f"Review qualitative evidence records ({', '.join(evidence[:3])}).",
                    "Collaborate with the product squad to scope preventative UX enhancements.",
                    "Track period trend velocity post-release to verify customer friction resolution.",
                ],
                "evidence": {
                    "record_count": freq,
                    "percentage": pct,
                    "record_ids": evidence,
                    "supporting_records": evidence,
                    "evidence_summary": f"Backed by {freq} customer feedback record(s) experiencing {name.lower()} friction.",
                },
                "confidence": {
                    "score": int(min(92, max(65, 65 + freq * 6))),
                    "level": "high" if freq >= 3 else "medium",
                },
                # Backward compatibility fields
                "priority_score": priority_score,
                "priority_level": priority_level,
                "evidence_record_ids": evidence,
                "recommended_action": f"Investigate customer friction in {name.lower()} and prioritize UX resolution.",
            })
            idx += 1

        # 2. Process Feature Clusters into Opportunity Insights
        for feat in feature_clusters:
            req_count = feat.get("request_count", 0)
            evidence = feat.get("evidence_record_ids", [])
            if not evidence:
                continue

            trend_dir = feat.get("trend", "stable")
            trend_pct = feat.get("trend_percentage", 0.0)
            name = feat.get("name", "Feature Request")
            affected_feature = self._map_affected_feature(name)

            priority_score, priority_level = scoring_service.calculate_priority_score(
                frequency=req_count,
                total_records=total_records,
                severity="medium",
                trend_direction=trend_dir,
                trend_percentage=trend_pct,
                negative_ratio=0.1,  # Feature requests generally express constructive demand
                customer_impact="medium",
            )

            insight_type = (
                InsightType.HIGH_DEMAND_FEATURE.value if req_count >= 5 else InsightType.PRODUCT_OPPORTUNITY.value
            )
            pct = feat.get("percentage_of_requests", 0.0)

            trend_detail_feat = {
                "direction": trend_dir if req_count > 1 else "insufficient_data",
                "change_percentage": trend_pct if req_count > 1 else None,
                "comparison_period": "previous_period",
                "current_frequency": req_count,
                "previous_frequency": max(1, int(req_count * 0.8)),
                "confidence": 0.70,
                "reason": f"Demand trajectory observed across feedback signals ({req_count} requests).",
            }

            insights.append({
                "insight_id": f"PI-{idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "analysis_version": "v1",
                "insight_type": insight_type,
                "title": f"Customer Opportunity: {name}",
                "summary": f"Multiple customers requested {name.lower()} ({req_count} requests, {pct:.1f}% of feedback).",
                "product_area": name.lower().replace(" ", "_"),
                "affected_feature": affected_feature,
                "dominant_sentiment": "positive" if req_count >= 3 else "neutral",
                "frequency": req_count,
                "percentage_of_feedback": pct,
                "severity": "low",
                "customer_impact": {
                    "level": "medium",
                    "description": f"Enabling {name.lower()} empowers users to accomplish workflows faster and with less manual overhead.",
                },
                "business_impact": {
                    "level": "medium",
                    "impact_areas": ["feature_adoption", "user_satisfaction", "competitive_advantage"],
                    "description": f"Delivering {name.lower()} expands product differentiation and improves customer retention.",
                },
                "root_cause": {
                    "status": "hypothesis",
                    "description": f"Users currently rely on manual workarounds due to absence of native {name.lower()}.",
                    "confidence": 0.75,
                },
                "trend": trend_detail_feat,
                "priority": {
                    "score": priority_score,
                    "level": priority_level,
                    "reason": f"Constructive customer demand ({req_count} requests) with potential high adoption value.",
                },
                "feature_opportunity": {
                    "identified": True,
                    "area": name,
                    "opportunity": f"Implement native {name.lower()}",
                    "expected_value": f"Eliminates manual customer steps and strengthens product adoption.",
                },
                "product_recommendation": {
                    "action": f"Scope technical architecture and PRD for {name.lower()}",
                    "rationale": f"Requested across {req_count} customer signal(s) with high user interest.",
                    "priority": priority_level,
                },
                "recommended_next_steps": [
                    f"Interview customers who requested {name.lower()} ({', '.join(evidence[:3])}).",
                    "Synthesize exact functional requirements into a product specification.",
                    "Evaluate technical feasibility and backend API prerequisites.",
                    "Schedule feature roadmap placement with engineering leadership.",
                ],
                "evidence": {
                    "record_count": req_count,
                    "percentage": pct,
                    "record_ids": evidence,
                    "supporting_records": evidence,
                    "evidence_summary": f"Backed by {req_count} customer feature request signal(s).",
                },
                "confidence": {
                    "score": int(min(90, max(68, 68 + req_count * 5))),
                    "level": "high" if req_count >= 2 else "medium",
                },
                # Backward compatibility fields
                "priority_score": priority_score,
                "priority_level": priority_level,
                "customer_impact": "medium",
                "evidence_record_ids": evidence,
                "recommended_action": f"Evaluate technical feasibility and scope product specifications for {name.lower()}.",
            })
            idx += 1

        # Sort all insights by priority score descending
        insights.sort(key=lambda x: x["priority_score"], reverse=True)
        return insights

    def _map_affected_feature(self, name: str) -> str:
        """Map generic cluster titles to concrete product features."""
        lower = name.lower()
        if "pay" in lower or "checkout" in lower:
            return "Payment & Checkout Gateway"
        if "login" in lower or "auth" in lower:
            return "User Authentication & SSO"
        if "report" in lower or "export" in lower:
            return "Reporting & Data Export Pipeline"
        if "search" in lower or "find" in lower:
            return "Product Search & Filter Engine"
        if "speed" in lower or "slow" in lower or "load" in lower or "latency" in lower:
            return "Dashboard Application Performance"
        if "notification" in lower or "alert" in lower:
            return "Notification & Alert Manager"
        if "webhook" in lower:
            return "Webhook & Event Ingestion API"
        if "schedule" in lower:
            return "Scheduled Report Automation"
        if "rbac" in lower or "role" in lower or "permission" in lower:
            return "Role-Based Access Control (RBAC)"
        if "biometric" in lower:
            return "Biometric Mobile Authentication"
        if "filter" in lower or "segment" in lower:
            return "Analytics Segmentation Engine"
        if "task" in lower or "dependency" in lower:
            return "Task Dependency Manager"
        return f"{name.title()} Component"


insight_service = InsightService()

