import { create } from 'zustand';
import { authApi, AuthTokens, UserProfile } from '@/services/api/auth.api';
import { isTelegramEnvironment } from '@/services/telegram/telegram';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, language?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithTelegram: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  fetchUser: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
}

const TOKEN_KEY = 'vseonix_access_token';
const REFRESH_KEY = 'vseonix_refresh_token';

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getSavedTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setTokens: (tokens: AuthTokens) => {
    saveTokens(tokens);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      get().setTokens(data);
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, name?: string, language?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.register(email, password, name, language);
      get().setTokens(data);
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.loginWithGoogle(idToken);
      get().setTokens(data);
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Google login failed', isLoading: false });
      throw error;
    }
  },

  loginWithTelegram: async (data: Record<string, unknown>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: tokens } = await authApi.loginWithTelegram(data);
      get().setTokens(tokens);
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Telegram login failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout API errors
      }
    }
    clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return null;

    try {
      const { data } = await authApi.refreshToken(refreshToken);
      get().setTokens(data);
      return data.accessToken;
    } catch {
      // Refresh failed — clear auth
      clearTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      return null;
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  initAuth: async () => {
    // In Telegram environment, auth is handled by Telegram init data
    if (isTelegramEnvironment()) {
      set({ isAuthenticated: true, isLoading: false });
      return;
    }

    const { accessToken, refreshToken } = getSavedTokens();
    if (!accessToken && !refreshToken) {
      set({ isLoading: false });
      return;
    }

    set({ accessToken, refreshToken, isLoading: true });

    // Try to fetch user with stored token
    try {
      const { data } = await authApi.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token might be expired, try refresh
      if (refreshToken) {
        const newToken = await get().refreshAccessToken();
        if (newToken) {
          await get().fetchUser();
        } else {
          set({ isLoading: false });
        }
      } else {
        clearTokens();
        set({ isLoading: false });
      }
    }
  },
}));
