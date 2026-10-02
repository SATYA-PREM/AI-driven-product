/**
 * workflow.js
 * -----------
 * Pipeline Workflow State APIs.
 */

import { apiRequest } from './core';

export const workflowStateApi = {
  getWorkflow: async (workflowId) => {
    return apiRequest(`/workflows/${workflowId}`);
  },

  getWorkspaceWorkflow: async (workspaceId, datasetId = null) => {
    const qs = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/workflow${qs}`);
  },
};

