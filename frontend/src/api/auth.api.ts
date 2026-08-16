import api from './axios';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  role?: 'consumer' | 'vendor' | 'rider';
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<{ access: string; refresh: string; user?: any }>('/auth/login/', data),
  register: (data: RegisterPayload) =>
    api.post<{ message: string }>('/auth/register/', data),
  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/token/', { refresh }),
};
