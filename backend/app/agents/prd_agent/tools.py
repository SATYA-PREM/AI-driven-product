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


def call_gemini_with_retry(client, model: str, contents: str, config: Dict[str, Any], max_retries: int = 3, initial_delay: float = 1.5):
    """
    Executes Gemini generate_content with exponential backoff on transient 503 (high demand) / 429 errors,
    and automatic fallback across candidate models (gemini-3.8-flash, gemini-3.5-flash, gemini-3.5-flash-lite, etc.).
    """
    import time
    
    fallback_models = [
        model,
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
    ]
    
    # Deduplicate while preserving priority order
    seen = set()
    candidate_models = [m for m in fallback_models if m and not (m in seen or seen.add(m))]

    last_err = None
    for current_model in candidate_models:
        delay = initial_delay
        for attempt in range(1, max_retries + 1):
            try:
                return client.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config,
                )
            except Exception as e:
                last_err = e
                err_str = str(e).lower()
                # If 503 (high demand), 429 (rate limit), or transient network issue, retry
                if ("503" in err_str or "unavailable" in err_str or "high demand" in err_str or "429" in err_str or "resource_exhausted" in err_str) and attempt < max_retries:
                    logger.info(f"Gemini API returned transient error on attempt {attempt}/{max_retries} with model '{current_model}' ({e}). Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= 1.5
                elif "404" in err_str or "not_found" in err_str or "no longer available" in err_str or attempt == max_retries:
                    logger.warning(f"Model '{current_model}' unavailable ({e}). Trying next fallback model if available.")
                    break
                else:
                    break

    if last_err:
        raise last_err
    raise RuntimeError("All candidate Gemini models failed.")


