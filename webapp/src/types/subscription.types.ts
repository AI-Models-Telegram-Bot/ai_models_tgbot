import type { SubscriptionTier } from './user.types';

export interface ModelAccessCategory {
  allowed: string[];
  unlimited?: string[];
}

export interface ModelAccessConfig {
  text: ModelAccessCategory;
  image: ModelAccessCategory;
  video: ModelAccessCategory;
  audio: ModelAccessCategory;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  priceUSD: number | null;   // null = "Contact Us"
  priceRUB: number | null;
  duration: 'monthly' | 'lifetime';
  tokens: number | null;      // null = unlimited
  modelAccess: ModelAccessConfig;
  features: string[];
  referralBonus: number;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

export interface CurrentSubscriptionResponse {
  subscription: {
    tier: SubscriptionTier;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  plan: {
    name: string;
    tokens: number | null;
    features: string[];
    referralBonus: number;
    modelAccess: ModelAccessConfig;
  } | null;
}

export interface TierModel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creditCost: number;
  isUnlimited: boolean;
}

export interface TierModelsResponse {
  tier: string;
  tokens: number | null;
  models: {
    text: TierModel[];
    image: TierModel[];
    video: TierModel[];
    audio: TierModel[];
  };
}
