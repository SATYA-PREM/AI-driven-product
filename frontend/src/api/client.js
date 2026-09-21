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
  clearSessionApiCache();
}

/* =========================================
   SESSION API CACHE (Fast Page Navigations & 0ms Lag)
   ========================================= */
const SESSION_CACHE_PREFIX = 'pi_sess_cache_';
const memoryCache = new Map();

export function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiry) {
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    const mem = memoryCache.get(key);
    if (mem && Date.now() <= mem.expiry) {
      return mem.data;
    }
    return null;
  }
}

export function setSessionCache(key, data, ttlMs = 45000) {
  const payload = { data, expiry: Date.now() + ttlMs };
  try {
    sessionStorage.setItem(SESSION_CACHE_PREFIX + key, JSON.stringify(payload));
  } catch {
    memoryCache.set(key, payload);
  }
}

export function clearSessionApiCache(filter = null) {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(SESSION_CACHE_PREFIX)) {
        if (!filter || k.includes(filter)) {
          toRemove.push(k);
        }
      }
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
  if (filter) {
    for (const k of memoryCache.keys()) {
      if (k.includes(filter)) memoryCache.delete(k);
    }
  } else {
    memoryCache.clear();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('datasets_updated', () => clearSessionApiCache('dataset'));
  window.addEventListener('active_workspace_changed', () => clearSessionApiCache());
}

/**
 * Core fetch wrapper with auto Authorization header, session caching, and error normalization.
 */
export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const shouldSkipCache = 
    !isGet || 
    options.bypassCache === true || 
    endpoint.includes('/jobs/') || 
    endpoint.includes('/status') ||
    endpoint.includes('/workflow') ||
    endpoint.includes('/auth/');

  const cacheKey = isGet ? endpoint : null;

  if (cacheKey && !shouldSkipCache) {
    const cached = getSessionCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

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
function buildQueryParams(opts, defaultLimit) {
  const params = new URLSearchParams();
  if (typeof opts === 'string') {
    if (opts) params.append('dataset_id', opts);
  } else if (opts && typeof opts === 'object') {
    if (opts.dataset_id) params.append('dataset_id', opts.dataset_id);
    if (opts.product_id) params.append('product_id', opts.product_id);
    if (opts.limit || defaultLimit) params.append('limit', String(opts.limit || defaultLimit));
  } else if (defaultLimit) {
    params.append('limit', String(defaultLimit));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const intelligenceApi = {
  getSummary: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/summary${buildQueryParams(opts)}`);
  },

  getOverview: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence${buildQueryParams(opts)}`);
  },

  getIssues: async (workspaceId, opts = null, limit = 50) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/issues${buildQueryParams(opts, limit)}`);
  },

  getFeatures: async (workspaceId, opts = null, limit = 30) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/features${buildQueryParams(opts, limit)}`);
  },

  getSentiment: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/sentiment${buildQueryParams(opts)}`);
  },

  getTrends: async (workspaceId, opts = null) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/trends${buildQueryParams(opts)}`);
  },

  getInsights: async (workspaceId, opts = null, limit = 50) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights${buildQueryParams(opts, limit)}`);
  },

  getComparison: async (workspaceId, comparisonType = 'Time Comparison', opts = null, quickRange = 'Last 30 Days') => {
    const params = new URLSearchParams();
    if (comparisonType) params.append('comparison_type', comparisonType);
    if (quickRange) params.append('quick_range', quickRange);
    if (typeof opts === 'string') {
      if (opts) params.append('dataset_id', opts);
    } else if (opts && typeof opts === 'object') {
      if (opts.dataset_id) params.append('dataset_id', opts.dataset_id);
      if (opts.product_id) params.append('product_id', opts.product_id);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/intelligence/comparison${query}`);
  },

  submitInsightReview: async (workspaceId, insightId, reviewData) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights/${insightId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
      bypassCache: true,
    });
  },

  getInsightEvidence: async (workspaceId, insightId) => {
    return apiRequest(`/workspaces/${workspaceId}/intelligence/insights/${insightId}/evidence`, {
      bypassCache: true,
    });
  },
};

