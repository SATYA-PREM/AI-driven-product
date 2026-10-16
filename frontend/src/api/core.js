/**
 * core.js
 * -------
 * Core HTTP client infrastructure:
 * - Base API configuration
 * - JWT token management
 * - Session API caching (Fast Page Navigations & 0ms Lag)
 * - Unified fetch wrapper with error normalization
 */

const rawApiUrl = (import.meta.env?.VITE_API_URL || '').trim();

function resolveApiBaseUrl() {
  if (rawApiUrl) {
    const cleanUrl = rawApiUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  return import.meta.env?.PROD ? '/api/v1' : 'http://127.0.0.1:8000/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();

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

export function normalizeCacheKey(key) {
  if (!key || typeof key !== 'string') return key;
  const [path, query] = key.split('?');
  const cleanPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return query ? `${cleanPath}?${query}` : cleanPath;
}

export function getSessionCache(key) {
  if (!key) return null;
  const normalizedKey = normalizeCacheKey(key);
  const candidates = [key];
  if (normalizedKey !== key) candidates.push(normalizedKey);

  // Also check alternative slash format for path-only keys
  if (!key.includes('?')) {
    const alt = key.endsWith('/') ? key.slice(0, -1) : `${key}/`;
    if (!candidates.includes(alt)) candidates.push(alt);
  }

  for (const k of candidates) {
    try {
      const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() > parsed.expiry) {
          sessionStorage.removeItem(SESSION_CACHE_PREFIX + k);
        } else {
          return parsed.data;
        }
      }
    } catch {}

    const mem = memoryCache.get(k);
    if (mem) {
      if (Date.now() <= mem.expiry) {
        return mem.data;
      } else {
        memoryCache.delete(k);
      }
    }
  }
  return null;
}

export function setSessionCache(key, data, ttlMs = 180000) {
  if (!key) return;
  const payload = { data, expiry: Date.now() + ttlMs };
  const normalized = normalizeCacheKey(key);
  const keys = [key];
  if (normalized !== key) keys.push(normalized);

  keys.forEach((k) => {
    try {
      sessionStorage.setItem(SESSION_CACHE_PREFIX + k, JSON.stringify(payload));
    } catch {
      memoryCache.set(k, payload);
    }
  });
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
      // Stale-While-Revalidate: If revalidateInBackground option is enabled (or by default for GET queries),
      // spawn a non-blocking background fetch to refresh the cache silently and notify subscribers.
      if (options.revalidate !== false) {
        (async () => {
          try {
            const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
            const token = getStoredToken();
            const headers = {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(options.headers || {}),
            };
            const bgRes = await fetch(url, { ...options, headers });
            if (bgRes.ok) {
              const bgContentType = bgRes.headers.get('content-type');
              const bgData = bgContentType && bgContentType.includes('application/json')
                ? await bgRes.json()
                : await bgRes.text();
              setSessionCache(cacheKey, bgData);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('cache_updated', {
                    detail: { endpoint, normalizedKey: normalizeCacheKey(cacheKey), data: bgData },
                  })
                );
              }
            }
          } catch {}
        })();
      }
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

    if (cacheKey && !shouldSkipCache) {
      setSessionCache(cacheKey, data);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please try again shortly or check your network connection.');
    }
    throw err;
  }
}

