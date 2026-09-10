import os

base_dir = r"d:\PROJECTS\AI-driven-product-assistant\backend\app\services"

files = {
    # VALIDATION
    r"validation\schema_validator.py": """from __future__ import annotations
from app.core.constants import SOURCE_TYPE_REQUIRED_FIELDS

def validate_schema(record: dict, source_type: str) -> tuple[bool, list[str]]:
    \"\"\"
    Validate record structure based on source_type.
    \"\"\"
    errors = []
    required_fields = SOURCE_TYPE_REQUIRED_FIELDS.get(source_type.upper(), [])
    
    for field in required_fields:
        val = record.get(field)
        if val is None or str(val).strip() == "":
            errors.append(f"Missing or empty required field: {field}")
            
    # Check data types if present
    if "rating" in record and record["rating"] is not None:
        try:
            float(record["rating"])
        except ValueError:
            errors.append("Rating must be numeric")
            
    is_valid = len(errors) == 0
    return is_valid, errors
""",

    r"validation\data_validator.py": """from __future__ import annotations
from app.utils.date_utils import is_valid_date

def validate_data(record: dict, source_type: str) -> tuple[bool, list[str], list[str]]:
    \"\"\"
    Validate data quality.
    \"\"\"
    errors = []
    warnings = []
    
    if "rating" in record and record["rating"] is not None:
        try:
            rating = float(record["rating"])
            if not (1 <= rating <= 5):
                errors.append(f"Rating must be between 1 and 5, got {rating}")
        except ValueError:
            pass # Caught by schema_validator
            
    text_fields = [k for k in record.keys() if "text" in k or k in ["feedback", "description"]]
    for tf in text_fields:
        val = record.get(tf)
        if val and isinstance(val, str):
            if len(val.strip()) < 3:
                warnings.append(f"Text field {tf} is very short")
                
    if "date" in record and record["date"]:
        if not is_valid_date(str(record["date"])):
            errors.append(f"Date {record['date']} is not parseable")
            
    is_valid = len(errors) == 0
    return is_valid, errors, warnings
""",

    r"validation\business_rule_validator.py": """from __future__ import annotations
from app.core.constants import SourceType

def validate_business_rules(record: dict, source_type: str) -> tuple[bool, list[str]]:
    \"\"\"
    Business rule validation per source type.
    \"\"\"
    errors = []
    source_upper = source_type.upper()
    
    if source_upper == SourceType.FEEDBACK.name:
        if not record.get("customer_id"):
            errors.append("FEEDBACK requires customer_id")
        if not record.get("feedback"):
            errors.append("FEEDBACK requires feedback text")
    elif source_upper == SourceType.REVIEW.name:
        if not record.get("review_id"):
            errors.append("REVIEW requires review_id")
        if not record.get("review_text"):
            errors.append("REVIEW requires review_text")
    elif source_upper == SourceType.SUPPORT_TICKET.name:
        if not record.get("ticket_id"):
            errors.append("SUPPORT_TICKET requires ticket_id")
        if not record.get("description"):
            errors.append("SUPPORT_TICKET requires description")
            
    is_valid = len(errors) == 0
    return is_valid, errors
""",

    r"validation\validation_service.py": """from __future__ import annotations
from app.repositories.data_repository import data_repository
from app.repositories.validation_repository import validation_repository
from app.models.dataset import DatasetModel
from app.models.validation_result import ValidationResultModel
from app.services.validation.schema_validator import validate_schema
from app.services.validation.data_validator import validate_data
from app.services.validation.business_rule_validator import validate_business_rules
from app.utils.text_utils import compute_text_hash
from app.core.constants import DatasetStatus
from app.core.database import get_database

def validate_dataset(dataset_id: str, workspace_id: str) -> dict:
    \"\"\"
    Orchestrates all validation for a dataset.
    \"\"\"
    db = get_database()
    dataset = db.datasets.find_one({"_id": dataset_id, "workspace_id": workspace_id})
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
        
    source_type = dataset.get("source_type", "FEEDBACK")
    raw_records = data_repository.get_raw_records(dataset_id)
    
    seen_hashes = set()
    total = len(raw_records)
    valid_count = 0
    
    validation_docs = []
    
    for record in raw_records:
        record_id = record.get("_id")
        data = record.get("data", {})
        
        is_schema_valid, schema_errors = validate_schema(data, source_type)
        is_data_valid, data_errors, data_warnings = validate_data(data, source_type)
        is_biz_valid, biz_errors = validate_business_rules(data, source_type)
        
        all_errors = schema_errors + data_errors + biz_errors
        
        # Deduplication check
        text_fields = [k for k in data.keys() if "text" in k or k in ["feedback", "description"]]
        text_val = ""
        if text_fields:
            text_val = str(data.get(text_fields[0], ""))
        
        text_hash = compute_text_hash(text_val)
        is_duplicate = False
        if text_hash in seen_hashes and text_val:
            is_duplicate = True
            all_errors.append("Duplicate text content detected")
        elif text_val:
            seen_hashes.add(text_hash)
            
        is_valid = len(all_errors) == 0
        if is_valid:
            valid_count += 1
            
        val_res = ValidationResultModel.create_document(
            dataset_id=dataset_id,
            record_id=str(record_id),
            is_valid=is_valid,
            errors=all_errors,
            warnings=data_warnings,
            is_duplicate=is_duplicate
        )
        validation_docs.append(val_res)
        
    if validation_docs:
        validation_repository.insert_many(validation_docs)
        
    db.datasets.update_one(
        {"_id": dataset_id},
        {"$set": {"status": DatasetStatus.VALIDATED.name}}
    )
    
    return {
        "dataset_id": dataset_id,
        "total_records": total,
        "valid_count": valid_count,
        "invalid_count": total - valid_count
    }
""",

    # CLEANING
    r"cleaning\duplicate_handler.py": """from __future__ import annotations
from app.utils.text_utils import compute_text_hash

def detect_duplicates(records: list[dict], text_field: str = 'feedback') -> list[dict]:
    \"\"\"
    Detect and mark duplicates in a list of records.
    \"\"\"
    seen_hashes = {}
    
    for record in records:
        text = str(record.get(text_field) or "")
        text_hash = compute_text_hash(text)
        
        if text_hash in seen_hashes:
            record["is_duplicate"] = True
            record["duplicate_group"] = seen_hashes[text_hash]
        else:
            group_id = str(record.get("_id", "group_" + text_hash[:8]))
            seen_hashes[text_hash] = group_id
            record["is_duplicate"] = False
            record["duplicate_group"] = group_id
            
    return records
""",

    r"cleaning\missing_value_handler.py": """from __future__ import annotations
from app.core.constants import SOURCE_TYPE_REQUIRED_FIELDS

def handle_missing_values(records: list[dict], source_type: str) -> list[dict]:
    \"\"\"
    Handle missing values based on required/optional fields.
    \"\"\"
    required_fields = SOURCE_TYPE_REQUIRED_FIELDS.get(source_type.upper(), [])
    
    for record in records:
        for field in required_fields:
            if not record.get(field):
                record["_missing_required"] = True
                
        # Optional fields handling could be explicit, but dict.get handles missing by returning None
        for key in list(record.keys()):
            if record[key] == "":
                record[key] = None
                
    return records
""",

    r"cleaning\normalization.py": """from __future__ import annotations
from app.utils.date_utils import normalize_date
from app.utils.text_utils import normalize_whitespace

def normalize_record(record: dict, source_type: str) -> dict:
    \"\"\"
    Normalize specific fields in a record.
    \"\"\"
    cleaned = record.copy()
    
    if "date" in cleaned and cleaned["date"]:
        cleaned["date"] = normalize_date(str(cleaned["date"]))
        
    if "rating" in cleaned and cleaned["rating"] is not None:
        try:
            cleaned["rating"] = int(float(cleaned["rating"]))
        except ValueError:
            pass
            
    for k, v in cleaned.items():
        if isinstance(v, str):
            cleaned[k] = normalize_whitespace(v).strip()
            
    return cleaned
""",

    r"cleaning\cleaning_service.py": """from __future__ import annotations
from app.repositories.data_repository import data_repository
from app.repositories.validation_repository import validation_repository
from app.models.cleaned_data import CleanedDataModel
from app.services.cleaning.duplicate_handler import detect_duplicates
from app.services.cleaning.missing_value_handler import handle_missing_values
from app.services.cleaning.normalization import normalize_record
from app.core.constants import DatasetStatus
from app.core.database import get_database

def clean_dataset(dataset_id: str, workspace_id: str) -> dict:
    \"\"\"
    Orchestrates the cleaning pipeline.
    \"\"\"
    db = get_database()
    dataset = db.datasets.find_one({"_id": dataset_id, "workspace_id": workspace_id})
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
        
    source_type = dataset.get("source_type", "FEEDBACK")
    
    validation_results = validation_repository.get_by_dataset(dataset_id)
    valid_record_ids = {vr["record_id"] for vr in validation_results if vr.get("is_valid")}
    
    raw_records = data_repository.get_raw_records(dataset_id)
    valid_raw_records = [r for r in raw_records if str(r.get("_id")) in valid_record_ids]
    
    # Extract actual data dicts
    data_list = [r.get("data", {}) for r in valid_raw_records]
    
    text_field = "feedback"
    if source_type.upper() == "REVIEW":
        text_field = "review_text"
    elif source_type.upper() == "SUPPORT_TICKET":
        text_field = "description"
        
    data_list = detect_duplicates(data_list, text_field)
    data_list = handle_missing_values(data_list, source_type)
    
    cleaned_docs = []
    for raw_rec, data in zip(valid_raw_records, data_list):
        cleaned_data = normalize_record(data, source_type)
        doc = CleanedDataModel.create_document(
            dataset_id=dataset_id,
            raw_record_id=str(raw_rec.get("_id")),
            data=cleaned_data
        )
        cleaned_docs.append(doc)
        
    if cleaned_docs:
        data_repository.insert_cleaned_records(cleaned_docs)
        
    db.datasets.update_one(
        {"_id": dataset_id},
        {"$set": {"status": DatasetStatus.CLEANED.name}}
    )
    
    return {
        "dataset_id": dataset_id,
        "total_input": len(valid_raw_records),
        "cleaned_count": len(cleaned_docs)
    }
""",

    # PREPROCESSING
    r"preprocessing\text_preprocessor.py": """from __future__ import annotations
from app.utils.text_utils import remove_html_tags, clean_encoding
import re

def preprocess_text(text: str) -> str:
    \"\"\"
    Preprocess text by removing HTML, cleaning encoding, and collapsing whitespace.
    \"\"\"
    if not text:
        return ""
    text = clean_encoding(text)
    text = remove_html_tags(text)
    text = text.lower()
    text = re.sub(r'\\s+', ' ', text).strip()
    return text
""",

    r"preprocessing\structured_preprocessor.py": """from __future__ import annotations

def preprocess_structured(record: dict, source_type: str) -> dict:
    \"\"\"
    Standardize field names and types.
    \"\"\"
    processed = record.copy()
    source_upper = source_type.upper()
    
    if source_upper == "REVIEW" and "review_text" in processed:
        processed["text"] = processed.pop("review_text")
    elif source_upper == "SUPPORT_TICKET" and "description" in processed:
        processed["text"] = processed.pop("description")
    elif source_upper == "FEEDBACK" and "feedback" in processed:
        processed["text"] = processed.pop("feedback")
        
    if "rating" in processed and processed["rating"] is not None:
        try:
            processed["rating"] = int(processed["rating"])
        except ValueError:
            pass
            
    return processed
""",

    r"preprocessing\feature_preparation.py": """from __future__ import annotations

def prepare_features(record: dict) -> dict:
    \"\"\"
    Extract basic features from the record.
    \"\"\"
    features = {}
    text = record.get("text", "")
    
    features["text_length"] = len(text)
    features["word_count"] = len(text.split()) if text else 0
    features["has_rating"] = "rating" in record and record["rating"] is not None
    
    return features
""",

    r"preprocessing\canonicalizer.py": """from __future__ import annotations
from app.models.processed_data import ProcessedDataModel

def canonicalize(record: dict, source_type: str, dataset_id: str, workspace_id: str, product_id: str) -> dict:
    \"\"\"
    Convert any source type into the canonical format.
    \"\"\"
    source_upper = source_type.upper()
    
    customer_id = record.get("customer_id")
    rating = record.get("rating")
    date = record.get("date")
    text = record.get("text", "")
    source_id = None
    
    if source_upper == "REVIEW":
        source_id = record.get("review_id")
    elif source_upper == "SUPPORT_TICKET":
        source_id = record.get("ticket_id")
        
    canonical_data = {
        "text": text,
        "rating": rating,
        "date": date,
        "customer_id": customer_id,
        "source_id": source_id,
        "source_type": source_upper
    }
    
    return ProcessedDataModel.create_document(
        dataset_id=dataset_id,
        workspace_id=workspace_id,
        product_id=product_id,
        canonical_data=canonical_data,
        metadata=record.get("features", {})
    )
""",

    r"preprocessing\preprocessing_service.py": """from __future__ import annotations
from app.repositories.data_repository import data_repository
from app.services.preprocessing.text_preprocessor import preprocess_text
from app.services.preprocessing.structured_preprocessor import preprocess_structured
from app.services.preprocessing.feature_preparation import prepare_features
from app.services.preprocessing.canonicalizer import canonicalize
from app.core.constants import DatasetStatus
from app.core.database import get_database

def preprocess_dataset(dataset_id: str, workspace_id: str) -> dict:
    \"\"\"
    Orchestrates preprocessing.
    \"\"\"
    db = get_database()
    dataset = db.datasets.find_one({"_id": dataset_id, "workspace_id": workspace_id})
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
        
    source_type = dataset.get("source_type", "FEEDBACK")
    product_id = dataset.get("product_id")
    
    cleaned_records = data_repository.get_cleaned_records(dataset_id)
    processed_docs = []
    
    for record in cleaned_records:
        data = record.get("data", {})
        
        if "text" in data:
            data["text"] = preprocess_text(data["text"])
        for k in ["feedback", "review_text", "description"]:
            if k in data:
                data[k] = preprocess_text(data[k])
                
        structured = preprocess_structured(data, source_type)
        features = prepare_features(structured)
        structured["features"] = features
        
        canonical_doc = canonicalize(
            record=structured,
            source_type=source_type,
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            product_id=product_id
        )
        processed_docs.append(canonical_doc)
        
    if processed_docs:
        data_repository.insert_processed_records(processed_docs)
        
    db.datasets.update_one(
        {"_id": dataset_id},
        {"$set": {"status": DatasetStatus.READY.name}}
    )
    
    return {
        "dataset_id": dataset_id,
        "processed_count": len(processed_docs)
    }
""",

    # WORKFLOW
    r"workflow\__init__.py": """from __future__ import annotations
""",

    r"workflow\workflow_state.py": """from __future__ import annotations
from app.core.constants import WorkflowStepStatus, WorkflowStep

VALID_TRANSITIONS = {
    WorkflowStepStatus.NOT_STARTED: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS],
    WorkflowStepStatus.READY: [WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.BLOCKED],
    WorkflowStepStatus.IN_PROGRESS: [WorkflowStepStatus.COMPLETED, WorkflowStepStatus.FAILED, WorkflowStepStatus.BLOCKED],
    WorkflowStepStatus.FAILED: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS],
    WorkflowStepStatus.BLOCKED: [WorkflowStepStatus.READY, WorkflowStepStatus.NOT_STARTED],
    WorkflowStepStatus.COMPLETED: []
}

def can_transition(current: WorkflowStepStatus, target: WorkflowStepStatus) -> bool:
    \"\"\"Check if a workflow step can transition to the target state.\"\"\"
    if current == target:
        return True
    return target in VALID_TRANSITIONS.get(current, [])

def get_step_order() -> list[WorkflowStep]:
    \"\"\"Returns steps in pipeline order.\"\"\"
    return [
        WorkflowStep.AUTH,
        WorkflowStep.WORKSPACE,
        WorkflowStep.PRODUCT,
        WorkflowStep.UPLOAD,
        WorkflowStep.INGESTION,
        WorkflowStep.VALIDATION,
        WorkflowStep.CLEANING,
        WorkflowStep.NORMALIZATION,
        WorkflowStep.PREPROCESSING,
        WorkflowStep.AI_ANALYSIS
    ]
""",

    r"workflow\dependency_service.py": """from __future__ import annotations
from app.core.constants import WorkflowStep
from app.services.workflow.workflow_state import get_step_order

def get_dependencies(step: WorkflowStep) -> list[WorkflowStep]:
    \"\"\"Get steps that must complete before this step.\"\"\"
    order = get_step_order()
    try:
        idx = order.index(step)
        return order[:idx]
    except ValueError:
        return []

def is_step_ready(step: WorkflowStep, completed_steps: set[WorkflowStep]) -> bool:
    \"\"\"Check if all dependencies are met.\"\"\"
    deps = get_dependencies(step)
    return all(d in completed_steps for d in deps)

def get_next_step(completed_steps: set[WorkflowStep]) -> WorkflowStep | None:
    \"\"\"Get the next logical step to execute.\"\"\"
    order = get_step_order()
    for step in order:
        if step not in completed_steps and is_step_ready(step, completed_steps):
            return step
    return None

def get_blocked_steps(completed_steps: set[WorkflowStep]) -> list[WorkflowStep]:
    \"\"\"Get steps that cannot be started yet.\"\"\"
    order = get_step_order()
    blocked = []
    for step in order:
        if step not in completed_steps and not is_step_ready(step, completed_steps):
            blocked.append(step)
    return blocked
""",

    r"workflow\workflow_validator.py": """from __future__ import annotations
from app.core.constants import WorkflowStepStatus, WorkflowStep
from app.services.workflow.workflow_state import can_transition
from app.services.workflow.dependency_service import is_step_ready

def validate_step_transition(workflow: dict, step_name: str, target_status: str) -> tuple[bool, str]:
    \"\"\"
    Validate if a workflow step can change status.
    \"\"\"
    steps = workflow.get("steps", {})
    if step_name not in steps:
        return False, f"Step {step_name} not found in workflow"
        
    current_status_str = steps[step_name].get("status", "NOT_STARTED")
    try:
        current_status = WorkflowStepStatus[current_status_str]
        target_stat = WorkflowStepStatus[target_status]
    except KeyError:
        return False, "Invalid status enum"
        
    if not can_transition(current_status, target_stat):
        return False, f"Cannot transition from {current_status.name} to {target_status}"
        
    if target_stat in [WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.COMPLETED]:
        step_enum = WorkflowStep[step_name]
        completed = {
            WorkflowStep[s] for s, data in steps.items() 
            if data.get("status") == WorkflowStepStatus.COMPLETED.name
        }
        if not is_step_ready(step_enum, completed):
            return False, f"Dependencies not met for step {step_name}"
            
    return True, ""
""",

    r"workflow\workflow_service.py": """from __future__ import annotations
from app.models.workflow import WorkflowModel
from app.repositories.workflow_repository import workflow_repository
from app.services.workflow.workflow_validator import validate_step_transition
from app.services.workflow.workflow_state import get_step_order
from app.core.constants import WorkflowStepStatus, WorkflowStep
from app.core.exceptions import NotFoundError

def create_workflow(workspace_id: str, product_id: str, dataset_id: str) -> dict:
    \"\"\"Create a new workflow tracking document.\"\"\"
    doc = WorkflowModel.create_document(
        workspace_id=workspace_id,
        product_id=product_id,
        dataset_id=dataset_id
    )
    # Initialize steps
    order = get_step_order()
    doc["steps"] = {
        step.name: {"status": WorkflowStepStatus.NOT_STARTED.name, "metadata": {}}
        for step in order
    }
    doc["steps"][order[0].name]["status"] = WorkflowStepStatus.READY.name
    doc["current_step"] = order[0].name
    doc["progress_percentage"] = 0.0
    
    return workflow_repository.create(doc)

def get_workflow(workflow_id: str) -> dict:
    \"\"\"Get workflow by ID.\"\"\"
    workflow = workflow_repository.get_by_id(workflow_id)
    if not workflow:
        raise NotFoundError(f"Workflow {workflow_id} not found")
    return workflow

def get_workspace_workflow(workspace_id: str, dataset_id: str) -> dict | None:
    \"\"\"Get workflow by workspace and dataset.\"\"\"
    return workflow_repository.get_by_workspace_and_dataset(workspace_id, dataset_id)

def advance_step(workflow_id: str, step_name: str, status: str, metadata: dict = None) -> dict:
    \"\"\"Advance workflow step.\"\"\"
    workflow = get_workflow(workflow_id)
    
    is_valid, err = validate_step_transition(workflow, step_name, status)
    if not is_valid:
        raise ValueError(err)
        
    workflow["steps"][step_name]["status"] = status
    if metadata:
        workflow["steps"][step_name]["metadata"] = metadata
        
    workflow["progress_percentage"] = calculate_progress(workflow)
    
    # Update current_step logic
    if status == WorkflowStepStatus.COMPLETED.name:
        order = get_step_order()
        completed = {
            WorkflowStep[s] for s, data in workflow["steps"].items() 
            if data.get("status") == WorkflowStepStatus.COMPLETED.name
        }
        for s in order:
            if s not in completed:
                workflow["current_step"] = s.name
                workflow["steps"][s.name]["status"] = WorkflowStepStatus.READY.name
                break
                
    workflow_repository.update(workflow_id, workflow)
    return workflow

def calculate_progress(workflow: dict) -> float:
    \"\"\"Calculate completion percentage.\"\"\"
    steps = workflow.get("steps", {})
    if not steps:
        return 0.0
        
    completed = sum(1 for s in steps.values() if s.get("status") == WorkflowStepStatus.COMPLETED.name)
    return (completed / len(steps)) * 100.0
"""
}

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {full_path}")
