/**
 * developer.js
 * ------------
 * Developer Workspace APIs:
 * - Dashboard KPI & assignment overviews
 * - Technical task assignments & requirement details
 * - Status transitions (start, progress, blocker)
 * - Formal implementation submissions with revision snapshots
 * - Defect verification and fix submission
 * - Blocker and PM clarification logging
 * - Approved design handoff references
 */

import { apiRequest } from './core';

export const developerApi = {
  getDashboard: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/dashboard`);
  },

  getAssignments: async (workspaceId, status = null) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/developer/assignments${query}`);
  },

  getAssignmentDetail: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/assignments/${assignmentId}`);
  },

  updateAssignmentStatus: async (workspaceId, assignmentId, { status, notes, blockerComment }) => {
    const params = new URLSearchParams();
    params.append('status', status);
    if (notes) params.append('notes', notes);
    if (blockerComment) params.append('blocker_comment', blockerComment);
    return apiRequest(`/workspaces/${workspaceId}/developer/assignments/${assignmentId}/status?${params.toString()}`, {
      method: 'PATCH',
    });
  },

  submitImplementation: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDefects: async (workspaceId, assignmentId = null) => {
    const query = assignmentId ? `?assignment_id=${encodeURIComponent(assignmentId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/developer/defects${query}`);
  },

  submitDefectFix: async (workspaceId, defectId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/defects/${defectId}/fix`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  reportBlocker: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/blockers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  requestClarification: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/clarifications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDesignHandoffs: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/developer/design-handoffs`);
  },
};

