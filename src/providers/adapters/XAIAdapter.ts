import { EnhancedProvider } from '../base/EnhancedProvider';
import { XAIProvider } from '../XAIProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { estimateTextCost } from '../base/costEstimator';

/**
 * Adapter for XAIProvider to implement EnhancedProvider interface
 */
export class XAIAdapter extends EnhancedProvider {
  readonly name = 'xai';
  private provider: XAIProvider;

  constructor(config: ProviderConfig) {
    super(config);
    this.provider = new XAIProvider(config.apiKey);
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateText(prompt, options);
      const time = Date.now() - start;
      const cost = estimateTextCost('xai', 'grok-beta', result);
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
    throw new Error('xAI does not support image generation');
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('xAI does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('xAI does not support audio generation');
  }
}
