import { ProviderConfig } from '../providers/base/ProviderConfig';

/**
 * Provider configurations for all categories
 * Priority: 1=primary, 2=secondary, 3=tertiary, etc.
 * Lower numbers are tried first. If a provider fails, the next one is tried automatically.
 * Providers without API keys are skipped during registration.
 *
 * COST STRATEGY — priorities based on actual per-unit pricing (Feb 2026):
 *
 * TEXT  (per ~1K in + 1K out tokens):
 *   AIMLAPI gpt-4o-mini  ~$0.00075  |  OpenAI gpt-4o-mini  ~$0.00075
 *   XAI grok-3-mini      ~$0.00080  |  Anthropic haiku-3    ~$0.0015
 *
 * IMAGE (per image):
 *   PiAPI Flux Schnell   $0.0015  |  AIMLAPI Flux Schnell  $0.003
 *   Replicate Flux       $0.003   |  KieAI Flux Kontext    ~$0.01
 *   OpenAI DALL-E 3      $0.04
 *
 * VIDEO (per 5s clip):
 *   PiAPI Kling   $0.13  |  KieAI Kling 2.6  $0.28
 *   AIMLAPI Kling $0.37  |  Replicate Kling   $1.40
 *
 * AUDIO (per ~200 chars):
 *   AIMLAPI Deepgram  ~$0.001  |  Replicate Bark  ~$0.07
 *   ElevenLabs        ~$0.06
 */
export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // ============ TEXT PROVIDERS ============
  // AIMLAPI gpt-4o-mini (1) → OpenAI gpt-4o-mini (2) → XAI grok-3-mini (3) → Anthropic haiku (4)
  text_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  text_openai: {
    name: 'openai',
    enabled: true,
    priority: 2,
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  text_xai: {
    name: 'xai',
    enabled: true,
    priority: 3,
    apiKey: process.env.XAI_API_KEY || '',
  },
  text_anthropic: {
    name: 'anthropic',
    enabled: true,
    priority: 4,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  // ============ IMAGE PROVIDERS ============
  // PiAPI Flux $0.0015 (1) → AIMLAPI Flux $0.003 (2) → Replicate Flux $0.003 (3)
  // → KieAI Kontext ~$0.01 (4) → OpenAI DALL-E $0.04 (5)
  image_piapi: {
    name: 'piapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.PIAPI_KEY || '',
  },
  image_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 2,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  image_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },
  image_kieai: {
    name: 'kieai',
    enabled: true,
    priority: 4,
    apiKey: process.env.KIEAI_KEY || '',
  },
  image_openai: {
    name: 'openai',
    enabled: true,
    priority: 5,
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // ============ VIDEO PROVIDERS ============
  // PiAPI Kling $0.13 (1) → KieAI Kling $0.28 (2) → AIMLAPI Kling $0.37 (3) → Replicate $1.40 (4)
  video_piapi: {
    name: 'piapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.PIAPI_KEY || '',
  },
  video_kieai: {
    name: 'kieai',
    enabled: true,
    priority: 2,
    apiKey: process.env.KIEAI_KEY || '',
  },
  video_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 3,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  video_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 4,
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },

  // ============ AUDIO PROVIDERS ============
  // AIMLAPI Deepgram ~$0.001 (1) → Replicate Bark ~$0.07 (2) → ElevenLabs ~$0.06 (3)
  audio_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  audio_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 2,
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },
  audio_elevenlabs: {
    name: 'elevenlabs',
    enabled: true,
    priority: 3,
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },
};
