import { GenerationResult } from '../BaseProvider';

/**
 * Cost estimation utility for provider adapters
 * Uses approximate costs based on provider pricing
 */

// Token-based pricing (per 1000 tokens — averaged input+output)
const TOKEN_PRICING: Record<string, Record<string, number>> = {
  openai: {
    'gpt-4o': 0.00625, // $2.50/1M in + $10/1M out → avg ~$6.25/1M
    'gpt-4o-mini': 0.000375, // $0.15/1M in + $0.60/1M out → avg ~$0.375/1M
  },
  anthropic: {
    'claude-3-haiku-20240307': 0.00075, // $0.25/1M in + $1.25/1M out → avg ~$0.75/1M
    'claude-haiku-4-5-20251001': 0.003, // $1/1M in + $5/1M out → avg ~$3/1M
    'claude-sonnet-4-20250514': 0.009, // $3/1M in + $15/1M out → avg ~$9/1M
  },
  xai: {
    'grok-3-mini': 0.0004, // $0.30/1M in + $0.50/1M out → avg ~$0.40/1M
    'grok-3': 0.009, // $3/1M in + $15/1M out
  },
};

// Image pricing (per image) — keyed by user-facing slug
const IMAGE_PRICING: Record<string, number> = {
  'flux-schnell': 0.0015, // PiAPI cheapest at $0.0015
  'sdxl-lightning': 0.003, // Replicate ~$0.003
  'flux-kontext': 0.01, // KieAI ~$0.01
  'sdxl': 0.01, // Replicate ~$0.01
  'playground-v2-5': 0.01, // Replicate ~$0.01
  'dall-e-2': 0.02, // OpenAI $0.02
  'flux-dev': 0.025, // Runware/Replicate ~$0.025
  'flux-pro': 0.04, // Replicate $0.04
  'dall-e-3': 0.04, // OpenAI $0.04
  'nano-banana-pro': 0.09, // KieAI ~$0.09
  // Provider-specific model IDs (for backward compatibility)
  'Qubico/flux1-schnell': 0.0015,
  'flux/schnell': 0.003,
  'flux-kontext-pro': 0.01,
  'flux/dev': 0.025,
  'flux-pro/v1.1': 0.04,
};

// Video pricing (per second) — keyed by user-facing slug
const VIDEO_PRICING: Record<string, number> = {
  animatediff: 0.012, // Replicate ~$0.06/5s
  'zeroscope-v2': 0.012, // Replicate ~$0.06/5s
  wan: 0.02, // Replicate ~$0.10/5s
  kling: 0.026, // PiAPI $0.13/5s
  'kling-pro': 0.026, // PiAPI $0.26/10s
  seedance: 0.09, // KieAI ~$0.45/5s
  luma: 0.08, // Replicate ~$0.40/5s
  // Provider-specific model IDs
  'klingai/v2-master-text-to-video': 0.074,
  'kling-2.6/text-to-video': 0.056,
  'wan-ai/wan2.1-t2v-14b': 0.02,
};

// Audio pricing — keyed by user-facing slug
const AUDIO_PRICING: Record<string, { perChar?: number; perRequest?: number }> = {
  'deepgram-tts': { perChar: 0.000015 }, // OpenAI TTS (~$0.015/1K chars)
  'fish-speech': { perRequest: 0.03 }, // Replicate ~$0.03/run
  'xtts-v2': { perRequest: 0.05 }, // Replicate ~$0.05/run
  bark: { perRequest: 0.07 }, // Replicate ~$0.07/run
  'openai-tts': { perChar: 0.000015 }, // $0.015/1K chars
  'elevenlabs-tts': { perChar: 0.0003 }, // ~$0.06/200 chars
  suno: { perRequest: 0.10 }, // Replicate ~$0.10/run
  // Provider-level keys (for backward compatibility)
  elevenlabs: { perChar: 0.0003 },
  openai: { perChar: 0.000015 },
};

/**
 * Estimate cost for a text generation result
 */
export function estimateTextCost(
  provider: string,
  model: string,
  result: GenerationResult
): number {
  if (!('text' in result)) return 0;

  const text = result.text || '';
  const estimatedTokens = Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 chars

  const pricing = TOKEN_PRICING[provider];
  if (!pricing) return 0;

  const costPer1k = pricing[model] || Object.values(pricing)[0] || 0.001;
  return (estimatedTokens / 1000) * costPer1k;
}

/**
 * Estimate cost for an image generation result
 */
export function estimateImageCost(model: string): number {
  return IMAGE_PRICING[model] || 0.04; // Default $0.04 per image
}

/**
 * Estimate cost for a video generation result
 */
export function estimateVideoCost(model: string, durationSeconds: number = 5): number {
  const pricePerSec = VIDEO_PRICING[model] || 0.1;
  return pricePerSec * durationSeconds;
}

/**
 * Estimate cost for an audio generation result
 */
export function estimateAudioCost(
  model: string,
  inputText: string
): number {
  const pricing = AUDIO_PRICING[model];
  if (!pricing) return 0.01; // Default $0.01

  if (pricing.perChar) {
    return inputText.length * pricing.perChar;
  }

  return pricing.perRequest || 0.01;
}

/**
 * General cost estimator that routes to specific estimators
 */
export function estimateCost(
  provider: string,
  type: 'text' | 'image' | 'video' | 'audio',
  modelOrInput: string,
  result?: GenerationResult
): number {
  switch (type) {
    case 'text':
      return result ? estimateTextCost(provider, modelOrInput, result) : 0;
    case 'image':
      return estimateImageCost(modelOrInput);
    case 'video':
      return estimateVideoCost(modelOrInput);
    case 'audio':
      return estimateAudioCost(modelOrInput, ''); // Input text not available in adapter
    default:
      return 0;
  }
}
