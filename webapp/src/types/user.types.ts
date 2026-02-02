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

export type SubscriptionTier = 'FREE' | 'MIDDLE' | 'PRO' | 'ULTRA_PRO';

export interface CurrentPlan {
  tier: SubscriptionTier;
  name: string;
  expiresAt: string | null;
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
