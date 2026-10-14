/**
 * preloader.js
 * ------------
 * Intelligent workspace & dataset background preloader with SWR (Stale-While-Revalidate).
 *
 * Responsibilities:
 * 1. Warm-up preloading once user logs in and workspace is selected.
 * 2. Fetches MongoDB data well in advance (Datasets, Feedback metrics, Summary, PRDs, Assignments).
 * 3. Keeps data in fast session & memory cache.
 * 4. Enables SWR: when navigating or changing tabs, immediately displays cached data in front
 *    (0ms lag) while non-blockingly revalidating in the background and updating UI smoothly.
 */

import { apiRequest, getSessionCache, setSessionCache, normalizeCacheKey } from './core';

// In-flight request deduplication map to prevent multiple identical requests
const pendingFetches = new Map();

/**
 * Preloads an endpoint asynchronously. Returns cached data if fresh, or triggers background fetch.
 */
export async function preloadEndpoint(endpoint, options = {}) {
  if (!endpoint) return null;
  const isBypass = options.bypassCache === true;
  const cached = !isBypass ? getSessionCache(endpoint) : null;

  // Deduplicate inflight fetches
  const normKey = normalizeCacheKey(endpoint);
  if (pendingFetches.has(normKey)) {
    if (cached !== null) return cached;
    return pendingFetches.get(normKey);
  }

  const fetchPromise = (async () => {
    try {
      const data = await apiRequest(endpoint, { ...options, bypassCache: true });
      if (data) {
        setSessionCache(endpoint, data, options.ttlMs || 300000); // 5 min default
        window.dispatchEvent(
          new CustomEvent('cache_updated', {
            detail: { endpoint, normalizedKey: normKey, data },
          })
        );
      }
      return data;
    } catch (err) {
      console.warn(`[Preloader] Background fetch skipped for ${endpoint}:`, err.message);
      return cached;
    } finally {
      pendingFetches.delete(normKey);
    }
  })();

  pendingFetches.set(normKey, fetchPromise);

  // If we already have cache, return cache immediately without awaiting background network
  if (cached !== null) {
    return cached;
  }

  return fetchPromise;
}

/**
 * Preload core workspace data as soon as login succeeds and workspace is selected.
 * Tailored by role (Product Manager, Designer, Developer, QA, Stakeholder).
 */
export function preloadWorkspaceData(workspaceId, role = 'member', options = {}) {
  if (!workspaceId || workspaceId === 'default-workspace' || workspaceId === 'ws_demo_01') {
    return;
  }

  const roleKey = String(role || '').toLowerCase();
  const dsId = options.datasetId || null;
  const dsQuery = dsId && dsId !== 'all' ? `?dataset_id=${encodeURIComponent(dsId)}` : '';

  // 1. Universal Base Preloads for any logged-in user with active workspace
  const universalEndpoints = [
    `/workspaces/${workspaceId}`,
    `/workspaces/${workspaceId}/members`,
    `/workspaces/${workspaceId}/activity?limit=20`,
    `/datasets?workspace_id=${encodeURIComponent(workspaceId)}`,
    `/products/?workspace_id=${encodeURIComponent(workspaceId)}`,
  ];

  // 2. Role-specific high-priority endpoints
  const roleEndpoints = [];

  // Designer
  if (['designer', 'product_designer', 'product designer', 'ux', 'ux_designer'].includes(roleKey)) {
    roleEndpoints.push(
      `/workspaces/${workspaceId}/designer/dashboard`,
      `/workspaces/${workspaceId}/designer/assignments`,
      `/workspaces/${workspaceId}/designer/ux-requirements`,
      `/workspaces/${workspaceId}/designer/customer-feedback`,
      `/workspaces/${workspaceId}/designer/product-context`
    );
  }
  // Developer
  else if (['developer', 'dev', 'engineer', 'lead_engineer', 'lead engineer'].includes(roleKey)) {
    roleEndpoints.push(
      `/workspaces/${workspaceId}/developer/dashboard`,
      `/workspaces/${workspaceId}/developer/assignments`,
      `/workspaces/${workspaceId}/developer/defects`
    );
  }
  // QA Lead
  else if (['qa', 'tester', 'qa_tester', 'quality_assurance'].includes(roleKey)) {
    roleEndpoints.push(
      `/workspaces/${workspaceId}/qa/dashboard`,
      `/workspaces/${workspaceId}/qa/assignments`,
      `/workspaces/${workspaceId}/qa/defects`
    );
  }
  // Stakeholder
  else if (['stakeholder', 'business', 'business_owner', 'business owner'].includes(roleKey)) {
    roleEndpoints.push(
      `/workspaces/${workspaceId}/stakeholder/dashboard`,
      `/workspaces/${workspaceId}/stakeholder/product-overview`,
      `/workspaces/${workspaceId}/stakeholder/objectives`,
      `/workspaces/${workspaceId}/stakeholder/roadmap`
    );
  }
  // Product Manager / Admin (Full spectrum intelligence)
  else {
    roleEndpoints.push(
      `/workspaces/${workspaceId}/intelligence/summary${dsQuery}`,
      `/workspaces/${workspaceId}/intelligence/issues${dsQuery ? `${dsQuery}&limit=20` : '?limit=20'}`,
      `/workspaces/${workspaceId}/intelligence/features${dsQuery ? `${dsQuery}&limit=20` : '?limit=20'}`,
      `/workspaces/${workspaceId}/intelligence/sentiment${dsQuery}`,
      `/workspaces/${workspaceId}/intelligence/trends${dsQuery}`,
      `/workspaces/${workspaceId}/intelligence/insights${dsQuery ? `${dsQuery}&limit=20` : '?limit=20'}`,
      `/workspaces/${workspaceId}/reports/latest`,
      `/workspaces/${workspaceId}/prd/projects${dsQuery}`,
      `/workspaces/${workspaceId}/prd-assignments/team-responses`,
      `/workspaces/${workspaceId}/feedback/metrics${dsQuery}`,
      `/workspaces/${workspaceId}/feedback${dsQuery ? `${dsQuery}&limit=50` : '?limit=50'}`
    );
  }

  // Preload in gentle non-blocking batches
  const allEndpoints = [...universalEndpoints, ...roleEndpoints];
  
  // Use requestIdleCallback or setTimeout to keep UI silky smooth
  const scheduler = typeof window !== 'undefined' && window.requestIdleCallback 
    ? window.requestIdleCallback 
    : (cb) => setTimeout(cb, 50);

  scheduler(() => {
    allEndpoints.forEach((ep, index) => {
      // Stagger background requests by 35ms to avoid slamming backend socket pool
      setTimeout(() => {
        preloadEndpoint(ep);
      }, index * 35);
    });
  });
}

