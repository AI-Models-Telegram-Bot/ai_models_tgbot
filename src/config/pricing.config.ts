/**
 * Pricing Configuration
 *
 * Maps model slugs to credit costs (what we charge users per request).
 * Credits are internal units — 1 credit is roughly $0.01 of value.
 *
 * MARGIN STRATEGY:
 * - Loss leaders (unlimited models): Flux Schnell, SDXL, Fast Text, Gemini Flash, Deepgram TTS
 *   → Cost us $0.0006-$0.003 per request → charge 1-2 credits → ~0% margin but drives engagement
 * - Standard models: GPT-4o, Claude, DALL-E 3, Kling, ElevenLabs
 *   → Target 60-80% margin
 * - Premium models: Veo 3 Quality, Midjourney, Sora
 *   → Target 50-60% margin (higher cost, premium positioning)
 *
 * Credits per unit represent what we charge. BaseCost in costEstimator.ts is what it costs us.
 */

export interface ModelPricing {
  creditsPerUnit: number;
  unitType: '1_request' | '1_image' | '1_video' | '1_song';
  baseCostUSD: number;         // Our actual cost (from costEstimator)
  marginPercent: number;       // Target margin
  isLossLeader: boolean;       // Can be offered unlimited on certain tiers
}

// ── TEXT MODEL PRICING ──────────────────────────────────
export const TEXT_PRICING: Record<string, ModelPricing> = {
  'fast-text': {
    creditsPerUnit: 1,
    unitType: '1_request',
    baseCostUSD: 0.0003,        // Groq Llama 3.3 70B avg request ~300 tok
    marginPercent: 97,
    isLossLeader: true,
  },
  'gpt-4o-mini': {
    creditsPerUnit: 2,
    unitType: '1_request',
    baseCostUSD: 0.0002,        // $0.375/1M tok × ~500 tok avg
    marginPercent: 90,
    isLossLeader: true,
  },
  'gemini-flash': {
    creditsPerUnit: 1,
    unitType: '1_request',
    baseCostUSD: 0.0002,        // $0.375/1M tok × ~500 tok avg
    marginPercent: 95,
    isLossLeader: true,
  },
  'gemini-pro': {
    creditsPerUnit: 4,
    unitType: '1_request',
    baseCostUSD: 0.003,         // $5.625/1M tok × ~500 tok avg
    marginPercent: 75,
    isLossLeader: false,
  },
  'gpt-4o': {
    creditsPerUnit: 5,
    unitType: '1_request',
    baseCostUSD: 0.003,         // $6.25/1M tok × ~500 tok avg
    marginPercent: 70,
    isLossLeader: false,
  },
  'claude-sonnet': {
    creditsPerUnit: 5,
    unitType: '1_request',
    baseCostUSD: 0.005,         // $9/1M tok × ~500 tok avg
    marginPercent: 60,
    isLossLeader: false,
  },
  'grok': {
    creditsPerUnit: 2,
    unitType: '1_request',
    baseCostUSD: 0.0002,        // $0.40/1M tok × ~500 tok avg
    marginPercent: 90,
    isLossLeader: false,
  },
  'deepseek-r1': {
    creditsPerUnit: 4,
    unitType: '1_request',
    baseCostUSD: 0.002,         // Together $3/1M × ~700 tok avg
    marginPercent: 75,
    isLossLeader: false,
  },
  'llama-4-maverick': {
    creditsPerUnit: 2,
    unitType: '1_request',
    baseCostUSD: 0.0004,        // Together $0.56/1M × ~700 tok avg
    marginPercent: 85,
    isLossLeader: false,
  },
};

