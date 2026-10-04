/**
 * assistant.js
 * ------------
 * AI Assistant (Read-only Product Intelligence & PRD Clarification) APIs.
 */

import { apiRequest } from './core';

export const assistantApi = {
  query: async (payload) => {
    return apiRequest('/assistant/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getContext: async (workspaceId, categoryId = 'all') => {
    return apiRequest(`/assistant/context/${workspaceId}?category_id=${encodeURIComponent(categoryId)}`);
  },

  createSession: async (workspaceId, categoryId = 'all', title = 'New Assistant Session') => {
    return apiRequest('/assistant/sessions', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        category_id: categoryId,
        title: title,
      }),
    });
  },

  listSessions: async (workspaceId) => {
    return apiRequest(`/assistant/workspaces/${workspaceId}/sessions`);
  },

  getMessages: async (sessionId) => {
    return apiRequest(`/assistant/sessions/${sessionId}/messages`);
  },

  createJob: async (payload) => {
    return apiRequest('/assistant/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getJob: async (jobId) => {
    return apiRequest(`/assistant/jobs/${jobId}`);
  },
};

