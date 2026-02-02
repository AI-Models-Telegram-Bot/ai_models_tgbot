import { create } from 'zustand';
import { subscriptionApi } from '@/services/api/subscription.api';
import type { SubscriptionPlan } from '@/types/subscription.types';
import type { SubscriptionTier } from '@/types/user.types';

interface SubscriptionStore {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;

  fetchPlans: () => Promise<void>;
  selectPlan: (tier: SubscriptionTier) => void;
  clearSelection: () => void;
  upgradePlan: (telegramId: string, tier: SubscriptionTier) => Promise<boolean>;
  cancelPlan: (telegramId: string) => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plans: [],
  selectedPlan: null,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await subscriptionApi.getPlans();
      set({ plans: data.plans, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load plans', isLoading: false });
    }
  },

  selectPlan: (tier: SubscriptionTier) => {
    const plan = get().plans.find((p) => p.tier === tier) || null;
    set({ selectedPlan: plan });
  },

  clearSelection: () => {
    set({ selectedPlan: null });
  },

  upgradePlan: async (telegramId: string, tier: SubscriptionTier) => {
    set({ isLoading: true, error: null });
    try {
      await subscriptionApi.upgrade(telegramId, tier);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to upgrade', isLoading: false });
      return false;
    }
  },

  cancelPlan: async (telegramId: string) => {
    set({ isLoading: true, error: null });
    try {
      await subscriptionApi.cancel(telegramId);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel', isLoading: false });
      return false;
    }
  },
}));
