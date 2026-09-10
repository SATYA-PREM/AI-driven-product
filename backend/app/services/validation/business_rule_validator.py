from __future__ import annotations
from app.core.constants import SourceType


class BusinessRuleValidator:
    """Validator for business domain rules per source type."""

    def validate_business_rules(self, record: dict, source_type: str) -> tuple[bool, list[str]]:
        errors = []
        st = source_type.lower() if isinstance(source_type, str) else source_type.value

        if st == SourceType.FEEDBACK.value:
            if not record.get("customer_id") or str(record.get("customer_id")).strip() == "":
                errors.append("FEEDBACK requires a valid 'customer_id'")
            if not record.get("feedback") or str(record.get("feedback")).strip() == "":
                errors.append("FEEDBACK requires non-empty 'feedback' text")
        elif st == SourceType.REVIEW.value:
            if not record.get("review_id") or str(record.get("review_id")).strip() == "":
                errors.append("REVIEW requires a valid 'review_id'")
            if not record.get("review_text") or str(record.get("review_text")).strip() == "":
                errors.append("REVIEW requires non-empty 'review_text'")
        elif st == SourceType.SUPPORT_TICKET.value:
            if not record.get("ticket_id") or str(record.get("ticket_id")).strip() == "":
                errors.append("SUPPORT_TICKET requires a valid 'ticket_id'")
            if not record.get("description") or str(record.get("description")).strip() == "":
                errors.append("SUPPORT_TICKET requires non-empty 'description'")

        is_valid = len(errors) == 0
        return is_valid, errors


business_rule_validator = BusinessRuleValidator()
validate_business_rules = business_rule_validator.validate_business_rules
