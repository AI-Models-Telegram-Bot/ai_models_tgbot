import { create } from 'zustand';
import { userApi } from '@/services/api/user.api';
import type { User, UserWallet, CurrentPlan, UserStats } from '@/types/user.types';

interface ProfileState {
  user: User | null;
  wallet: UserWallet | null;
  currentPlan: CurrentPlan | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;

  fetchUserProfile: (telegramId: string) => Promise<void>;
  fetchWebProfile: () => Promise<void>;
  refreshData: () => Promise<void>;
}

let lastTelegramId = '';
let lastFetchMode: 'telegram' | 'web' = 'telegram';

export const useProfileStore = create<ProfileState>((set, get) => ({
  user: null,
  wallet: null,
  currentPlan: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchUserProfile: async (telegramId: string) => {
    lastTelegramId = telegramId;
    lastFetchMode = 'telegram';
    set({ isLoading: true, error: null });
    try {
      const data = await userApi.getProfile(telegramId);

      set({
        user: data.user,
        wallet: data.wallet,
        currentPlan: data.currentPlan,
        stats: data.stats,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  fetchWebProfile: async () => {
    lastFetchMode = 'web';
    set({ isLoading: true, error: null });
    try {
      const data = await userApi.getWebProfile();

      set({
        user: data.user,
        wallet: data.wallet,
        currentPlan: data.currentPlan,
        stats: data.stats,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  refreshData: async () => {
    if (lastFetchMode === 'web') {
      await get().fetchWebProfile();
    } else if (lastTelegramId) {
      await get().fetchUserProfile(lastTelegramId);
    }
  },
}));
