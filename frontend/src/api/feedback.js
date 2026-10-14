/**
 * feedback.js
 * -----------
 * Customer Feedback & Feature Mapping APIs.
 */

import { apiRequest } from './core';

export const feedbackApi = {
  listFeedback: async (workspaceId, params = {}) => {
    const q = new URLSearchParams();
    if (params.dataset_id && params.dataset_id !== 'all') q.append('dataset_id', params.dataset_id);
    if (params.status && params.status !== 'All') q.append('status', params.status);
    if (params.sentiment && params.sentiment !== 'All') q.append('sentiment', params.sentiment);
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.source && params.source !== 'All') q.append('source', params.source);
    if (params.priority && params.priority !== 'All') q.append('priority', params.priority);
    if (params.assigned_to && params.assigned_to !== 'All') q.append('assigned_to', params.assigned_to);
    if (params.mapped !== undefined && params.mapped !== null) q.append('mapped', String(params.mapped));
    if (params.search) q.append('search', params.search);
    if (params.skip) q.append('skip', String(params.skip));
    if (params.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/feedback${qs}`);
  },

  getMetrics: async (workspaceId, params = {}) => {
    const q = new URLSearchParams();
    if (params.dataset_id && params.dataset_id !== 'all') q.append('dataset_id', params.dataset_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/feedback/metrics${qs}`);
  },

  getFeedback: async (workspaceId, feedbackId) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}`);
  },

  createFeedback: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  updateFeedback: async (workspaceId, feedbackId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  mapFeature: async (workspaceId, feedbackId, data = {}) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}/map-feature`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },
};

