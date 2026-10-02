/**
 * prd.js
 * ------
 * PRD Studio, PM Reviews, Context Previews & AI PRD Generation APIs.
 */

import { apiRequest } from './core';

export const prdApi = {
  listPMReviews: async (workspaceId, { datasetId, sourceType } = {}) => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (sourceType && sourceType !== 'all') params.append('source_type', sourceType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/prd/pm-reviews${qs}`);
  },

  approvePMReview: async (workspaceId, reviewId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/pm-reviews/${encodeURIComponent(reviewId)}/approve`, {
      method: 'POST',
    });
  },

  getContextPreview: async (workspaceId, sourceReviewId = 'REV-001', { datasetId, sourceType } = {}) => {
    const params = new URLSearchParams();
    params.append('source_review_id', sourceReviewId);
    if (datasetId) params.append('dataset_id', datasetId);
    if (sourceType && sourceType !== 'all') params.append('source_type', sourceType);
    return apiRequest(`/workspaces/${workspaceId}/prd/context-preview?${params.toString()}`);
  },

  generatePRD: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listProjects: async (workspaceId, { datasetId, sourceType } = {}) => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (sourceType && sourceType !== 'all') params.append('source_type', sourceType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/prd/projects${qs}`);
  },

  getPRD: async (workspaceId, prdId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}`);
  },

  updatePRD: async (workspaceId, prdId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  submitReview: async (workspaceId, prdId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitReviewGate: async (workspaceId, prdId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateStories: async (workspaceId, prdId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/generate-stories`, {
      method: 'POST',
    });
  },

  generateUserStories: async (workspaceId, prdId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/generate-stories`, {
      method: 'POST',
    });
  },

  generateCirculationPackage: async (workspaceId, prdId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/circulation-package`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProvenance: async (workspaceId, prdId, itemType, itemId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd/${prdId}/provenance/${itemType}/${itemId}`);
  },
};

