/**
 * Dynamic pricing calculator for the webapp.
 * Mirrors backend logic from src/utils/videoPricing.ts and src/config/pricing.config.ts.
 */

// ── Base costs (from pricing.config.ts creditsPerUnit) ─────────────
const BASE_COSTS: Record<string, number> = {
  // Video models
  'seedance-lite': 9,
  'seedance-fast': 13,
  'seedance': 13,
  'wan': 15,
  'kling': 16,
  'runway': 18,
  'luma': 24,
  'runway-gen4': 24,
  'veo-fast': 24,
  'kling-pro': 27,
  'kling-3.0': 30,
  'kling-motion': 35,
  'sora': 30,
  'seedance-1-pro': 35,
  'sora-pro': 47,
  'veo': 116,
  'seedance-2': 65,
  'seedance-2-fast': 55,
  // Image models
  'midjourney': 3,
  'seedream-4.5': 2.5,
  'nano-banana-pro': 5,
};

// ── Dynamic pricing defaults ────────────────────────────────────────
interface DynamicPricingConfig {
  defaultDuration: number;
  defaultResolution?: string;
}

const DYNAMIC_PRICING: Record<string, DynamicPricingConfig> = {
  'veo-fast': { defaultDuration: 8, defaultResolution: '1080p' },
  'veo': { defaultDuration: 8, defaultResolution: '1080p' },
  'sora': { defaultDuration: 4, defaultResolution: '720p' },
  'sora-pro': { defaultDuration: 4, defaultResolution: '720p' },
  'runway': { defaultDuration: 5, defaultResolution: '720p' },
  'runway-gen4': { defaultDuration: 5, defaultResolution: '720p' },
  'seedance': { defaultDuration: 4 },
  'seedance-lite': { defaultDuration: 4 },
  'seedance-1-pro': { defaultDuration: 4 },
  'seedance-fast': { defaultDuration: 4 },
};

const RESOLUTION_MULT: Record<string, number> = {
  '480p': 0.7,
  '720p': 1.0,
  '1080p': 1.5,
  '4K': 2.0,
};

// ── Kling pricing table ─────────────────────────────────────────────
const KLING_CREDIT_TABLE: Record<string, number> = {
  'std:new:5': 16,
  'std:new:10': 32,
  'std:old:5': 20,
  'std:old:10': 40,
  'pro:new:5': 27,
  'pro:new:10': 54,
  'pro:new:5:audio': 54,
  'pro:new:10:audio': 108,
  'pro:old:5': 36,
  'pro:old:10': 72,
  'pro:master:5': 72,
  'pro:master:10': 144,
};

function getKlingVersionGroup(version: string): string {
  if (version === '2.1-master') return 'master';
  if (['2.5', '2.6'].includes(version)) return 'new';
  return 'old';
}

function calculateKlingCost(
  mode: 'std' | 'pro',
  settings?: { version?: string; duration?: number; enableAudio?: boolean },
): number {
  const version = settings?.version || '2.6';
  const duration = settings?.duration || 5;
  const enableAudio = settings?.enableAudio || false;
  const group = getKlingVersionGroup(version);

  if (enableAudio && version === '2.6' && mode === 'pro') {
    return KLING_CREDIT_TABLE[`pro:new:${duration}:audio`] || 40;
  }
  return KLING_CREDIT_TABLE[`${mode}:${group}:${duration}`] || (mode === 'pro' ? 27 : 16);
}

// ── Kling 3.0 pricing table ─────────────────────────────────────────
const KLING_30_DURATION_CREDITS: Record<number, number> = {
  3: 20,
  5: 30,
  8: 45,
  10: 55,
  15: 80,
};

function calculateKling30Cost(duration?: number): number {
  const dur = duration || 5;
  return KLING_30_DURATION_CREDITS[dur] || 30;
}

// ── Midjourney pricing ──────────────────────────────────────────────
const MJ_SPEED_CREDITS: Record<string, number> = {
  relax: 2,
  fast: 3,
  turbo: 5,
};

