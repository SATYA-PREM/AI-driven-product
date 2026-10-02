/**
 * auth.js
 * -------
 * Authentication & Platform User Management APIs.
 */

import { apiRequest, setStoredToken, clearAuthSession } from './core';

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

export const userApi = {
  listUsers: async (search = '') => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/users${q}`);
  },

  createUser: async ({ name, email, password, role = 'member' }) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/users/me');
  },
};