// ── IMAGE MODEL PRICING ─────────────────────────────────
export const IMAGE_PRICING: Record<string, ModelPricing> = {
  'flux-schnell': {
    creditsPerUnit: 1,
    unitType: '1_image',
    baseCostUSD: 0.0006,        // Runware
    marginPercent: 90,
    isLossLeader: true,
  },
  'sdxl-lightning': {
    creditsPerUnit: 1,
    unitType: '1_image',
    baseCostUSD: 0.0006,        // Runware
    marginPercent: 90,
    isLossLeader: true,
  },
  'sdxl': {
    creditsPerUnit: 2,
    unitType: '1_image',
    baseCostUSD: 0.0026,        // Runware
    marginPercent: 85,
    isLossLeader: true,
  },
  'flux-dev': {
    creditsPerUnit: 5,
    unitType: '1_image',
    baseCostUSD: 0.0038,        // Runware
    marginPercent: 85,
    isLossLeader: true,          // Unlimited on Premium+
  },
  'flux-2-turbo': {
    creditsPerUnit: 3,
    unitType: '1_image',
    baseCostUSD: 0.008,         // Fal.ai
    marginPercent: 75,
    isLossLeader: false,
  },
  'flux-kontext': {
    creditsPerUnit: 5,
    unitType: '1_image',
    baseCostUSD: 0.01,          // KieAI
    marginPercent: 70,
    isLossLeader: false,
  },
  'seedream': {
    creditsPerUnit: 5,
    unitType: '1_image',
    baseCostUSD: 0.0175,        // KieAI
    marginPercent: 65,
    isLossLeader: false,
  },
  'seedream-4.5': {
    creditsPerUnit: 8,
    unitType: '1_image',
    baseCostUSD: 0.03,          // KieAI (basic), up to $0.06 (high/4K)
    marginPercent: 63,
    isLossLeader: false,
  },
  'nano-banana': {
    creditsPerUnit: 6,
    unitType: '1_image',
    baseCostUSD: 0.02,          // KieAI
    marginPercent: 60,
    isLossLeader: false,
  },
  'nano-banana-pro': {
    creditsPerUnit: 20,
    unitType: '1_image',
    baseCostUSD: 0.09,          // KieAI
    marginPercent: 70,
    isLossLeader: false,
  },
  'playground-v2-5': {
    creditsPerUnit: 3,
    unitType: '1_image',
    baseCostUSD: 0.01,          // Replicate
    marginPercent: 70,
    isLossLeader: false,
  },
  'dall-e-2': {
    creditsPerUnit: 8,
    unitType: '1_image',
    baseCostUSD: 0.02,          // OpenAI
    marginPercent: 70,
    isLossLeader: false,
  },
  'flux-pro': {
    creditsPerUnit: 15,
    unitType: '1_image',
    baseCostUSD: 0.04,          // Fal/Replicate
    marginPercent: 65,
    isLossLeader: false,
  },
  'dall-e-3': {
    creditsPerUnit: 20,
    unitType: '1_image',
    baseCostUSD: 0.04,          // OpenAI
    marginPercent: 65,
    isLossLeader: false,
  },
  'midjourney': {
    creditsPerUnit: 15,
    unitType: '1_image',
    baseCostUSD: 0.04,          // KieAI (Fast mode)
    marginPercent: 65,
    isLossLeader: false,
  },
};

// ── VIDEO MODEL PRICING ─────────────────────────────────
export const VIDEO_PRICING: Record<string, ModelPricing> = {
  'wan': {
    creditsPerUnit: 50,
    unitType: '1_video',
    baseCostUSD: 0.25,          // Fal $0.05/s × 5s
    marginPercent: 50,
    isLossLeader: true,          // Unlimited on Business+
  },
  'seedance': {
    creditsPerUnit: 50,
    unitType: '1_video',
    baseCostUSD: 0.20,          // KieAI
    marginPercent: 55,
    isLossLeader: true,
  },
  'kling': {
    creditsPerUnit: 80,
    unitType: '1_video',
    baseCostUSD: 0.26,          // PiAPI
    marginPercent: 55,
    isLossLeader: true,          // Unlimited on Business+
  },
  'kling-pro': {
    creditsPerUnit: 150,
    unitType: '1_video',
    baseCostUSD: 0.46,          // PiAPI 10s
    marginPercent: 55,
    isLossLeader: false,
  },
  'runway': {
    creditsPerUnit: 80,
    unitType: '1_video',
    baseCostUSD: 0.30,          // KieAI Gen-4 Turbo
    marginPercent: 55,
    isLossLeader: false,
  },
  'runway-gen4': {
    creditsPerUnit: 100,
    unitType: '1_video',
    baseCostUSD: 0.40,          // KieAI Gen-4
    marginPercent: 55,
    isLossLeader: false,
  },
  'luma': {
    creditsPerUnit: 100,
    unitType: '1_video',
    baseCostUSD: 0.40,          // Fal/Replicate
    marginPercent: 55,
    isLossLeader: true,          // Unlimited on Business+
  },
  'veo-fast': {
    creditsPerUnit: 100,
    unitType: '1_video',
    baseCostUSD: 0.40,          // KieAI
    marginPercent: 55,
    isLossLeader: false,
  },
  'sora': {
    creditsPerUnit: 120,
    unitType: '1_video',
    baseCostUSD: 0.50,          // KieAI
    marginPercent: 55,
    isLossLeader: false,
  },
  'sora-pro': {
    creditsPerUnit: 200,
    unitType: '1_video',
    baseCostUSD: 0.80,          // KieAI Sora 2 Pro
    marginPercent: 55,
    isLossLeader: false,
  },
  'veo': {
    creditsPerUnit: 500,
    unitType: '1_video',
    baseCostUSD: 2.00,          // KieAI Veo 3 Quality
    marginPercent: 55,
    isLossLeader: false,
  },
};

