import { create } from 'zustand';
import { referralApi } from '@/services/api/referral.api';
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
      set({
        referralCode: data.referralCode,
        referralUrl: data.referralUrl,
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
