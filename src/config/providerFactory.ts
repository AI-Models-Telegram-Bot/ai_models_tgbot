import { ProviderManager } from '../services/ProviderManager';
import { PROVIDER_CONFIGS } from './providers.config';

// Import adapters for existing providers
import { OpenAIAdapter } from '../providers/adapters/OpenAIAdapter';
import { AnthropicAdapter } from '../providers/adapters/AnthropicAdapter';
import { XAIAdapter } from '../providers/adapters/XAIAdapter';
import { ReplicateAdapter } from '../providers/adapters/ReplicateAdapter';
import { ElevenLabsAdapter } from '../providers/adapters/ElevenLabsAdapter';

// Import new providers
import { RunwareProvider } from '../providers/RunwareProvider';
import { AIMLAPIProvider } from '../providers/AIMLAPIProvider';
import { KieAIProvider } from '../providers/KieAIProvider';
import { PiAPIProvider } from '../providers/PiAPIProvider';
import { OpenRouterProvider } from '../providers/OpenRouterProvider';

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
  // AIMLAPI (1) → PiAPI (2) → OpenRouter (3) → OpenAI (4) → Anthropic (5) → XAI (6)
  if (PROVIDER_CONFIGS.text_aimlapi.apiKey) {
    manager.register('TEXT', new AIMLAPIProvider(PROVIDER_CONFIGS.text_aimlapi));
  }
  if (PROVIDER_CONFIGS.text_piapi.apiKey) {
    manager.register('TEXT', new PiAPIProvider(PROVIDER_CONFIGS.text_piapi));
  }
  if (PROVIDER_CONFIGS.text_openrouter.apiKey) {
    manager.register('TEXT', new OpenRouterProvider(PROVIDER_CONFIGS.text_openrouter));
  }
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
  // Runware (1) → Kie.ai (2) → Replicate (3) → OpenAI (4)
  if (PROVIDER_CONFIGS.image_runware.apiKey) {
    manager.register('IMAGE', new RunwareProvider(PROVIDER_CONFIGS.image_runware));
  }
  if (PROVIDER_CONFIGS.image_kieai.apiKey) {
    manager.register('IMAGE', new KieAIProvider(PROVIDER_CONFIGS.image_kieai));
  }
  if (PROVIDER_CONFIGS.image_replicate.apiKey) {
    manager.register('IMAGE', new ReplicateAdapter(PROVIDER_CONFIGS.image_replicate));
  }
  if (PROVIDER_CONFIGS.image_openai.apiKey) {
    manager.register('IMAGE', new OpenAIAdapter(PROVIDER_CONFIGS.image_openai));
  }

  // ============ VIDEO PROVIDERS ============
  // Kie.ai (1) → Runware (2) → Replicate (3)
  if (PROVIDER_CONFIGS.video_kieai.apiKey) {
    manager.register('VIDEO', new KieAIProvider(PROVIDER_CONFIGS.video_kieai));
  }
  if (PROVIDER_CONFIGS.video_runware.apiKey) {
    manager.register('VIDEO', new RunwareProvider(PROVIDER_CONFIGS.video_runware));
  }
  if (PROVIDER_CONFIGS.video_replicate.apiKey) {
    manager.register('VIDEO', new ReplicateAdapter(PROVIDER_CONFIGS.video_replicate));
  }

  // ============ AUDIO PROVIDERS ============
  // AIMLAPI (1) → Runware (2) → ElevenLabs (3) → Replicate (4)
  if (PROVIDER_CONFIGS.audio_aimlapi.apiKey) {
    manager.register('AUDIO', new AIMLAPIProvider(PROVIDER_CONFIGS.audio_aimlapi));
  }
  if (PROVIDER_CONFIGS.audio_runware.apiKey) {
    manager.register('AUDIO', new RunwareProvider(PROVIDER_CONFIGS.audio_runware));
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
