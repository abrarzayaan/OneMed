import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id?: number;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  staff_role?: string;
  permissions?: Record<string, boolean | string>;
}

interface AuthState {
  token:      string | null;
  refresh:    string | null;
  user:       User   | null;
  isLoggedIn: boolean;
  setAuth:    (token: string, refresh: string, user: User) => void;
  setToken:   (token: string) => void;
  updateUser: (userData: Partial<User>) => void;
  logout:     () => void;
}

const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('onemed-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state || null;
  } catch {
    return null;
  }
};

const initialAuth = getStoredAuth();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:      initialAuth?.token || null,
      refresh:    initialAuth?.refresh || null,
      user:       initialAuth?.user || null,
      isLoggedIn: initialAuth?.isLoggedIn ?? Boolean(initialAuth?.token),

      setAuth: (token, refresh, user) =>
        set({ token, refresh, user, isLoggedIn: true }),

      setToken: (token) => set({ token }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      logout: () =>
        set({ token: null, refresh: null, user: null, isLoggedIn: false }),
    }),
    {
      name: 'onemed-auth',
      partialize: (s) => ({
        token:      s.token,
        refresh:    s.refresh,
        user:       s.user,
        isLoggedIn: s.isLoggedIn,
      }),
    }
  )
);