/**
 * Product Features Management APIs
 */
export const featureApi = {
  list: async (workspaceId, params = {}) => {
    const q = new URLSearchParams();
    if (params.dataset_id) q.append('dataset_id', params.dataset_id);
    if (params.status && params.status !== 'All') q.append('status', params.status);
    if (params.priority && params.priority !== 'All') q.append('priority', params.priority);
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.source && params.source !== 'All') q.append('source', params.source);
    if (params.search) q.append('search', params.search);
    if (params.skip) q.append('skip', String(params.skip));
    if (params.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/features${qs}`);
  },

  get: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}`);
  },

  create: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/features`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  update: async (workspaceId, featureId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  extract: async (workspaceId, datasetId = null) => {
    const qs = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/features/extract${qs}`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  sendToPrioritization: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/send-to-prioritization`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  linkPrd: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/link-prd`, {
      method: 'POST',
      bypassCache: true,
    });
  },

  addToRoadmap: async (workspaceId, featureId) => {
    return apiRequest(`/workspaces/${workspaceId}/features/${featureId}/add-to-roadmap`, {
      method: 'POST',
      bypassCache: true,
    });
  },
  // Aliases for compatibility
  listFeatures: async (workspaceId, params = {}) => featureApi.list(workspaceId, params),
  getFeature: async (workspaceId, featureId) => featureApi.get(workspaceId, featureId),
  createFeature: async (workspaceId, data) => featureApi.create(workspaceId, data),
  updateFeature: async (workspaceId, featureId, data) => featureApi.update(workspaceId, featureId, data),
  extractFeatures: async (workspaceId, datasetId = null) => featureApi.extract(workspaceId, datasetId),
};

/**
 * Customer Feedback APIs
 */
export const feedbackApi = {
  listFeedback: async (workspaceId, params = {}) => {
    const q = new URLSearchParams();
    if (params.status && params.status !== 'All') q.append('status', params.status);
    if (params.sentiment && params.sentiment !== 'All') q.append('sentiment', params.sentiment);
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.source && params.source !== 'All') q.append('source', params.source);
    if (params.priority && params.priority !== 'All') q.append('priority', params.priority);
    if (params.assigned_to && params.assigned_to !== 'All') q.append('assigned_to', params.assigned_to);
    if (params.mapped !== undefined && params.mapped !== null) q.append('mapped', String(params.mapped));
    if (params.search) q.append('search', params.search);
    if (params.skip) q.append('skip', String(params.skip));
    if (params.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/feedback${qs}`);
  },

  getMetrics: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/metrics`);
  },

  getFeedback: async (workspaceId, feedbackId) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}`);
  },

  createFeedback: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  updateFeedback: async (workspaceId, feedbackId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },

  mapFeature: async (workspaceId, feedbackId, data = {}) => {
    return apiRequest(`/workspaces/${workspaceId}/feedback/${feedbackId}/map-feature`, {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true,
    });
  },
};

/**
 * Dataset APIs
 */
export const datasetApi = {
  upload: async (workspaceId, productId, file, sourceType = 'feedback', datasetName = '') => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const queryParams = {
      workspace_id: workspaceId,
      product_id: productId || 'default-product',
      source_type: sourceType,
    };
    if (datasetName) queryParams.dataset_name = datasetName;
    const query = new URLSearchParams(queryParams);
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

  listDatasets: async (workspaceId) => {
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

  getWorkspaceWorkflow: async (workspaceId, datasetId = null, options = {}) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/workflow${query}`, options);
  },
};

export default {
  auth: authApi,
  workspaces: workspaceApi,
  products: productApi,
  intelligence: intelligenceApi,
  features: featureApi,
  reports: reportApi,
  datasets: datasetApi,
  dataAgent: dataAgentApi,
  aiAnalysis: aiAnalysisApi,
  workflowState: workflowStateApi,
  request: apiRequest,
};


