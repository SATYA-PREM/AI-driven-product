/**
 * stakeholder.js
 * --------------
 * Frontend API client for Business Owner / Stakeholder Workspace:
 * - Executive dashboard KPI cards and synced product data
 * - Product overview & strategic alignment
 * - Business objectives and progress
 * - Roadmap & initiative portfolio
 * - Pending approvals & decision submission
 * - Decision history audit trail
 * - PRD business review & structured feedback
 * - Milestones and progress
 * - Business impact & success metrics
 * - Business risks and dependencies
 * - Actionable notifications
 */

import { apiRequest } from './core';

export const stakeholderApi = {
  // 1. Dashboard
  getDashboard: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/dashboard`);
  },

  // 2. Product Overview
  getProductOverview: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/product-overview`);
  },

  // 3. Business Objectives
  getObjectives: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/objectives`);
  },

  getObjectiveDetail: async (workspaceId, objectiveId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/objectives/${objectiveId}`);
  },

  // 4. Roadmap & Feature Portfolio
  getRoadmap: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/roadmap`);
  },

  // 5. Pending Approvals & Decisions
  getApprovals: async (workspaceId, status = null) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/approvals${query}`);
  },

  getApprovalDetail: async (workspaceId, requestId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/approvals/${requestId}`);
  },

  submitDecision: async (workspaceId, requestId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/approvals/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDecisionHistory: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/decisions`);
  },

  // 6. PRD Business Review & Feedback
  getPRDBusinessReview: async (workspaceId, prdId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/prd-review/${prdId}`);
  },

  getFeedback: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/feedback`);
  },

  submitFeedback: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  respondToFeedback: async (workspaceId, feedbackId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/feedback/${feedbackId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 7. Milestones & Progress
  getMilestones: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/milestones`);
  },

  // 8. Business Impact & Success Metrics
  getMetrics: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/metrics`);
  },

  // 9. Risks & Dependencies
  getRisksAndDependencies: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/risks`);
  },

  // 10. Notifications
  getNotifications: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/notifications`);
  },

  markNotificationRead: async (workspaceId, notificationId) => {
    return apiRequest(`/workspaces/${workspaceId}/stakeholder/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },
};

