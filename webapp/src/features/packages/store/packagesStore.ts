import { create } from 'zustand';
import { packagesApi } from '@/services/api/packages.api';
import type { Package } from '@/types/package.types';
import type { PackageModelsResponse } from '@/types/model.types';

interface PackagesState {
  packages: Package[];
  selectedPackageModels: PackageModelsResponse | null;
  isLoading: boolean;
  isLoadingModels: boolean;
  error: string | null;

  fetchPackages: () => Promise<void>;
  fetchPackageModels: (packageId: string) => Promise<void>;
  clearSelectedModels: () => void;
}

export const usePackagesStore = create<PackagesState>((set) => ({
  packages: [],
  selectedPackageModels: null,
  isLoading: false,
  isLoadingModels: false,
  error: null,

  fetchPackages: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await packagesApi.getAll();
      set({ packages: data.packages, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load packages',
        isLoading: false,
      });
    }
  },

  fetchPackageModels: async (packageId: string) => {
    set({ isLoadingModels: true });
    try {
      const data = await packagesApi.getModels(packageId);
      set({ selectedPackageModels: data, isLoadingModels: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load models',
        isLoadingModels: false,
      });
    }
  },

  clearSelectedModels: () => set({ selectedPackageModels: null }),
}));
