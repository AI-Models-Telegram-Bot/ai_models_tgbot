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
 *
 * COST NOTES (Feb 2026):
 * - Groq: cheapest/fastest for open-source LLMs ($0.05-0.79/1M tok)
 * - Together: good secondary for open-source ($0.27-3.00/1M tok)
 * - Google: cheap for Gemini ($0.15-1.25/1M tok input)
 * - Runware: cheapest images ($0.0006/image Flux Schnell)
 * - Kie.ai: cheapest video ($0.20-2.00), good for premium image
 * - Fal.ai: good fallback for image/video ($0.003-0.40/s)
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

  // Fast Text — cheap open-source via Groq/Together (loss leader)
  'fast-text': {
    category: 'TEXT',
    providers: [
      { name: 'groq', modelId: 'llama-3.3-70b-versatile' },        // $0.59/$0.79 per 1M tok, ~250 tok/s
      { name: 'together', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }, // $0.88/1M tok
      { name: 'openrouter', modelId: 'meta-llama/llama-3.3-70b-instruct' },     // fallback
    ],
  },

  // GPT-4o — premium OpenAI
  'gpt-4o': {
    category: 'TEXT',
    providers: [
      { name: 'openai', modelId: 'gpt-4o' },                       // $5/$15 per 1M tok
      { name: 'openrouter', modelId: 'openai/gpt-4o' },             // fallback
    ],
  },

  // GPT-4o Mini — affordable OpenAI
  'gpt-4o-mini': {
    category: 'TEXT',
    providers: [
      { name: 'openai', modelId: 'gpt-4o-mini' },                   // $0.15/$0.60 per 1M tok
      { name: 'openrouter', modelId: 'openai/gpt-4o-mini' },        // fallback
    ],
  },

  // Claude Sonnet — premium Anthropic
  'claude-sonnet': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-sonnet-4-20250514' },    // $3/$15 per 1M tok
      { name: 'openrouter', modelId: 'anthropic/claude-sonnet-4' },  // fallback
    ],
  },

  // Grok — xAI
  'grok': {
    category: 'TEXT',
    providers: [
      { name: 'xai', modelId: 'grok-3-mini' },                      // $0.30/$0.50 per 1M tok
      { name: 'openrouter', modelId: 'x-ai/grok-3-mini' },          // fallback
    ],
  },

  // Gemini Flash — fast/cheap Google
  'gemini-flash': {
    category: 'TEXT',
    providers: [
      { name: 'google', modelId: 'gemini-2.5-flash' },              // $0.15/$0.60 per 1M tok
      { name: 'openrouter', modelId: 'google/gemini-2.5-flash-preview' }, // fallback
    ],
  },

  // Gemini Pro — premium Google
  'gemini-pro': {
    category: 'TEXT',
    providers: [
      { name: 'google', modelId: 'gemini-2.5-pro' },                // $1.25/$10 per 1M tok
      { name: 'openrouter', modelId: 'google/gemini-2.5-pro-preview' },  // fallback
    ],
  },

  // DeepSeek R1 — reasoning model
  'deepseek-r1': {
    category: 'TEXT',
    providers: [
      { name: 'together', modelId: 'deepseek-ai/DeepSeek-R1' },     // $3.00/1M tok
      { name: 'groq', modelId: 'deepseek-r1-distill-llama-70b' },   // $0.75/1M tok (distilled)
      { name: 'openrouter', modelId: 'deepseek/deepseek-r1' },      // fallback
    ],
  },

  // Llama 4 Maverick — latest Llama
  'llama-4-maverick': {
    category: 'TEXT',
    providers: [
      { name: 'together', modelId: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8' }, // $0.27/$0.85
      { name: 'groq', modelId: 'meta-llama/llama-4-maverick-17b-128e-instruct' },          // if available
      { name: 'openrouter', modelId: 'meta-llama/llama-4-maverick' },                       // fallback
    ],
  },

  // ===================== IMAGE =====================

  // Flux Schnell — fast/cheap (loss leader)
  'flux-schnell': {
    category: 'IMAGE',
    providers: [
      { name: 'runware', modelId: 'runware:100@1' },                // $0.0006
      { name: 'fal', modelId: 'fal-ai/flux/schnell' },              // $0.003
      { name: 'piapi', modelId: 'Qubico/flux1-schnell' },           // $0.002
      { name: 'replicate', modelId: 'flux-schnell' },               // $0.003
    ],
  },

  // Flux Dev — high quality
  'flux-dev': {
    category: 'IMAGE',
    providers: [
      { name: 'runware', modelId: 'runware:101@1' },                // $0.0038
      { name: 'fal', modelId: 'fal-ai/flux/dev' },                  // $0.025
      { name: 'replicate', modelId: 'flux-dev' },                   // $0.025
    ],
  },

  // Flux Pro — premium
  'flux-pro': {
    category: 'IMAGE',
    providers: [
      { name: 'fal', modelId: 'fal-ai/flux-pro/v1.1' },            // $0.04
      { name: 'replicate', modelId: 'flux-pro' },                   // $0.04
    ],
  },

  // Flux 2 Turbo — new fast model
  'flux-2-turbo': {
    category: 'IMAGE',
    providers: [
      { name: 'fal', modelId: 'fal-ai/flux-2/turbo' },             // $0.008
      { name: 'runware', modelId: 'runware:101@1' },                // $0.004 fallback
    ],
  },

  // Flux Kontext — context-aware editing
  'flux-kontext': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'flux-kontext-pro' },               // ~$0.01
      { name: 'fal', modelId: 'fal-ai/flux-kontext/pro' },          // fallback
    ],
  },

  // SDXL Lightning — ultra-fast
  'sdxl-lightning': {
    category: 'IMAGE',
    providers: [
      { name: 'runware', modelId: 'runware:sdxl-lightning' },       // $0.0006
      { name: 'replicate', modelId: 'sdxl-lightning' },             // $0.0042
    ],
  },

  // SDXL — versatile
  'sdxl': {
    category: 'IMAGE',
    providers: [
      { name: 'runware', modelId: 'runware:sdxl' },                 // $0.0026
      { name: 'replicate', modelId: 'sdxl' },                       // $0.01
    ],
  },

  // DALL-E 3 — OpenAI premium
  'dall-e-3': {
    category: 'IMAGE',
    providers: [
      { name: 'openai', modelId: 'dall-e-3' },                      // $0.04
    ],
  },

  // DALL-E 2 — OpenAI affordable
  'dall-e-2': {
    category: 'IMAGE',
    providers: [
      { name: 'openai', modelId: 'dall-e-2' },                      // $0.02
    ],
  },

  // Midjourney — artistic (KieAI only)
  'midjourney': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'midjourney' },                     // ~$0.04
    ],
  },

  // Nano Banana Pro — Gemini-based image gen
  'nano-banana-pro': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'nano-banana-pro' },                // ~$0.02
      { name: 'replicate', modelId: 'nano-banana-pro' },            // fallback
    ],
  },

  // Seedream 4.0 — ByteDance image gen
  'seedream': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'seedream-4.0' },                   // ~$0.0175
      { name: 'fal', modelId: 'fal-ai/seedream' },                  // fallback
    ],
  },

  // Playground v2.5 — aesthetic images
  'playground-v2-5': {
    category: 'IMAGE',
    providers: [
      { name: 'replicate', modelId: 'playground-v2-5' },            // ~$0.01
    ],
  },

  // ===================== VIDEO =====================

  // Kling Standard — 5s
  'kling': {
    category: 'VIDEO',
    providers: [
      { name: 'piapi', modelId: 'kling' },                          // $0.26/5s
      { name: 'fal', modelId: 'fal-ai/kling-video/v2.5/standard' }, // $0.07/s ($0.35/5s)
      { name: 'kieai', modelId: 'kling-2.6/text-to-video' },        // $0.28/5s
      { name: 'replicate', modelId: 'kling' },                      // $1.40/5s
    ],
  },

  // Kling Pro — 10s extended
  'kling-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'piapi', modelId: 'kling', extraOptions: { duration: 10 } },        // $0.46/10s
      { name: 'fal', modelId: 'fal-ai/kling-video/v2.5/pro' },                    // ~$0.70/10s
      { name: 'kieai', modelId: 'kling-2.6/text-to-video', extraOptions: { duration: '10' } },
    ],
  },

  // Kling Master — best quality
  'kling-master': {
    category: 'VIDEO',
    providers: [
      { name: 'piapi', modelId: 'kling', extraOptions: { mode: 'master' } },      // $0.96/5s
    ],
  },

  // Seedance — ByteDance video (fal.ai primary, kieai has issues)
  'seedance': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/bytedance/seedance/v1.5/pro/text-to-video' },  // ~$0.26
      { name: 'kieai', modelId: 'bytedance/seedance-1.5-pro' },                       // ~$0.20 (currently broken)
    ],
  },

  // Wan 2.5 — affordable video
  'wan': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/wan/v2.5/text-to-video' },   // $0.05/s ($0.25/5s)
      { name: 'replicate', modelId: 'wan' },                        // ~$0.18
    ],
  },

  // Veo 3 Fast — Google video (fast)
  'veo-fast': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'veo3_fast' },                      // $0.40
      { name: 'fal', modelId: 'fal-ai/veo3' },                     // $0.40/s (expensive)
    ],
  },

  // Veo 3 Quality — Google video (premium)
  'veo': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'veo3' },                           // $2.00
    ],
  },

  // Sora 2 — OpenAI video
  'sora': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'sora-2-text-to-video' },           // ~$0.50
    ],
  },

  // Runway — video gen (fal primary — kieai runway tends to time out)
  'runway': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/runway-gen3/turbo' },         // ~$0.35
      { name: 'kieai', modelId: 'runway' },                          // ~$0.30 fallback
    ],
  },

  // Luma Dream Machine — video gen
  'luma': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/luma-dream-machine' },       // ~$0.40
      { name: 'replicate', modelId: 'luma' },                       // fallback
    ],
  },

  // ===================== AUDIO =====================

  // Deepgram TTS — cheapest
  'deepgram-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'openai', modelId: 'tts-1' },                         // ~$0.015/1K chars
    ],
  },

  // OpenAI TTS — standard quality
  'openai-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'openai', modelId: 'tts-1' },                         // ~$0.015/1K chars
    ],
  },

  // ElevenLabs TTS — premium quality
  'elevenlabs-tts': {
    category: 'AUDIO',
    providers: [
      { name: 'elevenlabs', modelId: 'eleven_multilingual_v2' },     // ~$0.06/200 chars
    ],
  },

  // Bark — text-to-speech with emotion
  'bark': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'bark' },                       // ~$0.07/run
    ],
  },

  // XTTS v2 — multilingual voice cloning
  'xtts-v2': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'xtts-v2' },                    // ~$0.05/run
    ],
  },

  // Fish Speech — fast voice cloning
  'fish-speech': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'fish-speech' },                // ~$0.03/run
    ],
  },

  // Suno AI — music generation
  'suno': {
    category: 'AUDIO',
    providers: [
      { name: 'replicate', modelId: 'suno' },                       // ~$0.10/run
    ],
  },

  // Whisper — speech-to-text transcription
  'whisper': {
    category: 'AUDIO',
    providers: [
      { name: 'groq', modelId: 'whisper-large-v3' },                // $0.111/hr (fastest)
      { name: 'replicate', modelId: 'whisper' },                    // ~$0.0034/run
    ],
  },
};