// ── Seedream 4.5 pricing ────────────────────────────────────────────
const SEEDREAM_RES_CREDITS: Record<string, number> = {
  '1K': 2.5,
  '2K': 3.5,
  '4K': 5,
};

// ── Nano Banana Pro pricing ─────────────────────────────────────────
const NANO_BANANA_PRO_RES_CREDITS: Record<string, number> = {
  '1K': 5,
  '2K': 6,
  '4K': 8,
};

// ── Seedance 2 / 2-fast pricing (per-second × resolution × input mode) ──
// Mirrors backend src/utils/videoPricing.ts. credits/s keep a ≥30% margin
// at $0.023/token worst-case revenue. "image" = image/video-input rate.
const SEEDANCE_2_PER_SECOND: Record<string, { text: number; image: number }> = {
  '480p':  { text: 6,  image: 4 },
  '720p':  { text: 13, image: 8 },
  '1080p': { text: 32, image: 20 },
};

const SEEDANCE_2_FAST_PER_SECOND: Record<string, { text: number; image: number }> = {
  '480p': { text: 5,  image: 3 },
  '720p': { text: 11, image: 7 },
};

function calculateSeedance2Cost(
  slug: string,
  settings?: {
    duration?: number;
    resolution?: string;
    hasImageInput?: boolean;
  },
): number {
  const duration = settings?.duration || 5;
  const isFast = slug === 'seedance-2-fast';
  const table = isFast ? SEEDANCE_2_FAST_PER_SECOND : SEEDANCE_2_PER_SECOND;
  let resolution = settings?.resolution || '720p';
  if (isFast && resolution === '1080p') resolution = '720p';
  const rates = table[resolution] || table['720p'];
  const perSec = settings?.hasImageInput ? rates.image : rates.text;
  return Math.ceil(perSec * duration);
}

// ── Public API ──────────────────────────────────────────────────────

export interface DynamicCostSettings {
  duration?: number;
  resolution?: string;
  version?: string;
  enableAudio?: boolean;
  speed?: string;
  hasImageInput?: boolean;
}

export function hasDynamicPricing(slug: string): boolean {
  return (
    slug in DYNAMIC_PRICING ||
    slug === 'kling' ||
    slug === 'kling-pro' ||
    slug === 'kling-3.0' ||
    slug === 'midjourney' ||
    slug === 'seedream-4.5' ||
    slug === 'nano-banana-pro' ||
    slug === 'seedance-2' ||
    slug === 'seedance-2-fast'
  );
}

export function calculateDynamicCost(
  slug: string,
  settings?: DynamicCostSettings,
): number {
  if (slug === 'kling') return calculateKlingCost('std', settings);
  if (slug === 'kling-pro') return calculateKlingCost('pro', settings);
  if (slug === 'kling-3.0') return calculateKling30Cost(settings?.duration);
  if (slug === 'midjourney') return MJ_SPEED_CREDITS[settings?.speed || 'fast'] || 3;
  if (slug === 'seedream-4.5') return SEEDREAM_RES_CREDITS[settings?.resolution || '1K'] || 2.5;
  if (slug === 'nano-banana-pro') return NANO_BANANA_PRO_RES_CREDITS[settings?.resolution || '1K'] || 5;
  if (slug === 'seedance-2' || slug === 'seedance-2-fast') return calculateSeedance2Cost(slug, settings);

  const baseCost = BASE_COSTS[slug];
  const cfg = DYNAMIC_PRICING[slug];
  if (!cfg || !baseCost || !settings) return baseCost || 0;

  let cost = baseCost;

  if (settings.duration && cfg.defaultDuration) {
    cost *= settings.duration / cfg.defaultDuration;
  }

  if (settings.resolution && cfg.defaultResolution) {
    const userMult = RESOLUTION_MULT[settings.resolution] || 1.0;
    const defaultMult = RESOLUTION_MULT[cfg.defaultResolution] || 1.0;
    cost *= userMult / defaultMult;
  }

  return Math.ceil(cost);
}

export function formatCost(cost: number): string {
  return cost % 1 === 0 ? String(cost) : cost.toFixed(1);
}
