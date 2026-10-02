/**
 * reports.js
 * ----------
 * Executive Reports & Documentation APIs.
 */

import { apiRequest } from './core';

export const reportApi = {
  getLatestReport: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/reports/latest${query}`);
  },

  generateReport: async (workspaceId, datasetId = null, reportType = 'executive_summary') => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (reportType) params.append('report_type', reportType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/reports${query}`, {
      method: 'POST',
    });
  },
};

