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
        allowed: ['dall-e-3-mini', 'stable-diffusion-2'],
      },
      video: {
        allowed: [],
      },
      audio: {
        allowed: ['tts-basic'],
      },
    },
    features: [
      'Basic AI models',
      'Community support',
      '5% referral bonus',
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
        allowed: ['dall-e-3', 'midjourney-v6', 'stable-diffusion-xl'],
        unlimited: ['stable-diffusion-xl'],
      },
      video: {
        allowed: ['runway-gen2', 'pika-1.0'],
      },
      audio: {
        allowed: ['elevenlabs', 'whisper', 'tts-advanced'],
        unlimited: ['whisper'],
      },
    },
    features: [
      'Access to GPT-4 & Claude',
      'Advanced image generation',
      'Basic video generation',
      '10% referral bonus',
      'Email support',
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
        allowed: ['dall-e-3', 'midjourney-v6', 'stable-diffusion-xl', 'flux-pro'],
        unlimited: ['dall-e-3', 'stable-diffusion-xl'],
      },
      video: {
        allowed: ['runway-gen3', 'pika-1.5', 'kling-1.5', 'luma-ai'],
      },
      audio: {
        allowed: ['elevenlabs-pro', 'whisper', 'musicgen', 'tts-advanced'],
        unlimited: ['whisper', 'tts-advanced'],
      },
    },
    features: [
      'All Basic features',
      'GPT-4 Turbo & Claude Opus',
      'Professional image generation',
      'Advanced video generation',
      '15% referral bonus',
      'Priority email support',
      'Early access to new models',
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
        unlimited: ['dall-e-3', 'midjourney-v6', 'stable-diffusion-xl'],
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
      'Unlimited text generation',
      'Unlimited audio generation',
      'All image & video models',
      'Unlimited basic video models',
      '20% referral bonus',
      'Priority chat support',
      'API access (limited)',
      'Custom model training (beta)',
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
      'Unlimited text, image & audio',
      'Unlimited most video models',
      '25% referral bonus',
      '24/7 priority support',
      'Full API access',
      'Custom model fine-tuning',
      'Dedicated account manager',
      'White-label options',
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
      'Unlimited everything',
      'All models unlimited',
      '30% referral bonus',
      'Dedicated 24/7 support team',
      'Full API access with high limits',
      'Custom model development',
      'Team collaboration features',
      'Custom integrations',
      'SLA guarantee',
      'Private deployment options',
    ],
    referralBonus: 30,
    prioritySupport: true,
    apiAccess: true,
  },
];

export function getPlanByTier(tier: SubscriptionTier): SubscriptionPlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
}
