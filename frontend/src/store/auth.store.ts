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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:      null,
      refresh:    null,
      user:       null,
      isLoggedIn: false,

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
