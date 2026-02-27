/**
 * Dynamic video pricing calculator.
 *
 * Base credit cost is calibrated to the model's default duration/resolution.
 * When a user changes settings, cost scales proportionally:
 *   finalCost = ceil(baseCost × durationFactor × resolutionFactor)
 *
 * Kling models use a separate lookup-table approach based on version + duration + audio.
 */

interface DynamicPricingConfig {
  defaultDuration: number;
  defaultResolution?: string; // only for models with resolution options
}

const DYNAMIC_PRICING: Record<string, DynamicPricingConfig> = {
  'veo-fast': { defaultDuration: 8, defaultResolution: '1080p' },
  'veo':      { defaultDuration: 8, defaultResolution: '1080p' },
  'sora':     { defaultDuration: 4, defaultResolution: '720p' },
  'sora-pro': { defaultDuration: 4, defaultResolution: '720p' },
  'runway':   { defaultDuration: 5, defaultResolution: '720p' },
  'runway-gen4': { defaultDuration: 5, defaultResolution: '720p' },
  'seedance':      { defaultDuration: 4 }, // duration-only scaling
  'seedance-lite':  { defaultDuration: 4 },
  'seedance-1-pro': { defaultDuration: 4 },
  'seedance-fast':  { defaultDuration: 4 },
};

const RESOLUTION_MULT: Record<string, number> = {
  '480p': 0.7,
  '720p': 1.0,
  '1080p': 1.5,
  '4K': 2.0,
};

// ── Kling pricing table ──────────────────────────────────────
// Credits per 5 seconds, based on PiAPI costs
// Key format: "mode:versionGroup:duration" (+ ":audio" for 2.6 pro audio)

const KLING_CREDIT_TABLE: Record<string, number> = {
  // Standard mode (std)
  'std:new:5':  16,   // v2.5/2.6, 5s
  'std:new:10': 32,   // v2.5/2.6, 10s
  'std:old:5':  20,   // v1.5/1.6/2.1, 5s
  'std:old:10': 40,   // v1.5/1.6/2.1, 10s
  // Professional mode (pro)
  'pro:new:5':  27,   // v2.5/2.6, 5s
  'pro:new:10': 54,   // v2.5/2.6, 10s
  'pro:new:5:audio':  54,   // v2.6 + audio, 5s
  'pro:new:10:audio': 108,  // v2.6 + audio, 10s
  'pro:old:5':  36,   // v1.5/1.6/2.1, 5s
  'pro:old:10': 72,   // v1.5/1.6/2.1, 10s
  'pro:master:5':  72,  // v2.1-master, 5s
  'pro:master:10': 144, // v2.1-master, 10s
};

function getKlingVersionGroup(version: string): string {
  if (version === '2.1-master') return 'master';
  if (['2.5', '2.6'].includes(version)) return 'new';
  return 'old'; // 1.5, 1.6, 2.1
}

export function calculateKlingCost(
  mode: 'std' | 'pro',
  settings?: { version?: string; duration?: number; enableAudio?: boolean },
): number {
  const version = settings?.version || '2.6';
  const duration = settings?.duration || 5;
  const enableAudio = settings?.enableAudio || false;

  const group = getKlingVersionGroup(version);

  // Audio surcharge only for 2.6 pro
  if (enableAudio && version === '2.6' && mode === 'pro') {
    const key = `pro:new:${duration}:audio`;
    return KLING_CREDIT_TABLE[key] || 40;
  }

  const key = `${mode}:${group}:${duration}`;
  return KLING_CREDIT_TABLE[key] || (mode === 'pro' ? 27 : 16);
}

// ── Midjourney pricing table ─────────────────────────────────
// Credits per image based on speed mode

const MJ_SPEED_CREDITS: Record<string, number> = {
  relax: 2,
  fast: 3,
  turbo: 5,
};

function calculateMidjourneyCost(speed?: string): number {
  return MJ_SPEED_CREDITS[speed || 'fast'] || 3;
}

// ── Seedream 4.5 pricing (resolution-based) ─────────────────

const SEEDREAM_RES_CREDITS: Record<string, number> = {
  '1K': 2.5,
  '2K': 3.5,
  '4K': 5,
};

function calculateSeedreamCost(resolution?: string): number {
  return SEEDREAM_RES_CREDITS[resolution || '1K'] || 2.5;
}

// ── Nano Banana Pro pricing (resolution-based) ──────────────

const NANO_BANANA_PRO_RES_CREDITS: Record<string, number> = {
  '1K': 5,
  '2K': 6,
  '4K': 8,
};

function calculateNanoBananaProCost(resolution?: string): number {
  return NANO_BANANA_PRO_RES_CREDITS[resolution || '1K'] || 5;
}

// ── Nano Banana 2 pricing (resolution-based, Gemini 3.1 Flash) ──

const NANO_BANANA_2_RES_CREDITS: Record<string, number> = {
  '1K': 2,
  '2K': 3,
  '4K': 4,
};

function calculateNanaBanana2Cost(resolution?: string): number {
  return NANO_BANANA_2_RES_CREDITS[resolution || '1K'] || 2;
}

// ── Public API ───────────────────────────────────────────────

export function hasDynamicPricing(slug: string): boolean {
  return slug in DYNAMIC_PRICING || slug === 'kling' || slug === 'kling-pro' || slug === 'midjourney' || slug === 'seedream-4.5' || slug === 'nano-banana-pro' || slug === 'nano-banana-2';
}

export function calculateDynamicCost(
  slug: string,
  baseCost: number,
  settings?: { duration?: number; resolution?: string; version?: string; enableAudio?: boolean; speed?: string },
): number {
  // Kling uses its own pricing table (not proportional scaling)
  if (slug === 'kling') {
    return calculateKlingCost('std', settings);
  }
  if (slug === 'kling-pro') {
    return calculateKlingCost('pro', settings);
  }

  // Midjourney pricing by speed mode
  if (slug === 'midjourney') {
    return calculateMidjourneyCost(settings?.speed);
  }

  // Seedream 4.5 pricing by resolution
  if (slug === 'seedream-4.5') {
    return calculateSeedreamCost(settings?.resolution);
  }

  // Nano Banana Pro pricing by resolution
  if (slug === 'nano-banana-pro') {
    return calculateNanoBananaProCost(settings?.resolution);
  }

  // Nano Banana 2 pricing by resolution
  if (slug === 'nano-banana-2') {
    return calculateNanaBanana2Cost(settings?.resolution);
  }

  const cfg = DYNAMIC_PRICING[slug];
  if (!cfg || !settings) return baseCost;

  let cost = baseCost;

  // Duration factor
  if (settings.duration && cfg.defaultDuration) {
    cost *= settings.duration / cfg.defaultDuration;
  }

  // Resolution factor (only for models with configurable resolution)
  if (settings.resolution && cfg.defaultResolution) {
    const userMult = RESOLUTION_MULT[settings.resolution] || 1.0;
    const defaultMult = RESOLUTION_MULT[cfg.defaultResolution] || 1.0;
    cost *= userMult / defaultMult;
  }

  return Math.ceil(cost);
}
