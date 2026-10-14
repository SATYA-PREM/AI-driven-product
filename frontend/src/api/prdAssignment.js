/**
 * prdAssignment.js
 * ----------------
 * PRD Team Assignments & Downstream Handoff APIs.
 */

import { apiRequest } from './core';

export const prdAssignmentApi = {
  getWorkspaceTeamMembers: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/team-members`);
  },

  listAssignments: async (workspaceId, params = {}) => {
    const query = new URLSearchParams();
    if (params.prd_ids && Array.isArray(params.prd_ids)) {
      params.prd_ids.forEach((id) => query.append('prd_ids', id));
    }
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.status) query.append('status', params.status);
    const qStr = query.toString();
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments${qStr ? `?${qStr}` : ''}`);
  },

  getPRDAssignments: async (prdId, workspaceId) => {
    return apiRequest(`/prds/${prdId}/assignments?workspace_id=${workspaceId}`);
  },

  getAssignmentSummary: async (workspaceId, prdIds = []) => {
    const query = new URLSearchParams();
    prdIds.forEach((id) => query.append('prd_ids', id));
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/summary?${query.toString()}`);
  },

  createAssignmentJob: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignment/jobs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getJobStatus: async (jobId) => {
    return apiRequest(`/prd-assignment/jobs/${jobId}`);
  },

  getPRDRecommendations: async (prdId) => {
    return apiRequest(`/prds/${prdId}/assignment-recommendations`);
  },

  acceptRecommendation: async (recommendationId, { workspaceId, prdId, requirementId }) => {
    return apiRequest(
      `/prd-assignments/recommendations/${recommendationId}/accept?workspace_id=${workspaceId}&prd_id=${prdId}&requirement_id=${requirementId}`,
      { method: 'POST' }
    );
  },

  rejectRecommendation: async (recommendationId, { reason = '' } = {}) => {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiRequest(`/prd-assignments/recommendations/${recommendationId}/reject${q}`, {
      method: 'POST',
    });
  },

  createManualAssignment: async (workspaceId, payload) => {
    return apiRequest(`/prd-assignments?workspace_id=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAssignment: async (assignmentId, payload) => {
    return apiRequest(`/prd-assignments/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteAssignment: async (assignmentId) => {
    return apiRequest(`/prd-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  getHistory: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.assignment_id) query.append('assignment_id', params.assignment_id);
    if (params.requirement_id) query.append('requirement_id', params.requirement_id);
    if (params.prd_id) query.append('prd_id', params.prd_id);
    const qStr = query.toString();
    return apiRequest(`/prd-assignments/history${qStr ? `?${qStr}` : ''}`);
  },

  getMyAssignments: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/my`);
  },

  getAssignmentDetail: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/${assignmentId}/detail`);
  },

  submitMemberResponse: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/${assignmentId}/response`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTeamResponsesOverview: async (workspaceId, prdIds = []) => {
    const query = new URLSearchParams();
    if (Array.isArray(prdIds)) {
      prdIds.forEach((id) => query.append('prd_ids', id));
    }
    const qStr = query.toString();
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/team-responses${qStr ? `?${qStr}` : ''}`);
  },

  reviewMemberResponse: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/${assignmentId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  reassignMemberTask: async (workspaceId, assignmentId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/prd-assignments/${assignmentId}/reassign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getResolutionAudit: async (workspaceId, { dataset_id = '', source_type = '' } = {}) => {
    const query = new URLSearchParams();
    if (dataset_id && dataset_id !== 'ALL') query.append('dataset_id', dataset_id);
    if (source_type && source_type !== 'ALL') query.append('source_type', source_type);
    const qStr = query.toString();
    return apiRequest(`/workspaces/${workspaceId}/resolution-audit${qStr ? `?${qStr}` : ''}`);
  },
};


