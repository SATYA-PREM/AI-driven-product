/**
 * features.js
 * -----------
 * Product Features Management, Extraction & Prioritization APIs.
 */

import { apiRequest } from './core';

export const featureApi = {
  list: async (workspaceId, params = {}) => {
    const q = new URLSearchParams();
    if (params.dataset_id) q.append('dataset_id', params.dataset_id);
    if (params.status && params.status !== 'All') q.append('status', params.status);
    if (params.priority && params.priority !== 'All') q.append('priority', params.priority);
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.source && params.source !== 'All') q.append('source', params.source);
    if (params.search) q.append('search', params.search);
    if (params.skip) q.append('skip', String(params.skip));
    if (params.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/features${qs}`);
  },

  get: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}`);
  },

  create: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/features`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  update: async (workspaceId, featureId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  extract: async (workspaceId, datasetId = null) => {
    const qs = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/features/extract${qs}`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  sendToPrioritization: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/send-to-prioritization`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  linkPrd: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/link-prd`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  addToRoadmap: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/add-to-roadmap`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  // Aliases for compatibility
  listFeatures: async (workspaceId, params = {}) => featureApi.list(workspaceId, params),
  getFeature: async (workspaceId, featureId) => featureApi.get(workspaceId, featureId),
  createFeature: async (workspaceId, data) => featureApi.create(workspaceId, data),
  updateFeature: async (workspaceId, featureId, data) => featureApi.update(workspaceId, featureId, data),
  extractFeatures: async (workspaceId, datasetId = null) => featureApi.extract(workspaceId, datasetId),
};

