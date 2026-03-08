/**
 * Axios instance - base URL and JWT interceptor with token refresh.
 * In dev with no VITE_API_URL: use /api so Vite proxy hits backend (no CORS, port 3000).
 * With VITE_API_URL set (or in production): use that URL.
 */

import axios from 'axios';
import * as authApi from './auth.api';

// In dev without VITE_API_URL: use /api so Vite proxy hits backend (avoids CORS, backend on 3000).
const apiBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000');

export const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 65000, // 65 s — Render free tier can take up to 60 s to wake from sleep
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jarvis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { token, user } = await authApi.refreshToken();
        localStorage.setItem('jarvis_token', token);
        if (user) localStorage.setItem('jarvis_user', JSON.stringify(user));
        onTokenRefreshed(token);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('jarvis_token');
        localStorage.removeItem('jarvis_user');
        window.dispatchEvent(new Event('jarvis_unauthorized'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
