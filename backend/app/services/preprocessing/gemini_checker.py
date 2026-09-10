"""
gemini_checker.py
------------------
Gemini-powered semantic quality and readiness checker for preprocessed datasets.
Evaluates AI readiness, sentiment dispersion, themes, and detects potential anomalies.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import NotFoundError
from app.repositories.data_repository import data_repository
from app.repositories.dataset_repository import dataset_repository

logger = get_logger(__name__)


class GeminiPreprocessingChecker:
    """Semantic quality checker leveraging Google Gemini."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"

    def check_dataset(self, dataset_id: str, sample_size: int = 10) -> dict:
        """
        Inspect preprocessed signals using Gemini or heuristic semantic evaluation.
        """
        dataset = dataset_repository.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundError("Dataset", dataset_id)

        processed_records = data_repository.get_processed_records(dataset_id, limit=sample_size)
        total_signals = data_repository.count_processed_records(dataset_id)

        if not processed_records:
            return {
                "dataset_id": dataset_id,
                "total_signals": 0,
                "ai_readiness_score": 0.0,
                "status": "empty",
                "summary": "No preprocessed signals found for this dataset.",
                "insights": [],
                "checked_at": datetime.now(timezone.utc).isoformat()
            }

        # Prepare samples for prompt evaluation
        sample_texts = [
            {
                "signal_id": r.get("signal_id"),
                "text": r.get("text", ""),
                "rating": r.get("rating"),
                "source_type": r.get("source_type")
            }
            for r in processed_records[:sample_size]
        ]

        if self.api_key:
            try:
                return self._evaluate_with_gemini(dataset_id, total_signals, sample_texts)
            except Exception as e:
                logger.warning(f"Gemini API check encountered error, using fallback: {e}")
                return self._evaluate_heuristically(dataset_id, total_signals, sample_texts, fallback_reason=str(e))
        else:
            return self._evaluate_heuristically(dataset_id, total_signals, sample_texts)

    def _evaluate_with_gemini(self, dataset_id: str, total_signals: int, samples: list[dict]) -> dict:
        """Call Gemini model via google-genai SDK."""
        from google import genai

        client = genai.Client(api_key=self.api_key)
        prompt = (
            f"You are a Senior Product Intelligence Quality Evaluator. "
            f"Evaluate the following {len(samples)} sample signals extracted from customer dataset '{dataset_id}'.\n"
            f"Total signals in dataset: {total_signals}\n\n"
            f"Samples JSON:\n{json.dumps(samples, indent=2)}\n\n"
            f"Return a valid JSON object ONLY with the following exact keys:\n"
            f"- 'ai_readiness_score': float from 0 to 100\n"
            f"- 'data_coherence': 'High' | 'Medium' | 'Low'\n"
            f"- 'dominant_themes': list of strings\n"
            f"- 'sentiment_distribution': dict with 'positive', 'neutral', 'negative' percentages\n"
            f"- 'quality_summary': 1-2 sentence overview\n"
            f"- 'recommendations': list of action items\n"
        )

        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        resp_text = response.text.strip()
        # Strip markdown code fences if returned
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:]
        if resp_text.startswith("```"):
            resp_text = resp_text[3:]
        if resp_text.endswith("```"):
            resp_text = resp_text[:-3]

        parsed = json.loads(resp_text.strip())
        
        # Normalize sentiment_distribution format if present
        raw_sentiment = parsed.get("sentiment_distribution", {})
        if isinstance(raw_sentiment, dict):
            normalized_sentiment = {}
            for k, v in raw_sentiment.items():
                if isinstance(v, (int, float)):
                    normalized_sentiment[k] = f"{round(float(v), 1)}%"
                else:
                    normalized_sentiment[k] = str(v)
            parsed["sentiment_distribution"] = normalized_sentiment

        parsed["dataset_id"] = dataset_id
        parsed["total_signals"] = total_signals
        parsed["evaluator"] = f"Gemini ({self.model_name})"
        parsed["checked_at"] = datetime.now(timezone.utc).isoformat()
        return parsed

    def _evaluate_heuristically(self, dataset_id: str, total_signals: int, samples: list[dict], fallback_reason: str = "") -> dict:
        """Heuristic semantic evaluation when Gemini API is offline or key is unset."""
        ratings = [s["rating"] for s in samples if s.get("rating") is not None]
        lengths = [len(s.get("text", "")) for s in samples]

        avg_length = sum(lengths) / len(lengths) if lengths else 0
        avg_rating = sum(ratings) / len(ratings) if ratings else 3.0

        pos_count = sum(1 for r in ratings if r >= 4)
        neg_count = sum(1 for r in ratings if r <= 2)
        neu_count = len(ratings) - pos_count - neg_count

        total_rated = len(ratings) or 1
        readiness_score = min(100.0, max(50.0, (avg_length * 0.4) + (len(samples) * 5)))

        return {
            "dataset_id": dataset_id,
            "total_signals": total_signals,
            "ai_readiness_score": round(readiness_score, 1),
            "data_coherence": "High" if avg_length > 20 else "Medium",
            "dominant_themes": ["User Experience", "Product Usability", "Performance"],
            "sentiment_distribution": {
                "positive": f"{round((pos_count / total_rated) * 100)}%",
                "neutral": f"{round((neu_count / total_rated) * 100)}%",
                "negative": f"{round((neg_count / total_rated) * 100)}%"
            },
            "quality_summary": f"Dataset contains {total_signals} canonical signals ready for AI topic clustering and sentiment extraction.",
            "recommendations": [
                "Proceed to Milestone 2 AI semantic analysis",
                "Ensure negative signals are reviewed for urgent product defects"
            ],
            "evaluator": "Semantic Preprocessing Checker (Heuristic)",
            "fallback_reason": fallback_reason or None,
            "checked_at": datetime.now(timezone.utc).isoformat()
        }


gemini_checker = GeminiPreprocessingChecker()

