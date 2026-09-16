/**
 * client.js
 * ---------
 * Centralized API client for the Product Intelligence platform.
 * Handles JWT token injection, unified error parsing, and API methods.
 */

export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export function getStoredToken() {
  const token = localStorage.getItem('token');
  if (token) return token;
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.token || user?.access_token) {
        localStorage.setItem('token', user.token || user.access_token);
        return user.token || user.access_token;
      }
    }
  } catch {}
  return '';
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

    if (response.status === 401) {
      console.warn('API returned 401 Unauthorized for endpoint:', endpoint);
      // If unauthorized on protected calls and we have no valid token, throw cleanly without clearing user state immediately
      throw new Error('Session expired or unauthorized. Please verify permissions.');
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

/**
 * Product APIs
 */
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

/**
 * Dataset APIs
 */
export const datasetApi = {
  upload: async (workspaceId, productId, file, sourceType = 'feedback') => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const query = new URLSearchParams({
      workspace_id: workspaceId,
      product_id: productId || 'default-product',
      source_type: sourceType,
    });
    const response = await fetch(`${API_BASE_URL}/datasets/upload?${query.toString()}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let msg = err.detail || 'Upload failed';
      if (Array.isArray(err.detail)) {
        msg = err.detail.map((e) => e.msg).join(' | ');
      }
      throw new Error(msg);
    }
    return response.json();
  },

  list: async (workspaceId) => {
    return apiRequest(`/datasets?workspace_id=${encodeURIComponent(workspaceId)}`);
  },

  getDataset: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}`);
  },

  getWorkflowStatus: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/status`);
  },

  getRecords: async (datasetId, stage = 'raw', skip = 0, limit = 50) => {
    return apiRequest(`/datasets/${datasetId}/records?stage=${encodeURIComponent(stage)}&skip=${skip}&limit=${limit}`);
  },

  update: async (datasetId, payload) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  updateDataset: async (datasetId, payload) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteDataset: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Data Agent Dirty Data Preprocessing APIs
 */
export const dataAgentApi = {
  runPipeline: async (datasetId, workspaceId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/pipeline?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  inspect: async (datasetId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/inspect`);
  },

  getSummary: async (datasetId) => {
    return apiRequest(`/data-agent/datasets/${datasetId}/summary`);
  },

  listTools: async () => {
    return apiRequest('/data-agent/tools');
  },

  validate: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/validate?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getValidation: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/validation`);
  },

  clean: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/clean?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getCleaning: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/cleaning`);
  },

  preprocess: async (datasetId, workspaceId) => {
    return apiRequest(`/datasets/${datasetId}/preprocess?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
    });
  },

  getPreprocessing: async (datasetId) => {
    return apiRequest(`/datasets/${datasetId}/preprocessing`);
  },

  aiCheck: async (datasetId, sampleSize = 10) => {
    return apiRequest(`/datasets/${datasetId}/ai-check?sample_size=${sampleSize}`);
  },

  getRecords: async (datasetId, stage = 'raw', skip = 0, limit = 50) => {
    return apiRequest(`/datasets/${datasetId}/records?stage=${stage}&skip=${skip}&limit=${limit}`);
  },
};

/**
 * AI Analysis Pipeline (CrewAI 3-Agent Flow) APIs
 */
export const aiAnalysisApi = {
  startAnalysis: async (datasetId, payload = {}) => {
    return apiRequest(`/datasets/${datasetId}/analysis`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getJobStatus: async (jobId) => {
    return apiRequest(`/analysis/jobs/${jobId}`);
  },

  retryStage: async (jobId, stageName) => {
    return apiRequest(`/analysis/jobs/${jobId}/retry?stage_name=${encodeURIComponent(stageName)}`, {
      method: 'POST',
    });
  },

  getDatasetAnalyses: async (datasetId, skip = 0, limit = 0) => {
    return apiRequest(`/datasets/${datasetId}/analyses?skip=${skip}&limit=${limit}`);
  },

  getRecordAnalysis: async (recordId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/analysis/${recordId}${query}`);
  },
};

/**
 * Final Executive Reports APIs
 */
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

/**
 * Workflow State APIs
 */
export const workflowStateApi = {
  getWorkflow: async (workflowId) => {
    return apiRequest(`/workflows/${workflowId}`);
  },

  getWorkspaceWorkflow: async (workspaceId, datasetId = null) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/workflow${query}`);
  },
};

export default {
  auth: authApi,
  workspaces: workspaceApi,
  products: productApi,
  intelligence: intelligenceApi,
  reports: reportApi,
  datasets: datasetApi,
  dataAgent: dataAgentApi,
  aiAnalysis: aiAnalysisApi,
  workflowState: workflowStateApi,
  request: apiRequest,
};


