import { create } from 'zustand';
import { userApi } from '@/services/api/user.api';
import i18n from '@/i18n/config';
import type { User, UserWallet, CurrentPlan, UserStats } from '@/types/user.types';

interface ProfileState {
  user: User | null;
  wallet: UserWallet | null;
  currentPlan: CurrentPlan | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;

  fetchUserProfile: (telegramId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

let lastTelegramId = '';

export const useProfileStore = create<ProfileState>((set, get) => ({
  user: null,
  wallet: null,
  currentPlan: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchUserProfile: async (telegramId: string) => {
    lastTelegramId = telegramId;
    set({ isLoading: true, error: null });
    try {
      const data = await userApi.getProfile(telegramId);
      // Sync webapp language with user's stored language preference
      if (data.user.language) {
        const lang = data.user.language.startsWith('ru') ? 'ru' : 'en';
        if (i18n.language !== lang) {
          i18n.changeLanguage(lang);
        }
      }

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
    if (lastTelegramId) {
      await get().fetchUserProfile(lastTelegramId);
    }
  },
}));
