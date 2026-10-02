/**
 * workspaces.js
 * -------------
 * Workspace, Member Management & Product Definition APIs.
 */

import { apiRequest } from './core';

export const workspaceApi = {
  listWorkspaces: async () => {
    return apiRequest('/workspaces/');
  },

  getWorkspace: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}`);
  },

  createWorkspace: async (payload) => {
    return apiRequest('/workspaces/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateWorkspace: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteWorkspace: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },

  // --- Members ---
  listMembers: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/members`);
  },

  addMember: async (workspaceId, memberData) => {
    return apiRequest(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  updateMember: async (workspaceId, memberId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  removeMember: async (workspaceId, memberId) => {
    return apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // --- Activity ---
  getActivity: async (workspaceId, limit = 20) => {
    return apiRequest(`/workspaces/${workspaceId}/activity?limit=${limit}`);
  },
};

export const productApi = {
  list: async (workspaceId) => {
    return apiRequest(`/products/?workspace_id=${encodeURIComponent(workspaceId)}`);
  },

  create: async (payload) => {
    return apiRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  get: async (productId) => {
    return apiRequest(`/products/${productId}`);
  },

  update: async (productId, payload) => {
    return apiRequest(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

