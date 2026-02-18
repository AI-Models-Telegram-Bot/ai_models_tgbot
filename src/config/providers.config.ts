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
 *   Groq Llama 3.3 70B  ~$0.00069  |  Together Llama 3.3 70B  ~$0.00088
 *   Google Gemini Flash  ~$0.00038  |  OpenAI gpt-4o-mini      ~$0.00075
 *   XAI grok-3-mini      ~$0.00080  |  Anthropic haiku-3        ~$0.0015
 *   OpenRouter (fallback) — pass-through pricing
 *
 * IMAGE (per image):
 *   Runware FLUX Schnell $0.0006  |  PiAPI Flux Schnell    $0.002
 *   Fal.ai Flux Schnell  $0.003  |  Replicate Flux        $0.003
 *   KieAI Kontext        ~$0.01  |  OpenAI DALL-E 3       $0.04
 *
 * VIDEO (per 5s clip):
 *   Kie.ai Seedance  ~$0.20  |  PiAPI Kling Std   $0.26
 *   Fal.ai Wan 2.5   ~$0.25  |  Kie.ai Veo Fast   ~$0.40
 *   Replicate Kling  ~$1.40
 *
 * AUDIO (per ~200 chars):
 *   Groq Whisper    ~$0.003  |  OpenAI TTS   ~$0.003
 *   ElevenLabs      ~$0.06   |  Replicate     ~$0.07
 */

// Support both naming conventions across environments (.env.staging vs .env.production)
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY_1 || '';
const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_KEY_1 || '';

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // ============ TEXT PROVIDERS ============
  // Groq (1) → Together (2) → Google (3) → OpenAI (4) → XAI (5) → Anthropic (6) → OpenRouter (7)
  text_groq: {
    name: 'groq',
    enabled: true,
    priority: 1,
    apiKey: process.env.GROQ_API_KEY || '',
  },
  text_together: {
    name: 'together',
    enabled: true,
    priority: 2,
    apiKey: process.env.TOGETHER_API_KEY || '',
  },
  text_google: {
    name: 'google',
    enabled: true,
    priority: 3,
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
  },
  text_openai: {
    name: 'openai',
    enabled: true,
    priority: 4,
    apiKey: OPENAI_KEY,
  },
  text_xai: {
    name: 'xai',
    enabled: true,
    priority: 5,
    apiKey: process.env.XAI_API_KEY || '',
  },
  text_anthropic: {
    name: 'anthropic',
    enabled: true,
    priority: 6,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  text_openrouter: {
    name: 'openrouter',
    enabled: true,
    priority: 7,
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },

  // ============ IMAGE PROVIDERS ============
  // Runware $0.0006 (1) → PiAPI $0.002 (2) → Fal.ai $0.003 (3)
  // → Replicate $0.003 (4) → KieAI ~$0.01 (5) → OpenAI DALL-E $0.04 (6)
  image_runware: {
    name: 'runware',
    enabled: true,
    priority: 1,
    apiKey: process.env.RUNWARE_KEY || process.env.RUNWARE_API_KEY || '',
  },
  image_piapi: {
    name: 'piapi',
    enabled: true,
    priority: 2,
    apiKey: process.env.PIAPI_KEY || process.env.PIAPI_API_KEY || '',
  },
  image_fal: {
    name: 'fal',
    enabled: true,
    priority: 3,
    apiKey: process.env.FAL_API_KEY || '',
  },
  image_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 4,
    apiKey: REPLICATE_KEY,
  },
  image_kieai: {
    name: 'kieai',
    enabled: true,
    priority: 5,
    apiKey: process.env.KIEAI_KEY || process.env.KIEAI_API_KEY || '',
  },
  image_openai: {
    name: 'openai',
    enabled: true,
    priority: 6,
    apiKey: OPENAI_KEY,
  },

  // ============ VIDEO PROVIDERS ============
  // KieAI $0.20+ (1) → PiAPI $0.26+ (2) → Fal.ai $0.25+ (3) → Replicate $1.40 (4)
  video_kieai: {
    name: 'kieai',
    enabled: true,
    priority: 1,
    apiKey: process.env.KIEAI_KEY || process.env.KIEAI_API_KEY || '',
  },
  video_piapi: {
    name: 'piapi',
    enabled: true,
    priority: 2,
    apiKey: process.env.PIAPI_KEY || process.env.PIAPI_API_KEY || '',
  },
  video_fal: {
    name: 'fal',
    enabled: true,
    priority: 3,
    apiKey: process.env.FAL_API_KEY || '',
  },
  video_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 4,
    apiKey: REPLICATE_KEY,
  },

  // ============ AUDIO PROVIDERS ============
  // Groq (1) → OpenAI TTS (2) → ElevenLabs (3) → Replicate (4)
  audio_groq: {
    name: 'groq',
    enabled: true,
    priority: 1,
    apiKey: process.env.GROQ_API_KEY || '',
  },
  audio_openai: {
    name: 'openai',
    enabled: true,
    priority: 2,
    apiKey: OPENAI_KEY,
  },
  audio_elevenlabs: {
    name: 'elevenlabs',
    enabled: true,
    priority: 3,
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },
  audio_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 4,
    apiKey: REPLICATE_KEY,
  },
};
