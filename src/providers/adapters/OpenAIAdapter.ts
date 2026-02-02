import { EnhancedProvider } from '../base/EnhancedProvider';
import { OpenAIProvider } from '../OpenAIProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { estimateTextCost, estimateImageCost } from '../base/costEstimator';

/**
 * Adapter for OpenAIProvider to implement EnhancedProvider interface
 * Wraps the existing provider with stats tracking and configuration
 */
export class OpenAIAdapter extends EnhancedProvider {
  readonly name = 'openai';
  private provider: OpenAIProvider;

  constructor(config: ProviderConfig) {
    super(config);
    this.provider = new OpenAIProvider(config.apiKey);
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateText(prompt, options);
      const time = Date.now() - start;
      const model = (options?.model as string) || 'gpt-4o-mini';
      const cost = estimateTextCost('openai', model, result);
      this.updateStats(true, cost, time);
      return result;
    } catch (error) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      throw error;
    }
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateImage(prompt, options);
      const time = Date.now() - start;
      const cost = estimateImageCost('dall-e-3');
      this.updateStats(true, cost, time);
      return result;
    } catch (error) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      throw error;
    }
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('OpenAI does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('OpenAI does not support audio generation');
  }
}
