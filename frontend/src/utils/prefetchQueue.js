/**
 * prefetchQueue.js
 * ----------------
 * Priority Prefetch Queue and Background In-Memory Cache Coordinator.
 *
 * Requirements Met:
 * 1. Priority 1 (Foreground): The active page requested by the user always loads first.
 * 2. Priority 2 (Background Queue): All other role-relevant sidebar pages/data load
 *    in the background via MongoDB Atlas pre-warming and are stored in session/memory cache.
 * 3. 0ms Navigation: Changing pages from the sidebar retrieves data instantly without reload spinners.
 * 4. Workspace Switch: On workspace switch, any in-flight prefetch is aborted immediately,
 *    allowing the newly selected workspace's active page to load first, followed by background prefetching.
 */

import { setSessionCache, getSessionCache, API_BASE_URL, getStoredToken } from '../api/core';

let activeAbortController = null;
let activeWorkspacePrefetchId = null;
let lastPrefetchedWorkspace = null;
let lastPrefetchedTime = 0;
const PREFETCH_CACHE_TTL_MS = 180000; // 3 minutes

/**
 * Cancels any active background prefetch operation.
 * Used when switching workspaces or logging out.
 */
export function cancelWorkspacePrefetch() {
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {}
    activeAbortController = null;
  }
  activeWorkspacePrefetchId = null;
}

/**
 * Initiates the background prefetch for a workspace after allowing the current
 * active page's foreground request to start first.
 *
 * @param {string} workspaceId - The workspace identifier
 * @param {string} role - The active user's role
 * @param {string} currentPath - Current route pathname (to ensure active page has priority)
 */
export function startWorkspacePrefetch(workspaceId, role = 'product_manager', currentPath = '') {
  if (!workspaceId) return;

  // Don't re-fetch if this workspace was already prewarmed within PREFETCH_CACHE_TTL_MS
  const now = Date.now();
  if (
    lastPrefetchedWorkspace === `${workspaceId}:${role}` &&
    now - lastPrefetchedTime < PREFETCH_CACHE_TTL_MS
  ) {
    return;
  }

  // Cancel prior in-flight prefetch (especially important on workspace switch)
  cancelWorkspacePrefetch();

  const controller = new AbortController();
  activeAbortController = controller;
  activeWorkspacePrefetchId = workspaceId;

  // Wait 300ms to yield the network thread to the active foreground page request
  const timer = setTimeout(async () => {
    if (controller.signal.aborted || activeWorkspacePrefetchId !== workspaceId) {
      return;
    }

    try {
      const token = getStoredToken();
      const currentPathQuery = currentPath ? `&current_path=${encodeURIComponent(currentPath)}` : '';
      const url = `${API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/prewarm?role=${encodeURIComponent(role)}${currentPathQuery}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return;
      }

      const bundle = await res.json();
      if (bundle && bundle.routes && typeof bundle.routes === 'object') {
        // Hydrate the session/in-memory cache for 0ms sidebar navigations
        Object.entries(bundle.routes).forEach(([routePath, data]) => {
          setSessionCache(routePath, data, PREFETCH_CACHE_TTL_MS);
        });

        lastPrefetchedWorkspace = `${workspaceId}:${role}`;
        lastPrefetchedTime = Date.now();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Soft fail; non-critical background operation
        console.debug('Background prewarm notice:', err.message);
      }
    } finally {
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  }, 300);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}

