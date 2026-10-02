/**
 * aiAnalysis.js
 * -------------
 * AI Analysis Pipeline (CrewAI 3-Agent Flow) APIs.
 */

import { apiRequest } from './core';

export const aiAnalysisApi = {
  startAnalysis: async (datasetId, payload = {}) => {
    return apiRequest(`/datasets/${datasetId}/analysis`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getJobStatus: async (jobId) => {
    return apiRequest(`/analysis/jobs/${jobId}`);
  },

  retryStage: async (jobId, stageName) => {
    return apiRequest(`/analysis/jobs/${jobId}/retry?stage_name=${encodeURIComponent(stageName)}`, {
      method: 'POST',
    });
  },

  getDatasetAnalyses: async (datasetId, skip = 0, limit = 0) => {
    return apiRequest(`/datasets/${datasetId}/analyses?skip=${skip}&limit=${limit}`);
  },

  getRecordAnalysis: async (recordId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/analysis/${recordId}${query}`);
  },
};

