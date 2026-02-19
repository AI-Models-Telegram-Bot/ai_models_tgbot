/**
 * Dynamic video pricing calculator.
 *
 * Base credit cost is calibrated to the model's default duration/resolution.
 * When a user changes settings, cost scales proportionally:
 *   finalCost = ceil(baseCost × durationFactor × resolutionFactor)
 */

interface DynamicPricingConfig {
  defaultDuration: number;
  defaultResolution?: string; // only for models with resolution options
}

const DYNAMIC_PRICING: Record<string, DynamicPricingConfig> = {
  'veo-fast': { defaultDuration: 8, defaultResolution: '1080p' },
  'veo':      { defaultDuration: 8, defaultResolution: '1080p' },
  'sora':     { defaultDuration: 4, defaultResolution: '720p' },
  'runway':   { defaultDuration: 5, defaultResolution: '720p' },
  'seedance': { defaultDuration: 8 }, // duration-only scaling
};

const RESOLUTION_MULT: Record<string, number> = {
  '480p': 0.7,
  '720p': 1.0,
  '1080p': 1.5,
};

export function hasDynamicPricing(slug: string): boolean {
  return slug in DYNAMIC_PRICING;
}

export function calculateDynamicCost(
  slug: string,
  baseCost: number,
  settings?: { duration?: number; resolution?: string },
): number {
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
