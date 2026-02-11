import apiClient from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  telegramId: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  language: string;
  authProvider: 'TELEGRAM' | 'EMAIL' | 'GOOGLE';
  emailVerified: boolean;
  createdAt: string;
}

export const authApi = {
  register: (email: string, password: string, name?: string, language?: string) =>
    apiClient.post<AuthTokens>('/api/auth/register', { email, password, name, language }),

  login: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/api/auth/login', { email, password }),

  loginWithGoogle: (idToken: string) =>
    apiClient.post<AuthTokens>('/api/auth/google', { idToken }),

  loginWithTelegram: (data: Record<string, unknown>) =>
    apiClient.post<AuthTokens>('/api/auth/telegram', data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/api/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/api/auth/logout', { refreshToken }),

  getMe: () =>
    apiClient.get<UserProfile>('/api/auth/me'),

  linkTelegram: (data: Record<string, unknown>) =>
    apiClient.post('/api/auth/link-telegram', data),

  forgotPassword: (email: string) =>
    apiClient.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/api/auth/reset-password', { token, password }),
};
