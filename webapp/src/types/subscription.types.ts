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
  credits: {
    text: number | null;      // null = unlimited
    image: number | null;
    video: number | null;
    audio: number | null;
  };
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
    credits: SubscriptionPlan['credits'];
    features: string[];
    referralBonus: number;
    modelAccess: ModelAccessConfig;
  } | null;
}
