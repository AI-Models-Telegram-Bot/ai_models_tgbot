import { create } from 'zustand';
import { referralApi } from '@/services/api/referral.api';
import type { ReferralLink, ReferralStats, ReferralBenefit } from '@/types/referral.types';

interface ReferralState {
  links: ReferralLink[];
  stats: ReferralStats | null;
  benefits: ReferralBenefit[];
  maxLinks: number;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  fetchReferralLinks: () => Promise<void>;
  createReferralLink: () => Promise<void>;
  fetchBenefits: () => Promise<void>;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  links: [],
  stats: null,
  benefits: [],
  maxLinks: 10,
  isLoading: false,
  isCreating: false,
  error: null,

  fetchReferralLinks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await referralApi.getLinks();
      set({
        links: data.links,
        stats: data.stats,
        maxLinks: data.maxLinks,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load links',
        isLoading: false,
      });
    }
  },

  createReferralLink: async () => {
    const { links, maxLinks } = get();
    if (links.length >= maxLinks) return;

    set({ isCreating: true, error: null });
    try {
      const data = await referralApi.createLink();
      set((state) => ({
        links: [...state.links, data.link],
        isCreating: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create link',
        isCreating: false,
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
