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

  getAssignmentDetail: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}`);
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

  getSubmissions: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/submissions`);
  },

  reviewSubmission: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getReviews: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/reviews`);
  },

  reportBlocker: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/blocker`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBlockers: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/blockers`);
  },

  requestClarification: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/clarification`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getClarifications: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/designer/assignments/${assignmentId}/clarifications`);
  },
};

