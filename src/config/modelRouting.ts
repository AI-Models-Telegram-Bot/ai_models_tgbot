import { ModelCategory } from '@prisma/client';

/**
 * Model Routing Configuration
 *
 * Maps user-facing model slugs to provider-specific model IDs.
 * Each slug lists providers in priority order (cheapest first).
 * When a user selects a model, ProviderManager uses this to:
 *   1. Only try providers that support that model
 *   2. Pass the correct provider-specific model ID
 *   3. Fall back through matching providers in order
 */

export interface ProviderRoute {
  name: string;
  modelId: string;
  extraOptions?: Record<string, unknown>;
}

export interface ModelRoute {
  category: ModelCategory;
  providers: ProviderRoute[];
}

export const MODEL_ROUTES: Record<string, ModelRoute> = {
  // ===================== TEXT =====================
  'gpt-4o': {
    category: 'TEXT',
    providers: [
      { name: 'aimlapi', modelId: 'gpt-4o' },
      { name: 'openai', modelId: 'gpt-4o' },
    ],
  },
  'gpt-4o-mini': {
    category: 'TEXT',
    providers: [
      { name: 'aimlapi', modelId: 'gpt-4o-mini' },
      { name: 'openai', modelId: 'gpt-4o-mini' },
    ],
  },
  'claude-sonnet': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
    ],
  },
  'grok': {
    category: 'TEXT',
    providers: [
      { name: 'xai', modelId: 'grok-3-mini' },
    ],
  },

  // ===================== IMAGE =====================
  'flux-schnell': {
    category: 'IMAGE',
    providers: [
      { name: 'piapi', modelId: 'Qubico/flux1-schnell' },       // $0.0015
      { name: 'aimlapi', modelId: 'flux/schnell' },              // $0.003
      { name: 'replicate', modelId: 'flux-schnell' },            // $0.003
    ],
  },
  'flux-pro': {
    category: 'IMAGE',
    providers: [
      { name: 'aimlapi', modelId: 'flux-pro/v1.1' },            // ~$0.04
      { name: 'replicate', modelId: 'flux-pro' },                // $0.04
    ],
  },
  'flux-dev': {
    category: 'IMAGE',
    providers: [
      { name: 'aimlapi', modelId: 'flux/dev' },                  // ~$0.025
      { name: 'replicate', modelId: 'flux-dev' },                // $0.025
    ],
  },
  'flux-kontext': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'flux-kontext-pro' },            // ~$0.01
      { name: 'aimlapi', modelId: 'flux-kontext/pro' },          // ~$0.04
    ],
  },
  'dall-e-3': {
    category: 'IMAGE',
    providers: [
      { name: 'openai', modelId: 'dall-e-3' },                   // $0.04
    ],
  },
  'dall-e-2': {
    category: 'IMAGE',
    providers: [
      { name: 'openai', modelId: 'dall-e-2' },                   // $0.02
    ],
  },
  'sdxl-lightning': {
    category: 'IMAGE',
    providers: [
      { name: 'replicate', modelId: 'sdxl-lightning' },          // ~$0.003
    ],
  },
  'sdxl': {
    category: 'IMAGE',
    providers: [
      { name: 'replicate', modelId: 'sdxl' },                    // ~$0.01
    ],
  },
  'playground-v2-5': {
    category: 'IMAGE',
    providers: [
      { name: 'replicate', modelId: 'playground-v2-5' },         // ~$0.01
    ],
  },
  'ideogram': {
    category: 'IMAGE',
    providers: [
      { name: 'aimlapi', modelId: 'ideogram/v2' },               // ~$0.08
    ],
  },

  // ===================== VIDEO =====================
  'kling': {
    category: 'VIDEO',
    providers: [
      { name: 'piapi', modelId: 'kling' },                       // $0.13/5s
      { name: 'kieai', modelId: 'kling-2.6/text-to-video' },     // $0.28/5s
      { name: 'aimlapi', modelId: 'klingai/v2-master-text-to-video' }, // $0.37/5s
      { name: 'replicate', modelId: 'kling' },                   // $1.40/5s
    ],
  },
  'kling-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'piapi', modelId: 'kling', extraOptions: { duration: 10 } },       // $0.26/10s
      { name: 'kieai', modelId: 'kling-2.6/text-to-video', extraOptions: { duration: '10' } }, // $0.56/10s
      { name: 'aimlapi', modelId: 'klingai/v2-master-text-to-video', extraOptions: { duration: '10' } }, // $0.74/10s
    ],
  },
  'luma': {
    category: 'VIDEO',
    providers: [
      { name: 'replicate', modelId: 'luma' },                    // ~$0.40/5s
    ],
  },
  'wan': {
    category: 'VIDEO',
    providers: [
      { name: 'aimlapi', modelId: 'wan-ai/wan2.1-t2v-14b' },    // ~$0.10
      { name: 'replicate', modelId: 'wan' },                     // ~$0.18
    ],
  },
  'animatediff': {
    category: 'VIDEO',
    providers: [
      { name: 'replicate', modelId: 'animatediff' },             // ~$0.06
    ],
  },
  'zeroscope-v2': {
    category: 'VIDEO',
    providers: [
      { name: 'replicate', modelId: 'zeroscope-v2' },            // ~$0.06
    ],
  },

  // ===================== AUDIO =====================
  'deepgram-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'aimlapi', modelId: '#g1_aura-asteria-en' },       // ~$0.001/200 chars
    ],
  },
  'openai-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'aimlapi', modelId: 'tts-1' },                     // ~$0.015/1K chars via AIMLAPI
    ],
  },
  'elevenlabs-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'elevenlabs', modelId: 'eleven_multilingual_v2' },  // ~$0.06/200 chars
    ],
  },
  'bark': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'bark' },                    // ~$0.07/run
    ],
  },
  'xtts-v2': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'xtts-v2' },                 // ~$0.05/run
    ],
  },
  'fish-speech': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'fish-speech' },             // ~$0.03/run
    ],
  },
  'suno': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'suno' },                    // ~$0.10/run
    ],
  },
};
