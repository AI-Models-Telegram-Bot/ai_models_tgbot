export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

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

export interface TierRateLimits {
  requestsPerHour: number;
  requestsPerDay: number;
  videoPerHour: number;
  videoPerDay: number;
}

export interface SubscriptionPlanConfig {
  tier: SubscriptionTier;
  name: string;
  priceUSD: number | null; // null = "Contact Us"
  priceRUB: number | null;
  duration: 'monthly' | 'lifetime';

  credits: {
    text: number | null;    // null = unlimited
    image: number | null;
    video: number | null;
    audio: number | null;
  };

  modelAccess: ModelAccessConfig;
  rateLimits: TierRateLimits;

  features: string[];
  referralBonus: number;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  // ── FREE ── $0/mo ──────────────────────────────────────
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    priceUSD: 0,
    priceRUB: 0,
    duration: 'lifetime',
    credits: {
      text: 100,
      image: 50,
      video: 10,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-4o-mini', 'gemini-flash', 'fast-text'],
      },
      image: {
        allowed: ['flux-schnell', 'sdxl', 'sdxl-lightning', 'dall-e-2'],
      },
      video: {
        allowed: ['wan'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 30,
      requestsPerDay: 100,
      videoPerHour: 2,
      videoPerDay: 5,
    },
    features: [
      'features.free.basicModels',
      'features.free.communitySupport',
      'features.free.referralBonus',
    ],
    referralBonus: 5,
    prioritySupport: false,
    apiAccess: false,
  },

  // ── STARTER ── $5.99/mo ────────────────────────────────
  {
    tier: SubscriptionTier.STARTER,
    name: 'Starter',
    priceUSD: 5.99,
    priceRUB: 549,
    duration: 'monthly',
    credits: {
      text: 500,
      image: 300,
      video: 50,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet', 'grok', 'gemini-flash', 'fast-text'],
        unlimited: ['fast-text', 'gemini-flash'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning'],
      },
      video: {
        allowed: ['kling', 'kling-pro', 'luma', 'wan', 'runway', 'seedance'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 60,
      requestsPerDay: 300,
      videoPerHour: 5,
      videoPerDay: 20,
    },
    features: [
      'features.starter.gpt4Claude',
      'features.starter.allImageModels',
      'features.starter.unlimitedBasicText',
      'features.starter.basicVideo',
      'features.starter.referralBonus',
      'features.starter.emailSupport',
    ],
    referralBonus: 10,
    prioritySupport: false,
    apiAccess: false,
  },

  // ── PRO ── $14.99/mo ───────────────────────────────────
  {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    priceUSD: 14.99,
    priceRUB: 1399,
    duration: 'monthly',
    credits: {
      text: 3000,
      image: 1500,
      video: 200,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet', 'grok', 'gemini-flash', 'gemini-pro', 'fast-text', 'deepseek-r1'],
        unlimited: ['fast-text', 'gemini-flash', 'gpt-4o-mini'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning'],
      },
      video: {
        allowed: ['kling', 'kling-pro', 'luma', 'wan', 'runway', 'seedance', 'sora', 'veo-fast'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 120,
      requestsPerDay: 800,
      videoPerHour: 10,
      videoPerDay: 60,
    },
    features: [
      'features.pro.allStarter',
      'features.pro.unlimitedGptMini',
      'features.pro.geminiDeepseek',
      'features.pro.proImage',
      'features.pro.advancedVideo',
      'features.pro.referralBonus',
      'features.pro.priorityEmail',
      'features.pro.earlyAccess',
    ],
    referralBonus: 15,
    prioritySupport: true,
    apiAccess: false,
  },

  // ── PREMIUM ── $34.99/mo ───────────────────────────────
  {
    tier: SubscriptionTier.PREMIUM,
    name: 'Premium',
    priceUSD: 34.99,
    priceRUB: 3199,
    duration: 'monthly',
    credits: {
      text: 5000,
      image: 5000,
      video: 800,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['*'],
        unlimited: ['fast-text', 'gpt-4o-mini', 'gemini-flash', 'grok', 'llama-4-maverick'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning'],
      },
      video: {
        allowed: ['*'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 200,
      requestsPerDay: 2000,
      videoPerHour: 15,
      videoPerDay: 100,
    },
    features: [
      'features.premium.unlimitedCheapText',
      'features.premium.allModels',
      'features.premium.largeCredits',
      'features.premium.referralBonus',
      'features.premium.priorityChat',
      'features.premium.limitedApi',
    ],
    referralBonus: 20,
    prioritySupport: true,
    apiAccess: true,
  },

  // ── BUSINESS ── $79.99/mo ──────────────────────────────
  {
    tier: SubscriptionTier.BUSINESS,
    name: 'Business',
    priceUSD: 79.99,
    priceRUB: 7299,
    duration: 'monthly',
    credits: {
      text: 15000,
      image: 10000,
      video: 2000,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['*'],
        unlimited: ['fast-text', 'gpt-4o-mini', 'gemini-flash', 'grok', 'llama-4-maverick'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning'],
      },
      video: {
        allowed: ['*'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 500,
      requestsPerDay: 5000,
      videoPerHour: 30,
      videoPerDay: 200,
    },
    features: [
      'features.business.unlimitedTextImage',
      'features.business.massiveCredits',
      'features.business.referralBonus',
      'features.business.support247',
      'features.business.fullApi',
      'features.business.fineTuning',
      'features.business.accountManager',
    ],
    referralBonus: 25,
    prioritySupport: true,
    apiAccess: true,
  },

  // ── ENTERPRISE ── Custom ───────────────────────────────
  {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    priceUSD: null,
    priceRUB: null,
    duration: 'monthly',
    credits: {
      text: null,
      image: null,
      video: null,
      audio: 0,
    },
    modelAccess: {
      text: {
        allowed: ['*'],
        unlimited: ['*'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['*'],
      },
      video: {
        allowed: ['*'],
        unlimited: ['*'],
      },
      audio: {
        allowed: [],
      },
    },
    rateLimits: {
      requestsPerHour: 2000,
      requestsPerDay: 20000,
      videoPerHour: 100,
      videoPerDay: 1000,
    },
    features: [
      'features.enterprise.unlimitedEverything',
      'features.enterprise.allModelsUnlimited',
      'features.enterprise.referralBonus',
      'features.enterprise.dedicatedSupport',
      'features.enterprise.highLimitApi',
      'features.enterprise.customDevelopment',
      'features.enterprise.teamCollaboration',
      'features.enterprise.customIntegrations',
      'features.enterprise.slaGuarantee',
      'features.enterprise.privateDeployment',
    ],
    referralBonus: 30,
    prioritySupport: true,
    apiAccess: true,
  },
];

export function getPlanByTier(tier: SubscriptionTier): SubscriptionPlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
}
