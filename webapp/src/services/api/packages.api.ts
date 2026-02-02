import apiClient from './client';
import type { PackagesResponse } from '@/types/package.types';
import type { PackageModelsResponse } from '@/types/model.types';

export const packagesApi = {
  getAll: () =>
    apiClient.get<PackagesResponse>('/packages').then((r) => r.data),

  getModels: (packageId: string) =>
    apiClient
      .get<PackageModelsResponse>(`/packages/${packageId}/models`)
      .then((r) => r.data),
};
