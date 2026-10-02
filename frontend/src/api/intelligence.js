/**
 * intelligence.js
 * ---------------
 * Product Intelligence, Overview, Issues, Insights, Sentiment & Comparisons APIs.
 */

import { apiRequest } from './core';

function buildQueryParams(opts, defaultLimit) {
  const params = new URLSearchParams();
  if (typeof opts === 'string') {
    if (opts) params.append('dataset_id', opts);
  } else if (opts && typeof opts === 'object') {
    if (opts.dataset_id) params.append('dataset_id', opts.dataset_id);
    if (opts.product_id) params.append('product_id', opts.product_id);
    if (opts.limit || defaultLimit) params.append('limit', String(opts.limit || defaultLimit));
  } else if (defaultLimit) {
    params.append('limit', String(defaultLimit));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const intelligenceApi = {
  getSummary: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/summary${buildQueryParams(opts)}`);
  },

  getOverview: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence${buildQueryParams(opts)}`);
  },

  getIssues: async (workspaceId, opts = null, limit = 50) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/issues${buildQueryParams(opts, limit)}`);
  },

  getFeatures: async (workspaceId, opts = null, limit = 30) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/features${buildQueryParams(opts, limit)}`);
  },

  getSentiment: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/sentiment${buildQueryParams(opts)}`);
  },

  getTrends: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/trends${buildQueryParams(opts)}`);
  },

  getInsights: async (workspaceId, opts = null, limit = 50) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights${buildQueryParams(opts, limit)}`);
  },

  getComparison: async (workspaceId, comparisonType = 'Time Comparison', opts = null, quickRange = 'Last 30 Days') => {
    const params = new URLSearchParams();
    if (comparisonType) params.append('comparison_type', comparisonType);
    if (quickRange) params.append('quick_range', quickRange);
    if (typeof opts === 'string') {
      if (opts) params.append('dataset_id', opts);
    } else if (opts && typeof opts === 'object') {
      if (opts.dataset_id) params.append('dataset_id', opts.dataset_id);
      if (opts.product_id) params.append('product_id', opts.product_id);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/comparison${query}`);
  },

  submitInsightReview: async (workspaceId, insightId, reviewData) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights/${insightId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
      bypassCache: true,
    });
  },

  getInsightEvidence: async (workspaceId, insightId) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights/${insightId}/evidence`, {
      bypassCache: true,
    });
  },
};

