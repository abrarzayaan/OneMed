import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT & normalize duplicate /api prefix ──
api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api\//, '/');
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const isPortalRoute = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/vendor') ||
      window.location.pathname.startsWith('/rider')
    );
    if (error.response?.status === 401 && !isAuthRequest && !isPortalRoute) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
