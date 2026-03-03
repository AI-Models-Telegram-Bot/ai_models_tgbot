import { create } from 'zustand';
import { tokenPackagesApi } from '@/services/api/tokenPackages.api';
import type { TokenPackage } from '@/types/tokenPackage.types';

interface TokenPackageStore {
  packages: TokenPackage[];
  isLoading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
}

export const useTokenPackageStore = create<TokenPackageStore>((set) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchPackages: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await tokenPackagesApi.getPackages();
      set({ packages: data.packages, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load token packages', isLoading: false });
    }
  },
}));
