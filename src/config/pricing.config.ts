/**
 * Pricing Configuration
 *
 * Maps model slugs to credit costs (what we charge users per request).
 * Tokens are internal units — revenue per token ~$0.023.
 *
 * MARGIN STRATEGY:
 * - Loss leaders (unlimited models): Flux Schnell, SDXL, Fast Text, Gemini Flash, Deepgram TTS
 *   → Cost us $0.0003-$0.003 per request → charge 0.2-0.5 tokens → ~0% margin but drives engagement
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
    creditsPerUnit: 0.2,
    unitType: '1_request',
    baseCostUSD: 0.0003,
    marginPercent: 97,
    isLossLeader: true,
  },
  'gemini-flash': {
    creditsPerUnit: 0.2,
    unitType: '1_request',
    baseCostUSD: 0.0002,
    marginPercent: 95,
    isLossLeader: true,
  },
  'gpt-4o-mini': {
    creditsPerUnit: 0.3,
    unitType: '1_request',
    baseCostUSD: 0.0002,
    marginPercent: 90,
    isLossLeader: true,
  },
  'grok': {
    creditsPerUnit: 0.3,
    unitType: '1_request',
    baseCostUSD: 0.0002,
    marginPercent: 90,
    isLossLeader: false,
  },
  'llama-4-maverick': {
    creditsPerUnit: 0.3,
    unitType: '1_request',
    baseCostUSD: 0.0004,
    marginPercent: 85,
    isLossLeader: false,
  },
  'claude-haiku': {
    creditsPerUnit: 0.5,
    unitType: '1_request',
    baseCostUSD: 0.001,
    marginPercent: 80,
    isLossLeader: false,
  },
  'deepseek-r1': {
    creditsPerUnit: 0.5,
    unitType: '1_request',
    baseCostUSD: 0.002,
    marginPercent: 75,
    isLossLeader: false,
  },
  'gemini-pro': {
    creditsPerUnit: 0.8,
    unitType: '1_request',
    baseCostUSD: 0.003,
    marginPercent: 75,
    isLossLeader: false,
  },
  'gpt-4o': {
    creditsPerUnit: 0.8,
    unitType: '1_request',
    baseCostUSD: 0.003,
    marginPercent: 70,
    isLossLeader: false,
  },
  'claude-sonnet': {
    creditsPerUnit: 1,
    unitType: '1_request',
    baseCostUSD: 0.005,
    marginPercent: 60,
    isLossLeader: false,
  },
  'claude-sonnet-thinking': {
    creditsPerUnit: 3,
    unitType: '1_request',
    baseCostUSD: 0.015,
    marginPercent: 55,
    isLossLeader: false,
  },
  'claude-opus': {
    creditsPerUnit: 5,
    unitType: '1_request',
    baseCostUSD: 0.03,
    marginPercent: 50,
    isLossLeader: false,
  },
  'deep-research': {
    creditsPerUnit: 5,
    unitType: '1_request',
    baseCostUSD: 0.03,
    marginPercent: 50,
    isLossLeader: false,
  },
  'claude-opus-thinking': {
    creditsPerUnit: 12,
    unitType: '1_request',
    baseCostUSD: 0.08,
    marginPercent: 45,
    isLossLeader: false,
  },
};

// ── IMAGE MODEL PRICING ─────────────────────────────────
export const IMAGE_PRICING: Record<string, ModelPricing> = {
  'flux-schnell': {
    creditsPerUnit: 0.2,
    unitType: '1_image',
    baseCostUSD: 0.0006,
    marginPercent: 90,
    isLossLeader: true,
  },
  'sdxl-lightning': {
    creditsPerUnit: 0.2,
    unitType: '1_image',
    baseCostUSD: 0.0006,
    marginPercent: 90,
    isLossLeader: true,
  },
  'sdxl': {
    creditsPerUnit: 0.5,
    unitType: '1_image',
    baseCostUSD: 0.0026,
    marginPercent: 85,
    isLossLeader: true,
  },
  'flux-dev': {
    creditsPerUnit: 0.8,
    unitType: '1_image',
    baseCostUSD: 0.0038,
    marginPercent: 85,
    isLossLeader: true,
  },
  'playground-v2-5': {
    creditsPerUnit: 1,
    unitType: '1_image',
    baseCostUSD: 0.01,
    marginPercent: 70,
    isLossLeader: false,
  },
  'seedream': {
    creditsPerUnit: 1.5,
    unitType: '1_image',
    baseCostUSD: 0.0175,
    marginPercent: 65,
    isLossLeader: false,
  },
  'flux-kontext': {
    creditsPerUnit: 1.5,
    unitType: '1_image',
    baseCostUSD: 0.01,
    marginPercent: 70,
    isLossLeader: false,
  },
  'nano-banana': {
    creditsPerUnit: 1.5,
    unitType: '1_image',
    baseCostUSD: 0.02,
    marginPercent: 60,
    isLossLeader: false,
  },
  'dall-e-2': {
    creditsPerUnit: 2,
    unitType: '1_image',
    baseCostUSD: 0.02,
    marginPercent: 70,
    isLossLeader: false,
  },
  'seedream-4.5': {
    creditsPerUnit: 2.5,
    unitType: '1_image',
    baseCostUSD: 0.03,
    marginPercent: 63,
    isLossLeader: false,
  },
  'midjourney': {
    creditsPerUnit: 3,
    unitType: '1_image',
    baseCostUSD: 0.04,
    marginPercent: 65,
    isLossLeader: false,
  },
  'dall-e-3': {
    creditsPerUnit: 3,
    unitType: '1_image',
    baseCostUSD: 0.04,
    marginPercent: 65,
    isLossLeader: false,
  },
  'flux-pro': {
    creditsPerUnit: 3,
    unitType: '1_image',
    baseCostUSD: 0.04,
    marginPercent: 65,
    isLossLeader: false,
  },
  'nano-banana-pro': {
    creditsPerUnit: 5,
    unitType: '1_image',
    baseCostUSD: 0.09,
    marginPercent: 70,
    isLossLeader: false,
  },
};

// ── VIDEO MODEL PRICING ─────────────────────────────────
export const VIDEO_PRICING: Record<string, ModelPricing> = {
  'seedance-lite': {
    creditsPerUnit: 9,
    unitType: '1_video',
    baseCostUSD: 0.18,
    marginPercent: 30,
    isLossLeader: false,
  },
  'seedance-fast': {
    creditsPerUnit: 13,
    unitType: '1_video',
    baseCostUSD: 0.245,
    marginPercent: 30,
    isLossLeader: false,
  },
  'seedance': {
    creditsPerUnit: 13,
    unitType: '1_video',
    baseCostUSD: 0.26,
    marginPercent: 28,
    isLossLeader: false,
  },
  'wan': {
    creditsPerUnit: 15,
    unitType: '1_video',
    baseCostUSD: 0.25,
    marginPercent: 32,
    isLossLeader: true,
  },
  'kling': {
    creditsPerUnit: 16,
    unitType: '1_video',
    baseCostUSD: 0.26,
    marginPercent: 30,
    isLossLeader: false,
  },
  'runway': {
    creditsPerUnit: 18,
    unitType: '1_video',
    baseCostUSD: 0.30,
    marginPercent: 30,
    isLossLeader: false,
  },
  'luma': {
    creditsPerUnit: 24,
    unitType: '1_video',
    baseCostUSD: 0.40,
    marginPercent: 30,
    isLossLeader: false,
  },
  'runway-gen4': {
    creditsPerUnit: 24,
    unitType: '1_video',
    baseCostUSD: 0.40,
    marginPercent: 30,
    isLossLeader: false,
  },
  'veo-fast': {
    creditsPerUnit: 24,
    unitType: '1_video',
    baseCostUSD: 0.40,
    marginPercent: 30,
    isLossLeader: false,
  },
  'kling-pro': {
    creditsPerUnit: 27,
    unitType: '1_video',
    baseCostUSD: 0.46,
    marginPercent: 28,
    isLossLeader: false,
  },
  'sora': {
    creditsPerUnit: 30,
    unitType: '1_video',
    baseCostUSD: 0.50,
    marginPercent: 30,
    isLossLeader: false,
  },
  'seedance-1-pro': {
    creditsPerUnit: 35,
    unitType: '1_video',
    baseCostUSD: 0.74,
    marginPercent: 25,
    isLossLeader: false,
  },
  'sora-pro': {
    creditsPerUnit: 47,
    unitType: '1_video',
    baseCostUSD: 0.80,
    marginPercent: 30,
    isLossLeader: false,
  },
  'veo': {
    creditsPerUnit: 116,
    unitType: '1_video',
    baseCostUSD: 2.00,
    marginPercent: 25,
    isLossLeader: false,
  },
};

// ── AUDIO MODEL PRICING ─────────────────────────────────
export const AUDIO_PRICING: Record<string, ModelPricing> = {
  'deepgram-tts': {
    creditsPerUnit: 0.5,
    unitType: '1_request',
    baseCostUSD: 0.001,
    marginPercent: 90,
    isLossLeader: true,
  },
  'fish-speech': {
    creditsPerUnit: 1,
    unitType: '1_request',
    baseCostUSD: 0.03,
    marginPercent: 70,
    isLossLeader: false,
  },
  'xtts-v2': {
    creditsPerUnit: 2,
    unitType: '1_request',
    baseCostUSD: 0.05,
    marginPercent: 65,
    isLossLeader: false,
  },
  'bark': {
    creditsPerUnit: 2.5,
    unitType: '1_request',
    baseCostUSD: 0.07,
    marginPercent: 60,
    isLossLeader: false,
  },
  'openai-tts': {
    creditsPerUnit: 2.5,
    unitType: '1_request',
    baseCostUSD: 0.003,
    marginPercent: 80,
    isLossLeader: false,
  },
  'elevenlabs-tts': {
    creditsPerUnit: 4,
    unitType: '1_request',
    baseCostUSD: 0.06,
    marginPercent: 55,
    isLossLeader: false,
  },
  'suno': {
    creditsPerUnit: 20,
    unitType: '1_song',
    baseCostUSD: 0.10,
    marginPercent: 45,
    isLossLeader: false,
  },
  'whisper': {
    creditsPerUnit: 0.3,
    unitType: '1_request',
    baseCostUSD: 0.001,
    marginPercent: 90,
    isLossLeader: true,
  },
};

/**
 * Get credit cost for a model slug
 */
export function getModelCredits(slug: string): number {
  const all = { ...TEXT_PRICING, ...IMAGE_PRICING, ...VIDEO_PRICING, ...AUDIO_PRICING };
  return all[slug]?.creditsPerUnit ?? 1; // Default 1 token for unknown models
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
