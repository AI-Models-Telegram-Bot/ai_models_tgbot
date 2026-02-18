import { ProviderManager } from '../services/ProviderManager';
import { PROVIDER_CONFIGS } from './providers.config';

// Import adapters for existing providers
import { OpenAIAdapter } from '../providers/adapters/OpenAIAdapter';
import { AnthropicAdapter } from '../providers/adapters/AnthropicAdapter';
import { XAIAdapter } from '../providers/adapters/XAIAdapter';
import { ReplicateAdapter } from '../providers/adapters/ReplicateAdapter';
import { ElevenLabsAdapter } from '../providers/adapters/ElevenLabsAdapter';

// Import direct providers
import { KieAIProvider } from '../providers/KieAIProvider';
import { PiAPIProvider } from '../providers/PiAPIProvider';
import { RunwareProvider } from '../providers/RunwareProvider';
import { FalProvider } from '../providers/FalProvider';

import { logger } from '../utils/logger';

let manager: ProviderManager | null = null;

/**
 * Initialize ProviderManager with all configured providers
 * Providers without API keys are automatically skipped.
 * If a provider fails at runtime, the next one in priority order is tried.
 */
export function initProviders(): ProviderManager {
  if (manager) return manager;

  manager = new ProviderManager();

  // ============ TEXT PROVIDERS ============
  // OpenAI (1) → Anthropic (2) → XAI (3)
  if (PROVIDER_CONFIGS.text_openai.apiKey) {
    manager.register('TEXT', new OpenAIAdapter(PROVIDER_CONFIGS.text_openai));
  }
  if (PROVIDER_CONFIGS.text_anthropic.apiKey) {
    manager.register('TEXT', new AnthropicAdapter(PROVIDER_CONFIGS.text_anthropic));
  }
  if (PROVIDER_CONFIGS.text_xai.apiKey) {
    manager.register('TEXT', new XAIAdapter(PROVIDER_CONFIGS.text_xai));
  }

  // ============ IMAGE PROVIDERS ============
  // Runware (1) → PiAPI (2) → Replicate (3) → KieAI (4) → OpenAI (5)
  if (PROVIDER_CONFIGS.image_runware.apiKey) {
    manager.register('IMAGE', new RunwareProvider(PROVIDER_CONFIGS.image_runware));
  }
  if (PROVIDER_CONFIGS.image_piapi.apiKey) {
    manager.register('IMAGE', new PiAPIProvider(PROVIDER_CONFIGS.image_piapi));
  }
  if (PROVIDER_CONFIGS.image_replicate.apiKey) {
    manager.register('IMAGE', new ReplicateAdapter(PROVIDER_CONFIGS.image_replicate));
  }
  if (PROVIDER_CONFIGS.image_kieai.apiKey) {
    manager.register('IMAGE', new KieAIProvider(PROVIDER_CONFIGS.image_kieai));
  }
  if (PROVIDER_CONFIGS.image_openai.apiKey) {
    manager.register('IMAGE', new OpenAIAdapter(PROVIDER_CONFIGS.image_openai));
  }

  // ============ VIDEO PROVIDERS ============
  // KieAI (1) → PiAPI (2) → Fal.ai (3) → Replicate (4)
  if (PROVIDER_CONFIGS.video_kieai.apiKey) {
    manager.register('VIDEO', new KieAIProvider(PROVIDER_CONFIGS.video_kieai));
  }
  if (PROVIDER_CONFIGS.video_piapi.apiKey) {
    manager.register('VIDEO', new PiAPIProvider(PROVIDER_CONFIGS.video_piapi));
  }
  if (PROVIDER_CONFIGS.video_fal.apiKey) {
    manager.register('VIDEO', new FalProvider(PROVIDER_CONFIGS.video_fal));
  }
  if (PROVIDER_CONFIGS.video_replicate.apiKey) {
    manager.register('VIDEO', new ReplicateAdapter(PROVIDER_CONFIGS.video_replicate));
  }

  // ============ AUDIO PROVIDERS ============
  // OpenAI TTS (1) → ElevenLabs (2) → Replicate (3)
  if (PROVIDER_CONFIGS.audio_openai.apiKey) {
    manager.register('AUDIO', new OpenAIAdapter(PROVIDER_CONFIGS.audio_openai));
  }
  if (PROVIDER_CONFIGS.audio_elevenlabs.apiKey) {
    manager.register('AUDIO', new ElevenLabsAdapter(PROVIDER_CONFIGS.audio_elevenlabs));
  }
  if (PROVIDER_CONFIGS.audio_replicate.apiKey) {
    manager.register('AUDIO', new ReplicateAdapter(PROVIDER_CONFIGS.audio_replicate));
  }

  logger.info('ProviderManager initialized with all configured providers');
  return manager;
}

/**
 * Get the ProviderManager instance
 * Initializes if not already initialized
 */
export function getProviderManager(): ProviderManager {
  return manager || initProviders();
}
