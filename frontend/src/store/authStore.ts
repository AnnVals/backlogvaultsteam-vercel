import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/services/api';
import { queryClient } from '@/lib/queryClient';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ username, password });
          const { user, token } = res.data!;
          localStorage.setItem('bv_token', token);
          queryClient.clear();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register({ username, email, password });
          const { user, token } = res.data!;
          localStorage.setItem('bv_token', token);
          queryClient.clear();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('bv_token');
        queryClient.clear();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'bv_auth',
      partialize: s => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);