export type ReferralMode = 'TOKENS' | 'CASH';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface ReferralStats {
  totalInvited: number;
  totalEarned: number;
  currentTierBonus: number;
  tokensEarned: number;
  tokenCommissions: number;
  cashEarned: number;
  cashCommissions: number;
  pendingWithdrawal: number;
}

export interface TierCommissionRate {
  tokenPercent: number;
  cashPercent: number;
}

/** Keyed by tier name: STARTER, PRO, PREMIUM, BUSINESS */
export type CommissionRates = Record<string, TierCommissionRate>;

export interface WithdrawalThresholds {
  RUB: number;
  USD: number;
}

export interface ReferralInfoResponse {
  referralCode: string;
  referralUrl: string;
  referralMode: ReferralMode;
  commissionRates: CommissionRates;
  inviteeBonus: number;
  withdrawalThresholds: WithdrawalThresholds;
  walletCurrency: string;
  moneyBalance: number;
  stats: ReferralStats;
}

export interface ReferralBenefit {
  tier: string;
  name: string;
  percentage: number;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  adminNote?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
