import { create } from 'zustand';
import { referralApi } from '@/services/api/referral.api';
import { BOT_USERNAME } from '@/shared/utils/constants';
import type {
  ReferralStats,
  ReferralBenefit,
  ReferralMode,
  CommissionRates,
  WithdrawalThresholds,
  WithdrawalRequest,
} from '@/types/referral.types';

interface ReferralState {
  referralCode: string;
  referralUrl: string;
  referralMode: ReferralMode;
  commissionRates: CommissionRates;
  withdrawalThresholds: WithdrawalThresholds;
  walletCurrency: string;
  moneyBalance: number;
  stats: ReferralStats | null;
  benefits: ReferralBenefit[];
  withdrawals: WithdrawalRequest[];
  isLoading: boolean;
  error: string | null;

  fetchReferralInfo: () => Promise<void>;
  fetchBenefits: () => Promise<void>;
  setMode: (mode: ReferralMode) => Promise<void>;
  requestWithdrawal: (amount: number, currency: string) => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  referralCode: '',
  referralUrl: '',
  referralMode: 'TOKENS',
  commissionRates: { tokenPercent: 35, cashPercent: 15 },
  withdrawalThresholds: { RUB: 500, USD: 5 },
  walletCurrency: 'RUB',
  moneyBalance: 0,
  stats: null,
  benefits: [],
  withdrawals: [],
  isLoading: false,
  error: null,

  fetchReferralInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await referralApi.getInfo();
      const url =
        data.referralUrl ||
        (BOT_USERNAME && data.referralCode
          ? `https://t.me/${BOT_USERNAME}?start=${data.referralCode}`
          : '');
      set({
        referralCode: data.referralCode,
        referralUrl: url,
        referralMode: data.referralMode || 'TOKENS',
        commissionRates: data.commissionRates || { tokenPercent: 35, cashPercent: 15 },
        withdrawalThresholds: data.withdrawalThresholds || { RUB: 500, USD: 5 },
        walletCurrency: data.walletCurrency || 'RUB',
        moneyBalance: data.moneyBalance || 0,
        stats: data.stats
          ? {
              totalInvited: data.stats.totalInvited ?? 0,
              totalEarned: data.stats.totalEarned ?? 0,
              currentTierBonus: data.stats.currentTierBonus ?? 0,
              tokensEarned: data.stats.tokensEarned ?? 0,
              tokenCommissions: data.stats.tokenCommissions ?? 0,
              cashEarned: data.stats.cashEarned ?? 0,
              cashCommissions: data.stats.cashCommissions ?? 0,
              pendingWithdrawal: data.stats.pendingWithdrawal ?? 0,
            }
          : null,
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

  setMode: async (mode: ReferralMode) => {
    const prev = get().referralMode;
    set({ referralMode: mode });
    try {
      await referralApi.setMode(mode);
    } catch (err) {
      set({ referralMode: prev });
      throw err;
    }
  },

  requestWithdrawal: async (amount: number, currency: string) => {
    const res = await referralApi.requestWithdrawal(amount, currency);
    set((s) => ({
      moneyBalance: s.moneyBalance - amount,
      withdrawals: [res.withdrawal, ...s.withdrawals],
    }));
  },

  fetchWithdrawals: async () => {
    try {
      const data = await referralApi.getWithdrawals();
      set({ withdrawals: data.withdrawals });
    } catch {
      // silent
    }
  },
}));
