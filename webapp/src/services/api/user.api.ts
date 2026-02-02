import apiClient from './client';
import type { UserProfileResponse } from '@/types/user.types';

export const userApi = {
  getProfile: (telegramId: string) =>
    apiClient.get<UserProfileResponse>(`/user/${telegramId}`).then((r) => r.data),
};
