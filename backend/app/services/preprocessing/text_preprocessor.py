from __future__ import annotations
from app.utils.text_utils import remove_html_tags, clean_encoding, normalize_text
import re


class TextPreprocessor:
    """Preprocesses raw text for AI model readiness."""

    def preprocess_text(self, text: str) -> str:
        if not text:
            return ""
        text = clean_encoding(text)
        text = remove_html_tags(text)
        return normalize_text(text)


text_preprocessor = TextPreprocessor()
preprocess_text = text_preprocessor.preprocess_text
