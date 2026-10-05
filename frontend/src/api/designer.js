/**
 * designer.js
 * -----------
 * Product Designer Workspace APIs (Dashboard, Assignments, Product Context, UX Requirements, Customer Feedback & Responses).
 */

import { apiRequest } from './core';

export const designerApi = {
  getDashboard: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/dashboard`);
  },

  getAssignments: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments`);
  },

  getProductContext: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/product-context`);
  },

  getUXRequirements: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/ux-requirements`);
  },

  getCustomerFeedback: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/customer-feedback`);
  },

  submitResponse: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/response`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

