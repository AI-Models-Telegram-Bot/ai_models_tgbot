import { getRedis } from './redis';
import { config } from './index';
import { logger } from '../utils/logger';

export type ProviderName =
  | 'openai' | 'anthropic' | 'xai' | 'replicate' | 'elevenlabs'
  | 'groq' | 'together' | 'fal' | 'google' | 'runware' | 'kieai' | 'piapi' | 'openrouter';

const RATE_LIMIT_PREFIX = 'ratelimit:';
const RATE_LIMIT_WINDOW = 60; // seconds

/** Rate limits per provider (requests per minute per key) */
const RATE_LIMITS: Record<ProviderName, number> = {
  openai: 500,
  anthropic: 200,
  xai: 200,
  replicate: 100,
  elevenlabs: 100,
  groq: 30,       // Free tier: 30 req/min, paid tier higher
  together: 100,
  fal: 100,
  google: 360,    // Gemini: 360 RPM on paid tier
  runware: 200,
  kieai: 100,
  piapi: 100,
  openrouter: 200,
};

/** Pool of keys per provider, lazily initialized */
let pools: Map<ProviderName, string[]> | null = null;

function parseKeyList(envKeys: string | undefined, fallbackKey: string): string[] {
  if (envKeys) {
    return envKeys.split(',').map(k => k.trim()).filter(Boolean);
  }
  if (fallbackKey) {
    return [fallbackKey];
  }
  return [];
}

function initPools(): Map<ProviderName, string[]> {
  if (pools) return pools;

  pools = new Map<ProviderName, string[]>([
    ['openai', parseKeyList(process.env.OPENAI_API_KEYS, config.ai.openai.apiKey)],
    ['anthropic', parseKeyList(process.env.ANTHROPIC_API_KEYS, config.ai.anthropic.apiKey)],
    ['xai', parseKeyList(process.env.XAI_API_KEYS, config.ai.xai.apiKey)],
    ['replicate', parseKeyList(process.env.REPLICATE_API_KEYS, config.ai.replicate.apiToken)],
    ['elevenlabs', parseKeyList(process.env.ELEVENLABS_API_KEYS, config.ai.elevenlabs.apiKey)],
    ['groq', parseKeyList(process.env.GROQ_API_KEYS, config.ai.groq.apiKey)],
    ['together', parseKeyList(process.env.TOGETHER_API_KEYS, config.ai.together.apiKey)],
    ['fal', parseKeyList(process.env.FAL_API_KEYS, config.ai.fal.apiKey)],
    ['google', parseKeyList(process.env.GOOGLE_AI_API_KEYS, config.ai.google.apiKey)],
    ['runware', parseKeyList(process.env.RUNWARE_API_KEYS, config.ai.runware.apiKey)],
    ['kieai', parseKeyList(process.env.KIEAI_API_KEYS, config.ai.kieai.apiKey)],
    ['piapi', parseKeyList(process.env.PIAPI_API_KEYS, config.ai.piapi.apiKey)],
    ['openrouter', parseKeyList(process.env.OPENROUTER_API_KEYS, config.ai.openrouter.apiKey)],
  ]);

  for (const [provider, keys] of pools.entries()) {
    logger.info(`Key pool: ${provider} has ${keys.length} key(s)`);
  }

  return pools;
}

/**
 * Get the next available API key for a provider using round-robin
 * with Redis-based rate limiting.
 */
export async function getNextKey(provider: ProviderName): Promise<string> {
  const pool = initPools();
  const keys = pool.get(provider);

  if (!keys || keys.length === 0) {
    throw new Error(`No API keys configured for ${provider}`);
  }

  // Single key: skip Redis overhead
  if (keys.length === 1) {
    return keys[0];
  }

  const redis = getRedis();
  const maxPerKey = Math.floor(RATE_LIMITS[provider] / keys.length);

  for (let i = 0; i < keys.length; i++) {
    const redisKey = `${RATE_LIMIT_PREFIX}${provider}:${i}`;

    try {
      const usage = await redis.get(redisKey);
      const count = usage ? parseInt(usage, 10) : 0;

      if (count < maxPerKey) {
        // Check cooldown
        const cooldownKey = `${RATE_LIMIT_PREFIX}cooldown:${provider}:${i}`;
        const inCooldown = await redis.exists(cooldownKey);
        if (inCooldown) continue;

        await redis.incr(redisKey);
        await redis.expire(redisKey, RATE_LIMIT_WINDOW);

        logger.debug(`Using ${provider} key #${i} (${count + 1}/${maxPerKey})`);
        return keys[i];
      }
    } catch (error) {
      logger.warn(`Error checking rate limit for ${provider} key #${i}`, { error });
      continue;
    }
  }

  // All keys at limit - return first key anyway (let provider handle 429)
  logger.warn(`All ${provider} keys at rate limit, using key #0`);
  return keys[0];
}

/**
 * Mark a key as rate-limited (cooldown period).
 * Called when a provider returns 429.
 */
export async function markKeyCooldown(
  provider: ProviderName,
  keyIndex: number,
  durationMs: number = 60000
): Promise<void> {
  try {
    const redis = getRedis();
    const cooldownKey = `${RATE_LIMIT_PREFIX}cooldown:${provider}:${keyIndex}`;
    await redis.set(cooldownKey, '1', 'PX', durationMs);
    logger.warn(`${provider} key #${keyIndex} in cooldown for ${durationMs}ms`);
  } catch (error) {
    logger.warn('Failed to set key cooldown', { error });
  }
}

/**
 * Get key pool stats for monitoring.
 */
export async function getKeyPoolStats(): Promise<Record<string, unknown>> {
  const pool = initPools();
  const stats: Record<string, unknown> = {};
  const redis = getRedis();

  for (const [provider, keys] of pool.entries()) {
    const keyStats = [];
    for (let i = 0; i < keys.length; i++) {
      const redisKey = `${RATE_LIMIT_PREFIX}${provider}:${i}`;
      const usage = await redis.get(redisKey);
      const cooldownKey = `${RATE_LIMIT_PREFIX}cooldown:${provider}:${i}`;
      const inCooldown = await redis.exists(cooldownKey);

      keyStats.push({
        index: i,
        usage: usage ? parseInt(usage, 10) : 0,
        maxPerMinute: Math.floor(RATE_LIMITS[provider] / keys.length),
        inCooldown: !!inCooldown,
      });
    }

    stats[provider] = {
      totalKeys: keys.length,
      rateLimit: RATE_LIMITS[provider],
      keys: keyStats,
    };
  }

  return stats;
}
