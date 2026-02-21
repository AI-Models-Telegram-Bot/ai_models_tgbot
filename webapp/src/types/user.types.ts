export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  language: string;
  profilePhoto?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserWallet {
  tokenBalance: number;
  moneyBalance: number;
  currency: string;
}

export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'PREMIUM' | 'BUSINESS' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'TRIALING';

export interface CurrentPlan {
  tier: SubscriptionTier;
  name: string;
  status: SubscriptionStatus;
  expiresAt: string | null;
  tokens: number | null; // null = unlimited
  referralBonus: number;
}

export interface UserStats {
  totalSpent: number;
  totalRequests: number;
}

export interface UserProfileResponse {
  user: User;
  wallet: UserWallet;
  currentPlan: CurrentPlan | null;
  stats: UserStats;
}
