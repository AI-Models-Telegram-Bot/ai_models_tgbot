export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  VIP = 'VIP',
  ELITE = 'ELITE',
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

  features: string[];
  referralBonus: number;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
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
      audio: 50,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-3.5-turbo', 'claude-haiku'],
      },
      image: {
        allowed: ['*'],
      },
      video: {
        allowed: [],
      },
      audio: {
        allowed: ['elevenlabs-tts', 'bark', 'suno', 'xtts-v2'],
      },
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

  {
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    priceUSD: 9.99,
    priceRUB: 899,
    duration: 'monthly',
    credits: {
      text: 1000,
      image: 500,
      video: 100,
      audio: 500,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-4', 'claude-sonnet', 'gpt-3.5-turbo'],
        unlimited: ['gpt-3.5-turbo'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell'],
      },
      video: {
        allowed: ['runway-gen2', 'pika-1.0'],
      },
      audio: {
        allowed: ['elevenlabs-tts', 'bark', 'suno', 'xtts-v2', 'whisper', 'tts-advanced'],
        unlimited: ['whisper'],
      },
    },
    features: [
      'features.basic.gpt4Claude',
      'features.basic.advancedImage',
      'features.basic.basicVideo',
      'features.basic.referralBonus',
      'features.basic.emailSupport',
    ],
    referralBonus: 10,
    prioritySupport: false,
    apiAccess: false,
  },

  {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    priceUSD: 29.99,
    priceRUB: 2699,
    duration: 'monthly',
    credits: {
      text: 5000,
      image: 2000,
      video: 500,
      audio: 2000,
    },
    modelAccess: {
      text: {
        allowed: ['gpt-4-turbo', 'claude-opus', 'claude-sonnet', 'gpt-4'],
        unlimited: ['gpt-4', 'claude-sonnet'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning'],
      },
      video: {
        allowed: ['runway-gen3', 'pika-1.5', 'kling-1.5', 'luma-ai'],
      },
      audio: {
        allowed: ['elevenlabs-tts', 'bark', 'suno', 'xtts-v2', 'whisper', 'musicgen', 'tts-advanced'],
        unlimited: ['whisper', 'tts-advanced'],
      },
    },
    features: [
      'features.pro.allBasic',
      'features.pro.gpt4TurboClaude',
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

  {
    tier: SubscriptionTier.VIP,
    name: 'VIP',
    priceUSD: 79.99,
    priceRUB: 7199,
    duration: 'monthly',
    credits: {
      text: null, // unlimited
      image: 10000,
      video: 2000,
      audio: null, // unlimited
    },
    modelAccess: {
      text: {
        allowed: ['*'],
        unlimited: ['*'],
      },
      image: {
        allowed: ['*'],
        unlimited: ['flux-schnell', 'sdxl-lightning', 'sdxl'],
      },
      video: {
        allowed: ['*'],
        unlimited: ['runway-gen2', 'pika-1.0'],
      },
      audio: {
        allowed: ['*'],
        unlimited: ['*'],
      },
    },
    features: [
      'features.vip.unlimitedText',
      'features.vip.unlimitedAudio',
      'features.vip.allImageVideo',
      'features.vip.unlimitedBasicVideo',
      'features.vip.referralBonus',
      'features.vip.priorityChat',
      'features.vip.limitedApi',
      'features.vip.customTraining',
    ],
    referralBonus: 20,
    prioritySupport: true,
    apiAccess: true,
  },

  {
    tier: SubscriptionTier.ELITE,
    name: 'Elite',
    priceUSD: 199.99,
    priceRUB: 17999,
    duration: 'monthly',
    credits: {
      text: null,
      image: null,
      video: 10000,
      audio: null,
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
        unlimited: ['runway-gen3', 'pika-1.5', 'kling-1.5'],
      },
      audio: {
        allowed: ['*'],
        unlimited: ['*'],
      },
    },
    features: [
      'features.elite.unlimitedTextImageAudio',
      'features.elite.unlimitedMostVideo',
      'features.elite.referralBonus',
      'features.elite.support247',
      'features.elite.fullApi',
      'features.elite.fineTuning',
      'features.elite.accountManager',
      'features.elite.whiteLabel',
    ],
    referralBonus: 25,
    prioritySupport: true,
    apiAccess: true,
  },

  {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    priceUSD: null, // "Contact Us"
    priceRUB: null,
    duration: 'monthly',
    credits: {
      text: null,
      image: null,
      video: null,
      audio: null,
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
        allowed: ['*'],
        unlimited: ['*'],
      },
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
