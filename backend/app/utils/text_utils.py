"""
text_utils.py
--------------
Text normalization and processing utilities.
Used by cleaning and preprocessing services.
"""

from __future__ import annotations

import re
import unicodedata


def normalize_text(text: str) -> str:
    """
    Normalize text for storage and comparison:
    - Strip leading/trailing whitespace
    - Lowercase
    - Remove excessive punctuation repetitions (!!!  -> !)
    - Collapse multiple whitespace to single space
    - Normalize unicode characters
    """
    if not text:
        return ""

    # Unicode normalization (NFC form)
    text = unicodedata.normalize("NFC", text)

    # Strip and lowercase
    text = text.strip().lower()

    # Remove repeated punctuation (3+ of the same char -> single)
    text = re.sub(r'([!?.]){2,}', r'\1', text)

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


def normalize_whitespace(text: str) -> str:
    """Collapse all whitespace (including newlines) to single spaces."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()


def remove_html_tags(text: str) -> str:
    """Remove HTML/script/style tags and their inner script content from text."""
    if not text:
        return ""
    # Remove script and style tags along with their content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove remaining HTML tags
    return re.sub(r'<[^>]+>', '', text)


def clean_encoding(text: str) -> str:
    """
    Fix common encoding issues:
    - Remove null bytes
    - Replace common mojibake patterns
    - Normalize unicode
    """
    if not text:
        return ""

    # Remove null bytes
    text = text.replace('\x00', '')

    # Normalize unicode
    text = unicodedata.normalize("NFC", text)

    # Remove control characters (except newline, tab)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    return text


def extract_key_phrases(text: str, max_phrases: int = 5) -> list[str]:
    """
    Simple key phrase extraction by splitting on common delimiters.
    For more sophisticated extraction, use the AI service.
    """
    if not text:
        return []

    # Split on sentence boundaries
    sentences = re.split(r'[.!?]+', text)
    phrases = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    return phrases[:max_phrases]


def compute_text_hash(text: str) -> str:
    """
    Compute a normalized hash of text for deduplication.
    The text is lowered, whitespace-collapsed, and then hashed.
    """
    import hashlib
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def is_meaningful_text(text: str, min_length: int = 3) -> bool:
    """Check whether text is long enough to be meaningful."""
    if not text:
        return False
    cleaned = normalize_whitespace(text)
    return len(cleaned) >= min_length
