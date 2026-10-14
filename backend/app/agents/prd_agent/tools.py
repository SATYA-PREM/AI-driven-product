"""
tools.py
--------
Execution tools for the PRD Generator Agent:
1. build_prd_context: Assembles batch context package from MongoDB.
2. validate_prd_payload: Ensures required PRD JSON keys are present.
3. save_prd_document: Persists completed PRD to MongoDB.
"""

from typing import Any, Dict, List, Optional
from app.services.prd.prd_context_builder import prd_context_builder
from app.core.database import prd_documents_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


def build_prd_context(
    workspace_id: str,
    product_id: Optional[str] = "default-product",
    source_review_id: Optional[str] = "REV-BATCH",
) -> Dict[str, Any]:
    """Tool: Assembles batch context package from MongoDB."""
    return prd_context_builder.build_context(
        workspace_id=workspace_id,
        product_id=product_id,
        source_review_id=source_review_id,
    )


def validate_prd_payload(prd_data: Dict[str, Any]) -> bool:
    """Tool: Validates that the generated PRD contains all required sections."""
    required_keys = ["title", "problem_statement", "requirements", "proposed_solution"]
    for k in required_keys:
        if not prd_data.get(k):
            logger.warning(f"PRD payload missing required section: {k}")
            return False
    return True


def save_prd_document(workspace_id: str, prd_data: Dict[str, Any]) -> Dict[str, Any]:
    """Tool: Persists the structured PRD document to MongoDB."""
    record = {
        "workspace_id": workspace_id,
        "title": prd_data.get("title", "Generated PRD"),
        "prd_payload": prd_data,
        "status": "DRAFT",
    }
    result = prd_documents_collection.insert_one(record)
    record["_id"] = str(result.inserted_id)
    return record


def parse_and_repair_json(raw_text: str) -> Dict[str, Any]:
    """
    Robust JSON parser for LLM outputs.
    Handles markdown code fences, trailing commas, single quotes, unquoted keys,
    and truncated outputs with graceful regex repair.
    """
    import json
    import re

    if not raw_text or not raw_text.strip():
        return {}

    text = raw_text.strip()

    # 1. Strip markdown fences if present
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()

    # 2. Fast direct JSON parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
        return {"data": parsed}
    except Exception:
        pass

    # 3. Extract the outer-most JSON object bounds
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        trimmed = text[start_idx : end_idx + 1]
        try:
            parsed = json.loads(trimmed)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        # 4. Clean trailing commas before closing braces/brackets
        cleaned = re.sub(r",\s*([\}\]])", r"\1", trimmed)
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        # 5. Fix unquoted keys (e.g. { name: "val" } -> { "name": "val" })
        unquoted_fixed = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', cleaned)
        try:
            parsed = json.loads(unquoted_fixed)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    # Log snippet for debugging if all repairs fail
    logger.warning(f"Failed to parse LLM JSON (len={len(raw_text)}). First 200 chars: {raw_text[:200]}")
    raise ValueError(f"Could not parse valid JSON from LLM response.")


def call_gemini_with_retry(client, model: str, contents: str, config: Dict[str, Any], max_retries: int = 3, initial_delay: float = 1.0):
    """
    Executes Gemini generate_content with automatic key failover across configured keys in gemini_pool,
    exponential backoff on transient errors, and candidate model cascading.
    """
    import time
    import random
    from app.services.ai.gemini_pool import gemini_pool

    fallback_models = [
        model,
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite-preview",
        "gemini-3.8-flash",
        "gemini-1.5-flash",
    ]

    seen = set()
    candidate_models = [m for m in fallback_models if m and not (m in seen or seen.add(m))]

    def _execute_on_client(active_client, active_key):
        last_err = None
        for current_model in candidate_models:
            delay = initial_delay
            for attempt in range(1, max_retries + 1):
                try:
                    return active_client.models.generate_content(
                        model=current_model,
                        contents=contents,
                        config=config,
                    )
                except Exception as e:
                    last_err = e
                    err_str = str(e).lower()

                    # Re-raise rate limits immediately so gemini_pool rotates to the next API key instantly
                    if any(term in err_str for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                        raise e

                    # Fast skip if model is not found / 404 / unsupported: do NOT retry
                    if any(term in err_str for term in ["404", "not found", "not_found", "is not supported", "no longer available"]):
                        logger.warning(f"Model '{current_model}' unsupported or not found ({e}). Skipping to next candidate model.")
                        break

                    # If transient 503 high demand or network error, retry with backoff and jitter
                    is_transient = any(code in err_str for code in ["503", "high demand", "overloaded", "unavailable"])
                    if is_transient and attempt < max_retries:
                        jitter = random.uniform(0.1, 0.4)
                        wait_time = delay + jitter
                        logger.info(f"Gemini API transient {current_model} on attempt {attempt}/{max_retries} ({e}). Retrying in {wait_time:.2f}s...")
                        time.sleep(wait_time)
                        delay *= 1.5
                    else:
                        break

        if last_err:
            raise last_err
        raise RuntimeError("All candidate Gemini models failed on this key.")

    return gemini_pool.execute_with_failover(_execute_on_client)


