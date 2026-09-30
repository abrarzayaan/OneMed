import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api/';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? `${trimmed}/` : `${trimmed}/api/`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT & normalize relative URL path ──
api.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    // Strip leading /api/ or / so the relative path appends cleanly to baseURL
    config.url = config.url.replace(/^\/?(api\/)?/, '');
  }
  let token = useAuthStore.getState().token;
  if (!token && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('onemed-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token || null;
      }
    } catch {}
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint =
      error.config?.url?.includes('/auth/login/') ||
      error.config?.url?.includes('/auth/token/');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        } else if (path.startsWith('/vendor') && !path.startsWith('/vendor/login')) {
          window.location.href = '/vendor/login';
        } else if (path.startsWith('/rider') && !path.startsWith('/rider/login')) {
          window.location.href = '/rider/login';
        } else if (!path.startsWith('/login') && !path.startsWith('/admin/login') && !path.startsWith('/vendor/login') && !path.startsWith('/rider/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
