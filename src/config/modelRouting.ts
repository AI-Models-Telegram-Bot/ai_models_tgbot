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
      { name: 'openai', modelId: 'gpt-4o-mini' },                   // ultimate fallback
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

  // Claude Haiku — fast & cheap Anthropic
  'claude-haiku': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-haiku-4-5-20251001' },   // $1/$5 per 1M tok
      { name: 'openrouter', modelId: 'anthropic/claude-haiku-4-5' }, // fallback
    ],
  },

  // Claude Sonnet — balanced Anthropic
  'claude-sonnet': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-sonnet-4-20250514' },    // $3/$15 per 1M tok
      { name: 'openrouter', modelId: 'anthropic/claude-sonnet-4' },  // fallback
    ],
  },

  // Claude Sonnet with Extended Thinking
  'claude-sonnet-thinking': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-sonnet-4-20250514', extraOptions: { thinking: true } },
      { name: 'openrouter', modelId: 'anthropic/claude-sonnet-4', extraOptions: { thinking: true } },
    ],
  },

  // Claude Opus — most capable Anthropic
  'claude-opus': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-opus-4-20250514' },      // $15/$75 per 1M tok
      { name: 'openrouter', modelId: 'anthropic/claude-opus-4' },    // fallback
    ],
  },

  // Claude Opus with Extended Thinking
  'claude-opus-thinking': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-opus-4-20250514', extraOptions: { thinking: true } },
      { name: 'openrouter', modelId: 'anthropic/claude-opus-4', extraOptions: { thinking: true } },
    ],
  },

  // Deep Research — agentic web research powered by Claude
  'deep-research': {
    category: 'TEXT',
    providers: [
      { name: 'anthropic', modelId: 'claude-sonnet-4-20250514', extraOptions: { deepResearch: true } },
    ],
  },

  // Grok — xAI
  'grok': {
    category: 'TEXT',
    providers: [
      { name: 'xai', modelId: 'grok-3-mini' },                      // $0.30/$0.50 per 1M tok
      { name: 'openrouter', modelId: 'x-ai/grok-3-mini' },          // fallback
      { name: 'openai', modelId: 'gpt-4o-mini' },                   // ultimate fallback
    ],
  },

  // Gemini Flash — fast/cheap Google
  'gemini-flash': {
    category: 'TEXT',
    providers: [
      { name: 'google', modelId: 'gemini-2.5-flash' },              // $0.15/$0.60 per 1M tok
      { name: 'openrouter', modelId: 'google/gemini-2.5-flash-preview' }, // fallback
      { name: 'openai', modelId: 'gpt-4o-mini' },                   // ultimate fallback
    ],
  },

  // Gemini Pro — premium Google
  'gemini-pro': {
    category: 'TEXT',
    providers: [
      { name: 'google', modelId: 'gemini-2.5-pro' },                // $1.25/$10 per 1M tok
      { name: 'openrouter', modelId: 'google/gemini-2.5-pro-preview' },  // fallback
      { name: 'openai', modelId: 'gpt-4o' },                        // ultimate fallback
    ],
  },

  // DeepSeek R1 — reasoning model
  'deepseek-r1': {
    category: 'TEXT',
    providers: [
      { name: 'together', modelId: 'deepseek-ai/DeepSeek-R1' },     // $3.00/1M tok
      { name: 'groq', modelId: 'deepseek-r1-distill-llama-70b' },   // $0.75/1M tok (distilled)
      { name: 'openrouter', modelId: 'deepseek/deepseek-r1' },      // fallback
      { name: 'openai', modelId: 'gpt-4o' },                        // ultimate fallback
    ],
  },

  // Llama 4 Maverick — latest Llama
  'llama-4-maverick': {
    category: 'TEXT',
    providers: [
      { name: 'together', modelId: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8' }, // $0.27/$0.85
      { name: 'groq', modelId: 'meta-llama/llama-4-maverick-17b-128e-instruct' },          // if available
      { name: 'openrouter', modelId: 'meta-llama/llama-4-maverick' },                       // fallback
      { name: 'openai', modelId: 'gpt-4o-mini' },                   // ultimate fallback
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

  // Nano Banana — Gemini 2.5 Flash (fast, cheap)
  'nano-banana': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'nano-banana' },                    // ~$0.02
      { name: 'replicate', modelId: 'nano-banana' },                // fallback
    ],
  },

  // Nano Banana Pro — Gemini 3 Pro (high quality, up to 4K)
  'nano-banana-pro': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'nano-banana-pro' },                // ~$0.09
      { name: 'replicate', modelId: 'nano-banana-pro' },            // fallback
    ],
  },

  // Nano Banana 2 — Gemini 3.1 Flash (Pro quality at Flash speed, up to 4K)
  'nano-banana-2': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'nano-banana-2' },                  // ~$0.04
    ],
  },

  // Seedream 4.0 — ByteDance image gen
  'seedream': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'seedream-4.0' },                   // ~$0.0175
      { name: 'fal', modelId: 'fal-ai/bytedance/seedream/v4/text-to-image' },  // fallback
    ],
  },

  // Seedream 4.5 Beta — ByteDance latest, supports quality/resolution
  'seedream-4.5': {
    category: 'IMAGE',
    providers: [
      { name: 'kieai', modelId: 'seedream-4.5' },                   // ~$0.03-0.06
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

  // Kling Standard (mode: std) — version/duration come from user settings
  'kling': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling-2.6/text-to-video' },
      { name: 'piapi', modelId: 'kling', extraOptions: { mode: 'std' } },
      { name: 'fal', modelId: 'fal-ai/kling-video/v2.5/standard' },
      { name: 'replicate', modelId: 'kling' },
    ],
  },

  // Kling Pro (mode: pro) — version/duration come from user settings
  'kling-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling-2.6/text-to-video' },
      { name: 'piapi', modelId: 'kling', extraOptions: { mode: 'pro' } },
      { name: 'fal', modelId: 'fal-ai/kling-video/v2.5/pro' },
    ],
  },

  // Kling 3.0 — newest generation, supports sound, multi-shot, duration 3-15s
  'kling-3.0': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling-3.0/video' },
      { name: 'fal', modelId: 'fal-ai/kling-video/v3/standard/text-to-video' }, // fallback ~$0.084/s
    ],
  },

  // Kling Motion Control — animate a photo using motion from a reference video
  'kling-motion': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling-2.6/motion-control' },
      { name: 'fal', modelId: 'fal-ai/kling-video/v3/standard/motion-control' }, // fallback
    ],
  },

  // Kling AI Avatar Pro — talking head from photo + audio
  'kling-avatar-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling/ai-avatar-pro' },
    ],
  },

  // Kling AI Avatar Standard — talking head from photo + audio (cheaper)
  'kling-avatar': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'kling/ai-avatar-standard' },
    ],
  },

  // Seedance 1.0 Lite — ByteDance video (cheapest, 720p)
  'seedance-lite': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/bytedance/seedance/v1/lite/text-to-video' },    // ~$0.18
      { name: 'kieai', modelId: 'bytedance/seedance-1.0-lite' },                       // fallback
    ],
  },

  // Seedance 1.0 Pro — ByteDance video (best quality, 1080p)
  'seedance-1-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/bytedance/seedance/v1/pro/text-to-video' },     // ~$0.74
      { name: 'kieai', modelId: 'bytedance/seedance-1.0-pro' },                        // fallback
    ],
  },

  // Seedance 1.0 Fast — ByteDance video (fast + affordable 1080p)
  'seedance-fast': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/bytedance/seedance/v1/pro/fast/text-to-video' }, // ~$0.245
      { name: 'kieai', modelId: 'bytedance/seedance-1.0-fast' },                        // fallback
    ],
  },

  // Seedance 1.5 Pro — ByteDance video (latest)
  'seedance': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/bytedance/seedance/v1.5/pro/text-to-video' },  // ~$0.26
      { name: 'kieai', modelId: 'bytedance/seedance-1.5-pro' },                       // ~$0.20 (fallback)
    ],
  },

  // Wan 2.1 — affordable video
  'wan': {
    category: 'VIDEO',
    providers: [
      { name: 'fal', modelId: 'fal-ai/wan-t2v' },                   // $0.20 (480p) / $0.40 (720p)
      { name: 'replicate', modelId: 'wan' },                        // ~$0.18
    ],
  },

  // Veo 3 Fast — Google video (fast)
  'veo-fast': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'veo3_fast' },                      // $0.40
      { name: 'fal', modelId: 'fal-ai/veo3/fast' },                 // $0.10-0.15/s (fast variant)
    ],
  },

  // Veo 3 Quality — Google video (premium)
  'veo': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'veo3' },                           // $2.00
      { name: 'fal', modelId: 'fal-ai/veo3' },                      // fallback ~$0.40/s
    ],
  },

  // Sora 2 — OpenAI video
  'sora': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'sora-2-text-to-video' },           // ~$0.50
      { name: 'fal', modelId: 'fal-ai/sora-2/text-to-video' },      // fallback
    ],
  },

  // Sora 2 Pro — OpenAI premium video
  'sora-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'sora-2-pro-text-to-video' },       // ~$0.80
      { name: 'fal', modelId: 'fal-ai/sora-2/text-to-video/pro' },  // fallback
    ],
  },

  // Runway Gen-4 Turbo — fast video gen
  'runway': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'runway' },                          // ~$0.30
    ],
  },

  // Runway Gen-4 — standard quality
  'runway-gen4': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'runway-gen4' },                     // ~$0.40
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

  // Topaz AI — video upscaling (KieAI wrapper)
  'topaz': {
    category: 'VIDEO',
    providers: [
      { name: 'kieai', modelId: 'topaz/video-upscale' },
    ],
  },

  // Topaz AI Pro — premium video enhancement (direct API, full controls)
  'topaz-direct': {
    category: 'VIDEO',
    providers: [
      { name: 'topaz-direct', modelId: 'topaz-direct' },
    ],
  },

  // WaveSpeed — budget video upscaling
  'wavespeed': {
    category: 'VIDEO',
    providers: [
      { name: 'wavespeed', modelId: 'wavespeed-ai/video-upscaler' },
    ],
  },

  // WaveSpeed Pro — better video upscaling
  'wavespeed-pro': {
    category: 'VIDEO',
    providers: [
      { name: 'wavespeed', modelId: 'wavespeed-ai/video-upscaler-pro' },
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
