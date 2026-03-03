import apiClient from './client';
import type { TokenPackagesResponse } from '@/types/tokenPackage.types';

export const tokenPackagesApi = {
  getPackages: () =>
    apiClient
      .get<TokenPackagesResponse>('/token-packages')
      .then((r) => r.data),
};
