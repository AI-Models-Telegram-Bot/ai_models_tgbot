import type { SubscriptionTier } from './user.types';

export interface Package {
  id: string;
  name: string;
  tier: SubscriptionTier;
  credits: number;
  priceUSD: number;
  priceRUB: number;
  priceStars: number;
  features: string[];
  referralBonus: number;
  isUnlimited: boolean;
  unlimitedModels?: string[];
}

export interface PackagesResponse {
  packages: Package[];
}
