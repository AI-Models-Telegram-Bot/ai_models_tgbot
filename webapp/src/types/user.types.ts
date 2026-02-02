export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  language: string;
  profilePhoto?: string;
}

export interface UserWallet {
  textBalance: number;
  imageBalance: number;
  videoBalance: number;
  audioBalance: number;
  moneyBalance: number;
  currency: string;
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'VIP' | 'ELITE' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'TRIALING';

export interface CurrentPlan {
  tier: SubscriptionTier;
  name: string;
  status: SubscriptionStatus;
  expiresAt: string | null;
  credits: {
    text: number | null;    // null = unlimited
    image: number | null;
    video: number | null;
    audio: number | null;
  };
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
