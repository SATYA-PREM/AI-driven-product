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