// ── AUDIO MODEL PRICING ─────────────────────────────────
export const AUDIO_PRICING: Record<string, ModelPricing> = {
  'deepgram-tts': {
    creditsPerUnit: 1,
    unitType: '1_request',
    baseCostUSD: 0.001,         // OpenAI TTS cheapest
    marginPercent: 90,
    isLossLeader: true,
  },
  'openai-tts': {
    creditsPerUnit: 3,
    unitType: '1_request',
    baseCostUSD: 0.003,         // $15/1M chars × ~200 chars
    marginPercent: 80,
    isLossLeader: true,
  },
  'fish-speech': {
    creditsPerUnit: 5,
    unitType: '1_request',
    baseCostUSD: 0.03,          // Replicate
    marginPercent: 70,
    isLossLeader: false,
  },
  'xtts-v2': {
    creditsPerUnit: 8,
    unitType: '1_request',
    baseCostUSD: 0.05,          // Replicate
    marginPercent: 65,
    isLossLeader: false,
  },
  'bark': {
    creditsPerUnit: 8,
    unitType: '1_request',
    baseCostUSD: 0.07,          // Replicate
    marginPercent: 60,
    isLossLeader: false,
  },
  'elevenlabs-tts': {
    creditsPerUnit: 12,
    unitType: '1_request',
    baseCostUSD: 0.06,          // ElevenLabs
    marginPercent: 55,
    isLossLeader: false,
  },
  'suno': {
    creditsPerUnit: 60,
    unitType: '1_song',
    baseCostUSD: 0.10,          // Replicate
    marginPercent: 45,
    isLossLeader: false,
  },
  'whisper': {
    creditsPerUnit: 3,
    unitType: '1_request',
    baseCostUSD: 0.001,         // Groq Whisper (~30s audio)
    marginPercent: 90,
    isLossLeader: true,
  },
};

/**
 * Get credit cost for a model slug
 */
export function getModelCredits(slug: string): number {
  const all = { ...TEXT_PRICING, ...IMAGE_PRICING, ...VIDEO_PRICING, ...AUDIO_PRICING };
  return all[slug]?.creditsPerUnit ?? 5; // Default 5 credits for unknown models
}

/**
 * Get full pricing info for a model slug
 */
export function getModelPricing(slug: string): ModelPricing | undefined {
  const all = { ...TEXT_PRICING, ...IMAGE_PRICING, ...VIDEO_PRICING, ...AUDIO_PRICING };
  return all[slug];
}

/**
 * Get all loss leader models (can be offered unlimited)
 */
export function getLossLeaderModels(): string[] {
  const all = { ...TEXT_PRICING, ...IMAGE_PRICING, ...VIDEO_PRICING, ...AUDIO_PRICING };
  return Object.entries(all)
    .filter(([, p]) => p.isLossLeader)
    .map(([slug]) => slug);
}
