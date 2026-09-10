from __future__ import annotations
from datetime import datetime, timezone

from app.repositories.data_repository import data_repository
from app.repositories.dataset_repository import dataset_repository
from app.services.preprocessing.text_preprocessor import text_preprocessor
from app.services.preprocessing.structured_preprocessor import structured_preprocessor
from app.services.preprocessing.feature_preparation import feature_preparation
from app.services.preprocessing.canonicalizer import canonicalizer
from app.core.constants import DatasetStatus
from app.core.exceptions import NotFoundError


class PreprocessingService:
    """Service for preprocessing cleaned data into canonical AI-ready ProductSignal format."""

    @staticmethod
    def preprocess_dataset(dataset_id: str, workspace_id: str, user_id: str = "") -> dict:
        """
        Orchestrates preprocessing for a dataset.
        """
        dataset = dataset_repository.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundError("Dataset", dataset_id)

        source_type = dataset.get("source_type", "feedback")
        product_id = dataset.get("product_id", "")

        cleaned_records = data_repository.get_cleaned_records(dataset_id, limit=50000)
        processed_docs = []

        for record in cleaned_records:
            data = record.get("cleaned_record") or record.get("data") or record

            # Preprocess text
            for k in ["feedback", "review_text", "description", "text"]:
                if k in data and data[k]:
                    data[k] = text_preprocessor.preprocess_text(data[k])

            structured = structured_preprocessor.preprocess_structured(data, source_type)
            features = feature_preparation.prepare_features(structured)
            structured["features"] = features

            canonical_doc = canonicalizer.canonicalize(
                record=structured,
                source_type=source_type,
                dataset_id=dataset_id,
                workspace_id=workspace_id,
                product_id=product_id
            )
            processed_docs.append(canonical_doc)

        if processed_docs:
            data_repository.insert_processed_records(processed_docs)

        dataset_repository.update_status(
            dataset_id,
            DatasetStatus.READY.value,
            extra_fields={"updated_at": datetime.now(timezone.utc)}
        )

        return {
            "dataset_id": dataset_id,
            "total_input": len(cleaned_records),
            "processed_count": len(processed_docs),
            "preprocessing_metadata": {"canonical_format": "ProductSignal", "features_extracted": True},
            "processed_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def get_preprocessing_results(dataset_id: str) -> dict:
        """Get summary of processed signals for a dataset."""
        count = data_repository.count_processed_records(dataset_id)
        return {
            "dataset_id": dataset_id,
            "total_input": count,
            "processed_count": count,
            "preprocessing_metadata": {},
            "processed_at": datetime.now(timezone.utc)
        }


preprocessing_service = PreprocessingService()
