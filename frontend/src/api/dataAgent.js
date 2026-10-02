/**
 * dataAgent.js
 * ------------
 * Data Agent Dirty Data Cleaning, Validation & Preprocessing APIs.
 */

import { apiRequest } from './core';

export const dataAgentApi = {
  runPipeline: async (datasetId, workspaceId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/pipeline?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  inspect: async (datasetId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/inspect`);
  },

  getSummary: async (datasetId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/summary`);
  },

  listTools: async () => {
    return apiRequest('/data-agent/tools');
  },

  validate: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/validate?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getValidation: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/validation`);
  },

  clean: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/clean?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getCleaning: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/cleaning`);
  },

  preprocess: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/preprocess?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getPreprocessing: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/preprocessing`);
  },

  aiCheck: async (datasetId, sampleSize = 10) => {
    return apiRequest(`/datasets/${datasetId}/ai-check?sample_size=${sampleSize}`);
  },

  getRecords: async (datasetId, stage = 'raw', skip = 0, limit = 50) => {
    return apiRequest(`/datasets/${datasetId}/records?stage=${stage}&skip=${skip}&limit=${limit}`);
  },
};

