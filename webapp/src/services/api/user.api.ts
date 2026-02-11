import apiClient, { rootApiClient } from './client';
import type { UserProfileResponse } from '@/types/user.types';

export const userApi = {
  getProfile: (telegramId: string) =>
    apiClient.get<UserProfileResponse>(`/user/${telegramId}`).then((r) => r.data),

  getWebProfile: () =>
    rootApiClient.get<UserProfileResponse>('/api/auth/profile').then((r) => r.data),
};
