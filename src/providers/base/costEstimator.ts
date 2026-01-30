import { GenerationResult } from '../BaseProvider';

/**
 * Cost estimation utility for provider adapters
 * Uses approximate costs based on provider pricing
 */

// Token-based pricing (per 1000 tokens)
const TOKEN_PRICING: Record<string, Record<string, number>> = {
  openai: {
    'gpt-4o': 0.0025, // $2.50 per 1M tokens input, $10 per 1M output (avg $0.0025/1k)
    'gpt-4o-mini': 0.00015, // $0.15 per 1M tokens input, $0.60 per 1M output (avg $0.00015/1k)
  },
  anthropic: {
    'claude-sonnet-4-20250514': 0.003, // $3 per 1M tokens input, $15 per 1M output (avg $0.003/1k)
  },
  xai: {
    'grok-beta': 0.005, // $5 per 1M tokens (estimated)
  },
};

// Image pricing (per image)
const IMAGE_PRICING: Record<string, number> = {
  'dall-e-3': 0.04, // $0.04 per image (1024x1024)
  'flux-pro': 0.04, // Replicate Flux Pro ~$0.04
  'flux-schnell': 0.003, // Replicate Flux Schnell ~$0.003
};

// Video pricing (per second)
const VIDEO_PRICING: Record<string, number> = {
  kling: 0.1, // Replicate Kling ~$0.10/sec (5 sec = $0.50)
  luma: 0.08, // Replicate Luma ~$0.08/sec (5 sec = $0.40)
};

// Audio pricing
const AUDIO_PRICING: Record<string, { perChar?: number; perRequest?: number }> = {
  elevenlabs: { perChar: 0.00002 }, // $0.30 per 1M characters
  bark: { perRequest: 0.015 }, // Replicate Bark ~$0.015 per request
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
