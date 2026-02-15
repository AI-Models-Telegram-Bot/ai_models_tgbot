import { rootApiClient } from './client';

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
    rootApiClient.post<AuthTokens>('/api/auth/register', { email, password, name, language }),

  login: (email: string, password: string) =>
    rootApiClient.post<AuthTokens>('/api/auth/login', { email, password }),

  loginWithGoogle: (idToken: string) =>
    rootApiClient.post<AuthTokens>('/api/auth/google', { idToken }),

  loginWithTelegram: (data: Record<string, unknown>) =>
    rootApiClient.post<AuthTokens>('/api/auth/telegram', data),

  refreshToken: (refreshToken: string) =>
    rootApiClient.post<AuthTokens>('/api/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    rootApiClient.post('/api/auth/logout', { refreshToken }),

  getMe: () =>
    rootApiClient.get<UserProfile>('/api/auth/me'),

  linkTelegram: (data: Record<string, unknown>) =>
    rootApiClient.post('/api/auth/link-telegram', data),

  forgotPassword: (email: string) =>
    rootApiClient.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    rootApiClient.post('/api/auth/reset-password', { token, password }),

  // Telegram QR auth
  createTelegramQR: () =>
    rootApiClient.post<{ token: string; deepLink: string; expiresAt: string }>('/api/auth/telegram-qr/create'),

  checkTelegramQR: (token: string) =>
    rootApiClient.get<{ status: 'pending' | 'confirmed' | 'expired'; accessToken?: string; refreshToken?: string }>(
      '/api/auth/telegram-qr/check',
      { params: { token } },
    ),
};
