import { GenerationResult } from '../BaseProvider';

/**
 * Cost estimation utility for provider adapters
 * Uses actual costs based on provider pricing (Feb 2026)
 */

// Token-based pricing (per 1000 tokens — averaged input+output)
const TOKEN_PRICING: Record<string, Record<string, number>> = {
  groq: {
    'llama-3.3-70b-versatile': 0.00069,       // $0.59/1M in + $0.79/1M out → avg ~$0.69/1M
    'llama-3.1-8b-instant': 0.000065,          // $0.05/1M in + $0.08/1M out → avg ~$0.065/1M
    'mixtral-8x7b-32768': 0.00024,             // $0.24/1M in + $0.24/1M out
    'deepseek-r1-distill-llama-70b': 0.00075,  // $0.75/1M avg
    'whisper-large-v3': 0.000111,              // $0.111/hr → per ~1K tokens transcribed
  },
  together: {
    'meta-llama/Llama-3.3-70B-Instruct-Turbo': 0.00088, // $0.88/1M tok
    'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': 0.00056, // $0.27/$0.85 avg ~$0.56/1M
    'deepseek-ai/DeepSeek-R1': 0.003,          // $3.00/1M tok
  },
  google: {
    'gemini-2.5-flash': 0.000375,              // $0.15/1M in + $0.60/1M out → avg ~$0.375/1M
    'gemini-2.5-pro': 0.005625,                // $1.25/1M in + $10/1M out → avg ~$5.625/1M
  },
  openai: {
    'gpt-4o': 0.00625,                         // $2.50/1M in + $10/1M out → avg ~$6.25/1M
    'gpt-4o-mini': 0.000375,                   // $0.15/1M in + $0.60/1M out → avg ~$0.375/1M
  },
  anthropic: {
    'claude-3-haiku-20240307': 0.00075,         // $0.25/1M in + $1.25/1M out → avg ~$0.75/1M
    'claude-haiku-4-5-20251001': 0.003,         // $1/1M in + $5/1M out → avg ~$3/1M
    'claude-sonnet-4-20250514': 0.009,          // $3/1M in + $15/1M out → avg ~$9/1M
  },
  xai: {
    'grok-3-mini': 0.0004,                     // $0.30/1M in + $0.50/1M out → avg ~$0.40/1M
    'grok-3': 0.009,                           // $3/1M in + $15/1M out
  },
  openrouter: {
    // OpenRouter adds small markup; use base provider pricing + ~5%
    'openai/gpt-4o': 0.006563,
    'openai/gpt-4o-mini': 0.000394,
    'anthropic/claude-sonnet-4': 0.00945,
    'meta-llama/llama-3.3-70b-instruct': 0.00072,
    'google/gemini-2.5-flash-preview': 0.000394,
    'google/gemini-2.5-pro-preview': 0.005906,
    'x-ai/grok-3-mini': 0.00042,
    'deepseek/deepseek-r1': 0.00315,
    'meta-llama/llama-4-maverick': 0.00059,
  },
};

// Image pricing (per image) — keyed by user-facing slug
const IMAGE_PRICING: Record<string, number> = {
  // User-facing slugs
  'flux-schnell': 0.0006,            // Runware cheapest
  'sdxl-lightning': 0.0006,          // Runware
  'sdxl': 0.0026,                    // Runware
  'flux-dev': 0.0038,               // Runware
  'flux-2-turbo': 0.008,            // Fal.ai
  'flux-kontext': 0.01,             // KieAI
  'seedream': 0.0175,               // KieAI
  'nano-banana-pro': 0.02,          // KieAI
  'playground-v2-5': 0.01,          // Replicate
  'dall-e-2': 0.02,                 // OpenAI
  'flux-pro': 0.04,                 // Fal/Replicate
  'dall-e-3': 0.04,                 // OpenAI
  'midjourney': 0.04,               // KieAI
  // Provider-specific model IDs (for backward compatibility)
  'runware:100@1': 0.0006,
  'runware:101@1': 0.0038,
  'runware:sdxl-lightning': 0.0006,
  'runware:sdxl': 0.0026,
  'Qubico/flux1-schnell': 0.002,
  'fal-ai/flux/schnell': 0.003,
  'fal-ai/flux/dev': 0.025,
  'fal-ai/flux-pro/v1.1': 0.04,
  'fal-ai/flux-2/turbo': 0.008,
  'fal-ai/flux-kontext/pro': 0.01,
  'fal-ai/seedream': 0.0175,
  'flux-kontext-pro': 0.01,
  'seedream-4.0': 0.0175,
  'flux/schnell': 0.003,
  'flux/dev': 0.025,
  'flux-pro/v1.1': 0.04,
};

// Video pricing (per second) — keyed by user-facing slug
const VIDEO_PRICING: Record<string, number> = {
  // User-facing slugs (per second)
  wan: 0.05,                          // Fal $0.05/s → $0.25/5s
  seedance: 0.04,                     // KieAI ~$0.20/5s
  kling: 0.052,                       // PiAPI $0.26/5s
  'kling-pro': 0.046,                 // PiAPI $0.46/10s
  'kling-master': 0.192,              // PiAPI $0.96/5s
  luma: 0.08,                         // Fal/Replicate ~$0.40/5s
  runway: 0.06,                       // KieAI ~$0.30/5s
  sora: 0.10,                         // KieAI ~$0.50/5s
  'veo-fast': 0.08,                   // KieAI ~$0.40/5s
  veo: 0.40,                          // KieAI ~$2.00/5s
  // Provider-specific model IDs
  'kling-2.6/text-to-video': 0.056,
  'seedance-2.0/text-to-video': 0.04,
  'sora-2-text-to-video': 0.10,
  veo3_fast: 0.08,
  veo3: 0.40,
  'fal-ai/kling-video/v2.5/standard': 0.07,
  'fal-ai/kling-video/v2.5/pro': 0.07,
  'fal-ai/wan/v2.5/text-to-video': 0.05,
  'fal-ai/luma-dream-machine': 0.08,
  'fal-ai/veo3': 0.40,
  'fal-ai/runway-gen3/turbo': 0.05,
  'fal-ai/seedance': 0.04,
};

// Audio pricing — keyed by user-facing slug
const AUDIO_PRICING: Record<string, { perChar?: number; perRequest?: number; perHour?: number }> = {
  'deepgram-tts': { perChar: 0.000015 },     // OpenAI TTS (~$0.015/1K chars)
  'openai-tts': { perChar: 0.000015 },       // $0.015/1K chars
  'fish-speech': { perRequest: 0.03 },        // Replicate ~$0.03/run
  'xtts-v2': { perRequest: 0.05 },            // Replicate ~$0.05/run
  bark: { perRequest: 0.07 },                 // Replicate ~$0.07/run
  'elevenlabs-tts': { perChar: 0.0003 },      // ~$0.06/200 chars
  suno: { perRequest: 0.10 },                 // Replicate ~$0.10/run
  whisper: { perHour: 0.111 },                // Groq $0.111/hr (cheapest STT)
  // Provider-level keys (for backward compatibility)
  elevenlabs: { perChar: 0.0003 },
  openai: { perChar: 0.000015 },
  groq: { perHour: 0.111 },
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

  if (pricing.perHour) {
    // Assume ~30 seconds of audio per request
    return pricing.perHour * (30 / 3600);
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
