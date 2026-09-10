from __future__ import annotations
from app.models.processed_data import ProcessedDataModel
from app.core.constants import SourceType


class Canonicalizer:
    """Converts multi-source domain objects into canonical ProductSignal documents."""

    def canonicalize(
        self,
        record: dict,
        source_type: str,
        dataset_id: str,
        workspace_id: str,
        product_id: str
    ) -> dict:
        st = source_type.lower() if isinstance(source_type, str) else source_type.value
        customer_id = str(record.get("customer_id") or "")
        rating = record.get("rating")
        date = str(record.get("date") or "")
        text = str(record.get("text") or record.get("feedback") or record.get("review_text") or record.get("description") or "")

        source_id = ""
        if st == "review":
            source_id = str(record.get("review_id") or "")
        elif st == "support_ticket":
            source_id = str(record.get("ticket_id") or "")
        elif st == "feedback":
            source_id = customer_id

        return ProcessedDataModel.create_document(
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            product_id=product_id,
            source_type=SourceType(st) if st in [s.value for s in SourceType] else SourceType.FEEDBACK,
            source_id=source_id,
            customer_id=customer_id,
            text=text,
            rating=rating if isinstance(rating, int) else None,
            date=date if date else None,
            metadata=record.get("features", {}),
            preprocessing_metadata={"canonical_type": "ProductSignal"}
        )


canonicalizer = Canonicalizer()
canonicalize = canonicalizer.canonicalize
