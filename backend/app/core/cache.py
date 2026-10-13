"""
cache.py
--------
High-speed in-memory TTL caching layer for Product Intelligence API.
Caches read-heavy MongoDB queries in memory to eliminate repeated network round-trips to Atlas.
Thread-safe with TTL expiration and pattern-based invalidation.
"""

from __future__ import annotations

import time
import threading
from typing import Any, Callable


class InMemoryTTLCache:
    """Thread-safe in-memory cache with TTL expiration."""

    def __init__(self, default_ttl_seconds: int = 120):
        self._lock = threading.Lock()
        self._store: dict[str, tuple[Any, float]] = {}
        self.default_ttl = default_ttl_seconds

    def get(self, key: str) -> Any | None:
        """Retrieve item if not expired, otherwise clean up and return None."""
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            val, expiry = entry
            if time.time() > expiry:
                del self._store[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Store item with expiration timestamp."""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expiry = time.time() + ttl
        with self._lock:
            self._store[key] = (value, expiry)

    def invalidate(self, key: str) -> None:
        """Remove single key from cache."""
        with self._lock:
            self._store.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        """Invalidate all keys starting with prefix (e.g. for a specific workspace_id)."""
        with self._lock:
            keys_to_delete = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._store[k]

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._store.clear()


# Global in-memory cache instance
memory_cache = InMemoryTTLCache(default_ttl_seconds=180)

