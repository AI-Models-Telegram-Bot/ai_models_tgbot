import { create } from 'zustand';
import { referralApi } from '@/services/api/referral.api';
import { BOT_USERNAME } from '@/shared/utils/constants';
import type { ReferralStats, ReferralBenefit } from '@/types/referral.types';

interface ReferralState {
  referralCode: string;
  referralUrl: string;
  stats: ReferralStats | null;
  benefits: ReferralBenefit[];
  isLoading: boolean;
  error: string | null;

  fetchReferralInfo: () => Promise<void>;
  fetchBenefits: () => Promise<void>;
}

export const useReferralStore = create<ReferralState>((set) => ({
  referralCode: '',
  referralUrl: '',
  stats: null,
  benefits: [],
  isLoading: false,
  error: null,

  fetchReferralInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await referralApi.getInfo();
      // Use server URL if available, otherwise build from VITE_BOT_USERNAME
      const url =
        data.referralUrl ||
        (BOT_USERNAME && data.referralCode
          ? `https://t.me/${BOT_USERNAME}?start=${data.referralCode}`
          : '');
      set({
        referralCode: data.referralCode,
        referralUrl: url,
        stats: data.stats,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load referral info',
        isLoading: false,
      });
    }
  },

  fetchBenefits: async () => {
    try {
      const data = await referralApi.getBenefits();
      set({ benefits: data.benefits });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load benefits',
      });
    }
  },
}));
