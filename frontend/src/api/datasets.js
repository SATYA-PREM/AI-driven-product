/**
 * datasets.js
 * -----------
 * Dataset Upload, List, Workflow Status & Record APIs.
 */

import { apiRequest, getStoredToken, API_BASE_URL } from './core';

export const datasetApi = {
  upload: async (workspaceId, productId, file, sourceType = 'feedback', datasetName = '') => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const queryParams = {
      workspace_id: workspaceId,
      product_id: productId || 'default-product',
      source_type: sourceType,
    };
    if (datasetName) queryParams.dataset_name = datasetName;
    const query = new URLSearchParams(queryParams);
    const response = await fetch(`${API_BASE_URL}/datasets/upload?${query.toString()}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let msg = err.detail || 'Upload failed';
      if (Array.isArray(err.detail)) {
        msg = err.detail.map((e) => e.msg).join(' | ');
      }
      throw new Error(msg);
    }
    return response.json();
  },

  list: async (workspaceId) => {
    return apiRequest(`/datasets?workspace_id=${encodeURIComponent(workspaceId)}`);
  },

  listDatasets: async (workspaceId) => {
    return apiRequest(`/datasets?workspace_id=${encodeURIComponent(workspaceId)}`);
  },

  getDataset: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}`);
  },

  getWorkflowStatus: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/status`);
  },

  getRecords: async (datasetId, stage = 'raw', skip = 0, limit = 50) => {
    return apiRequest(`/datasets/${datasetId}/records?stage=${encodeURIComponent(stage)}&skip=${skip}&limit=${limit}`);
  },

  update: async (datasetId, payload) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  updateDataset: async (datasetId, payload) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteDataset: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'DELETE',
    });
  },
};

