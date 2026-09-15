/**
 * client.js
 * ---------
 * Centralized API client for the Product Intelligence platform.
 * Handles JWT token injection, unified error parsing, and API methods.
 */

export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export function getStoredToken() {
  return localStorage.getItem('token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('demo_email');
  localStorage.removeItem('demo_role');
  localStorage.removeItem('demo_name');
  localStorage.removeItem('demo_role_title');
  localStorage.removeItem('demo_avatar');
}

/**
 * Core fetch wrapper with auto Authorization header and error normalization.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      // Clear expired or invalid credentials
      clearAuthSession();
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
      throw new Error('Session expired or unauthorized. Please log in again.');
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred while communicating with the server.';
      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI validation errors
          errorMessage = data.detail
            .map((err) => `${err.loc ? err.loc[err.loc.length - 1] : 'field'}: ${err.msg}`)
            .join(' | ');
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify the backend is running on http://127.0.0.1:8000.');
    }
    throw err;
  }
}

/**
 * Authentication & User APIs
 */
export const authApi = {
  login: async ({ email, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      setStoredToken(data.access_token);
    }
    return data;
  },

  register: async ({ name, email, password }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  logout: () => {
    clearAuthSession();
  },
};

/**
 * Workspace APIs
 */
export const workspaceApi = {
  listWorkspaces: async () => {
    return apiRequest('/workspaces/');
  },

  getWorkspace: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}`);
  },

  createWorkspace: async ({ name, description }) => {
    return apiRequest('/workspaces/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },
};

/**
 * Product Intelligence & PM Dashboard APIs
 */
export const intelligenceApi = {
  getSummary: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/summary${query}`);
  },

  getOverview: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence${query}`);
  },

  getIssues: async (workspaceId, datasetId = null, limit = 50) => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/issues${query}`);
  },

  getFeatures: async (workspaceId, datasetId = null, limit = 30) => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/features${query}`);
  },

  getSentiment: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/sentiment${query}`);
  },

  getTrends: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/trends${query}`);
  },

  getInsights: async (workspaceId, datasetId = null, limit = 50) => {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', datasetId);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights${query}`);
  },
};

export default {
  auth: authApi,
  workspaces: workspaceApi,
  intelligence: intelligenceApi,
  request: apiRequest,
};

