import { create } from 'zustand';
import api from '../api/client';

interface AdminInfo {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  admin: AdminInfo | null;
  isAuthenticated: boolean;
  pendingAdminId: string | null;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<{ requiresVerification: boolean; adminId?: string }>;
  verify: (adminId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setPending2FA: (adminId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  admin: (() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('admin_token'),
  pendingAdminId: null,
  isLoading: false,

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.requiresVerification) {
      set({ pendingAdminId: data.adminId });
      return { requiresVerification: true, adminId: data.adminId };
    }
    return { requiresVerification: false };
  },

  verify: async (adminId, code) => {
    const { data } = await api.post('/auth/verify', { adminId, code });
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.admin));
    set({
      token: data.token,
      admin: data.admin,
      isAuthenticated: true,
      pendingAdminId: null,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, admin: null, isAuthenticated: false, pendingAdminId: null });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/auth/me');
      set({ admin: data.admin, isAuthenticated: true });
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      set({ token: null, admin: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setPending2FA: (adminId) => set({ pendingAdminId: adminId }),
}));
