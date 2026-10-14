"""
gemini_pool.py
--------------
Multi-key load balancer and failover manager for Google Gemini API.
Features:
1. Thread-safe Round-Robin key distribution across multiple keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3).
2. Per-key rate-limit detection (429 / RESOURCE_EXHAUSTED / quota) with independent cooldowns.
3. Automatic instant key failover: if Key 1 hits a rate limit or error, Key 2 and Key 3 take over immediately.
4. Parallel worker execution support: provides separate clients to concurrent agents so workloads run in parallel across keys.
"""

from __future__ import annotations

import itertools
import random
import re
import threading
import time
from typing import Any, Callable, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiKeyManager:
    """
    Manages a pool of Gemini API keys with round-robin rotation,
    per-key rate limit circuit breaking, and instant failover.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._key_cooldowns: Dict[str, float] = {}
        self._clients: Dict[str, Any] = {}
        self._round_robin_index = 0

    def get_all_keys(self) -> List[str]:
        """Returns all configured keys."""
        return settings.gemini_api_keys

    def get_client_for_key(self, api_key: str) -> Optional[Any]:
        """Gets or caches a google.genai Client for a specific API key."""
        if not api_key:
            return None
        with self._lock:
            if api_key in self._clients:
                return self._clients[api_key]
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                self._clients[api_key] = client
                return client
            except Exception as e:
                logger.warning(f"Failed to create genai.Client for key {api_key[:8]}...: {e}")
                return None

    def is_key_in_cooldown(self, api_key: str) -> bool:
        """Checks if a key is currently in rate-limit cooldown."""
        with self._lock:
            cooldown = self._key_cooldowns.get(api_key, 0.0)
            return time.time() < cooldown

    def mark_key_rate_limited(self, api_key: str, error_msg: str = "") -> None:
        """Puts a specific key into temporary cooldown when 429 / quota limit is hit."""
        # Attempt to parse suggested retry delay
        match = re.search(r"retry in (\d+(?:\.\d+)?)s", error_msg, re.IGNORECASE)
        retry_seconds = float(match.group(1)) + 2.0 if match else 60.0
        # Cap cooldown between 15s and 120s for graceful recovery
        retry_seconds = max(15.0, min(120.0, retry_seconds))
        with self._lock:
            self._key_cooldowns[api_key] = time.time() + retry_seconds
            logger.warning(
                f"Gemini API key {api_key[:8]}... rate-limited (429/quota). "
                f"Cooldown set for {retry_seconds:.1f}s. Rotating immediately to next available key."
            )

    def get_available_clients(self) -> List[Tuple[str, Any]]:
        """
        Returns (api_key, client) tuples for all keys that are currently NOT in cooldown.
        If all are in cooldown, returns all keys anyway as a fallback attempt.
        """
        all_keys = self.get_all_keys()
        if not all_keys:
            return []

        now = time.time()
        with self._lock:
            available = [
                k for k in all_keys
                if self._key_cooldowns.get(k, 0.0) <= now
            ]
        
        # If all keys are currently cooling down, fallback to trying all
        keys_to_use = available if available else all_keys
        
        result = []
        for k in keys_to_use:
            cl = self.get_client_for_key(k)
            if cl:
                result.append((k, cl))
        return result

    def get_next_client(self) -> Tuple[Optional[str], Optional[Any]]:
        """
        Selects the next client via round-robin among currently available (non-cooldown) keys.
        This balances load across keys and ensures multi-agent pipelines distribute requests evenly.
        """
        available = self.get_available_clients()
        if not available:
            return None, None

        with self._lock:
            self._round_robin_index = (self._round_robin_index + 1) % len(available)
            selected_key, selected_client = available[self._round_robin_index]
            return selected_key, selected_client

    def execute_with_failover(
        self,
        call_fn: Callable[[Any, str], Any],
        max_key_attempts: Optional[int] = None,
    ) -> Any:
        """
        Executes a Gemini call across the key pool with automatic failover:
        - Tries an available key.
        - If rate limit (429 / RESOURCE_EXHAUSTED / quota) occurs, marks that key and immediately switches to the next key.
        - If all keys fail, raises the last exception.
        """
        all_keys = self.get_all_keys()
        if not all_keys:
            raise ValueError("No GEMINI_API_KEY configured in environment.")

        # Reorder keys starting with the next round-robin key
        with self._lock:
            start_idx = self._round_robin_index % len(all_keys)
            self._round_robin_index = (self._round_robin_index + 1) % len(all_keys)

        ordered_keys = all_keys[start_idx:] + all_keys[:start_idx]
        
        # Prioritize non-cooling keys first
        now = time.time()
        with self._lock:
            active_keys = [k for k in ordered_keys if self._key_cooldowns.get(k, 0.0) <= now]
            cooling_keys = [k for k in ordered_keys if self._key_cooldowns.get(k, 0.0) > now]
        keys_to_try = active_keys + cooling_keys

        limit = max_key_attempts or len(keys_to_try)
        last_error = None

        for attempt, key in enumerate(keys_to_try[:limit]):
            client = self.get_client_for_key(key)
            if not client:
                continue

            try:
                return call_fn(client, key)
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                is_rate_limit = any(term in err_str for term in ["429", "resource_exhausted", "quota", "rate limit", "too many requests"])
                
                if is_rate_limit:
                    self.mark_key_rate_limited(key, str(e))
                    logger.info(f"Switching from rate-limited key {key[:8]}... to alternate key in pool (attempt {attempt + 1}/{limit}).")
                    continue
                else:
                    # Non-rate-limit error (e.g. malformed model prompt or 404)
                    logger.warning(f"Gemini call error on key {key[:8]}...: {e}")
                    # Try next key in case it's key-specific permission/status
                    continue

        if last_error:
            raise last_error
        raise RuntimeError("All Gemini API keys in the pool failed to execute request.")


gemini_pool = GeminiKeyManager()

