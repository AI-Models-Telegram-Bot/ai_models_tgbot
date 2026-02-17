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
 *   OpenAI gpt-4o-mini  ~$0.00075  |  XAI grok-3-mini  ~$0.00080
 *   Anthropic haiku-3    ~$0.0015
 *
 * IMAGE (per image):
 *   Runware FLUX Schnell $0.0006  |  PiAPI Flux Schnell   $0.0015
 *   Replicate Flux       $0.003   |  KieAI Kontext        ~$0.01
 *   OpenAI DALL-E 3      $0.04
 *
 * VIDEO (per 5s clip):
 *   PiAPI Kling   $0.13  |  KieAI Kling 2.6  $0.28
 *   Replicate Kling      $1.40
 *
 * AUDIO (per ~200 chars):
 *   OpenAI TTS   ~$0.003  |  ElevenLabs  ~$0.06
 *   Replicate Bark ~$0.07
 */
// Support both naming conventions across environments (.env.staging vs .env.production)
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY_1 || '';
const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_KEY_1 || '';

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // ============ TEXT PROVIDERS ============
  // OpenAI (1) → XAI (2) → Anthropic (3)
  text_openai: {
    name: 'openai',
    enabled: true,
    priority: 1,
    apiKey: OPENAI_KEY,
  },
  text_xai: {
    name: 'xai',
    enabled: true,
    priority: 2,
    apiKey: process.env.XAI_API_KEY || '',
  },
  text_anthropic: {
    name: 'anthropic',
    enabled: true,
    priority: 3,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  // ============ IMAGE PROVIDERS ============
  // Runware $0.0006 (1) → PiAPI $0.0015 (2) → Replicate $0.003 (3)
  // → KieAI ~$0.01 (4) → OpenAI DALL-E $0.04 (5)
  image_runware: {
    name: 'runware',
    enabled: true,
    priority: 1,
    apiKey: process.env.RUNWARE_KEY || '',
  },
  image_piapi: {
    name: 'piapi',
    enabled: true,
    priority: 2,
    apiKey: process.env.PIAPI_KEY || '',
  },
  image_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: REPLICATE_KEY,
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
    apiKey: OPENAI_KEY,
  },

  // ============ VIDEO PROVIDERS ============
  // PiAPI Kling $0.13 (1) → KieAI Kling $0.28 (2) → Replicate $1.40 (3)
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
  video_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: REPLICATE_KEY,
  },

  // ============ AUDIO PROVIDERS ============
  // OpenAI TTS ~$0.003 (1) → ElevenLabs ~$0.06 (2) → Replicate ~$0.07 (3)
  audio_openai: {
    name: 'openai',
    enabled: true,
    priority: 1,
    apiKey: OPENAI_KEY,
  },
  audio_elevenlabs: {
    name: 'elevenlabs',
    enabled: true,
    priority: 2,
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },
  audio_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: REPLICATE_KEY,
  },
};
