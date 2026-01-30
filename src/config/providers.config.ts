import { ProviderConfig } from '../providers/base/ProviderConfig';

/**
 * Provider configurations for all categories
 * Priority: 1=primary, 2=secondary, 3=tertiary, etc.
 * Lower numbers are tried first. If a provider fails, the next one is tried automatically.
 * Providers without API keys are skipped during registration.
 */
export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // ============ TEXT PROVIDERS ============
  // AI/ML API (primary) → PiAPI → OpenRouter → OpenAI (existing)
  text_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  text_piapi: {
    name: 'piapi',
    enabled: false, // Disabled - API endpoint not verified
    priority: 2,
    apiKey: process.env.PIAPI_KEY || '',
  },
  text_openrouter: {
    name: 'openrouter',
    enabled: true,
    priority: 3,
    apiKey: process.env.OPENROUTER_KEY || '',
  },
  text_openai: {
    name: 'openai',
    enabled: true,
    priority: 4,
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  text_anthropic: {
    name: 'anthropic',
    enabled: true,
    priority: 5,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  text_xai: {
    name: 'xai',
    enabled: true,
    priority: 6,
    apiKey: process.env.XAI_API_KEY || '',
  },

  // ============ IMAGE PROVIDERS ============
  // Runware (primary) → Kie.ai → Replicate (existing)
  image_runware: {
    name: 'runware',
    enabled: false, // Disabled - requires WebSocket API, not REST
    priority: 1,
    apiKey: process.env.RUNWARE_KEY || '',
  },
  image_kieai: {
    name: 'kieai',
    enabled: false, // Disabled - API endpoint not verified
    priority: 2,
    apiKey: process.env.KIEAI_KEY || '',
  },
  image_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },
  image_openai: {
    name: 'openai',
    enabled: true,
    priority: 4,
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // ============ VIDEO PROVIDERS ============
  // Kie.ai (primary) → Runware → Replicate/Kling (existing)
  video_kieai: {
    name: 'kieai',
    enabled: false, // Disabled - API endpoint not verified
    priority: 1,
    apiKey: process.env.KIEAI_KEY || '',
  },
  video_runware: {
    name: 'runware',
    enabled: false, // Disabled - requires WebSocket API, not REST
    priority: 2,
    apiKey: process.env.RUNWARE_KEY || '',
  },
  video_replicate: {
    name: 'replicate',
    enabled: true,
    priority: 3,
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },

  // ============ AUDIO PROVIDERS ============
  // AI/ML API (primary) → Runware → ElevenLabs (existing)
  audio_aimlapi: {
    name: 'aimlapi',
    enabled: true,
    priority: 1,
    apiKey: process.env.AIMLAPI_KEY || '',
  },
  audio_runware: {
    name: 'runware',
    enabled: false, // Disabled - requires WebSocket API, not REST
    priority: 2,
    apiKey: process.env.RUNWARE_KEY || '',
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
    apiKey: process.env.REPLICATE_API_TOKEN || '',
  },
};
