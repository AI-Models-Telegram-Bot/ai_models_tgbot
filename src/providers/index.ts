import { AIModel } from '@prisma/client';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { XAIProvider } from './XAIProvider';
import { ReplicateProvider } from './ReplicateProvider';
import { ElevenLabsProvider } from './ElevenLabsProvider';
import { GenerationResult } from './BaseProvider';
import { getNextKey, ProviderName } from '../config/keyPool';
import { logger } from '../utils/logger';

export * from './BaseProvider';
export { OpenAIProvider } from './OpenAIProvider';
export { AnthropicProvider } from './AnthropicProvider';
export { XAIProvider } from './XAIProvider';
export { ReplicateProvider } from './ReplicateProvider';
export { ElevenLabsProvider } from './ElevenLabsProvider';

/** Get an API key from the pool for the given provider */
async function getPooledKey(provider: string): Promise<string> {
  try {
    return await getNextKey(provider as ProviderName);
  } catch (error) {
    logger.warn(`Key pool unavailable for ${provider}, using default`, { error });
    return ''; // Will fall back to config default in provider constructor
  }
}

export async function executeModel(model: AIModel, input: string): Promise<GenerationResult> {
  const { provider, slug, category } = model;

  switch (category) {
    case 'TEXT':
      return executeTextModel(provider, slug, input);
    case 'IMAGE':
      return executeImageModel(provider, slug, input);
    case 'VIDEO':
      return executeVideoModel(provider, slug, input);
    case 'AUDIO':
      return executeAudioModel(provider, slug, input);
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

async function executeTextModel(provider: string, slug: string, prompt: string): Promise<GenerationResult> {
  const key = await getPooledKey(provider);

  switch (provider) {
    case 'openai': {
      const p = new OpenAIProvider(key || undefined);
      return p.generateText(prompt, { model: slug === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o' });
    }
    case 'anthropic': {
      const p = new AnthropicProvider(key || undefined);
      return p.generateText(prompt);
    }
    case 'xai': {
      const p = new XAIProvider(key || undefined);
      return p.generateText(prompt);
    }
    default:
      throw new Error(`Unknown text provider: ${provider}`);
  }
}

async function executeImageModel(provider: string, slug: string, prompt: string): Promise<GenerationResult> {
  const key = await getPooledKey(provider);

  switch (provider) {
    case 'openai': {
      const p = new OpenAIProvider(key || undefined);
      return p.generateImage(prompt);
    }
    case 'replicate': {
      const p = new ReplicateProvider(key || undefined);
      return p.generateImage(prompt, { model: slug });
    }
    default:
      throw new Error(`Unknown image provider: ${provider}`);
  }
}

async function executeVideoModel(provider: string, slug: string, prompt: string): Promise<GenerationResult> {
  const key = await getPooledKey(provider);

  switch (provider) {
    case 'replicate': {
      const p = new ReplicateProvider(key || undefined);
      return p.generateVideo(prompt, { model: slug });
    }
    default:
      throw new Error(`Unknown video provider: ${provider}`);
  }
}

async function executeAudioModel(provider: string, slug: string, text: string): Promise<GenerationResult> {
  const key = await getPooledKey(provider);

  switch (provider) {
    case 'elevenlabs': {
      const p = new ElevenLabsProvider(key || undefined);
      return p.generateAudio(text);
    }
    case 'replicate': {
      const p = new ReplicateProvider(key || undefined);
      return p.generateAudio(text, { model: slug });
    }
    default:
      throw new Error(`Unknown audio provider: ${provider}`);
  }
}
