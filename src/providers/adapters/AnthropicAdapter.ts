import { EnhancedProvider } from '../base/EnhancedProvider';
import { AnthropicProvider } from '../AnthropicProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { estimateTextCost } from '../base/costEstimator';

/**
 * Adapter for AnthropicProvider to implement EnhancedProvider interface
 */
export class AnthropicAdapter extends EnhancedProvider {
  readonly name = 'anthropic';
  private provider: AnthropicProvider;

  constructor(config: ProviderConfig) {
    super(config);
    this.provider = new AnthropicProvider(config.apiKey);
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateText(prompt, options);
      const time = Date.now() - start;
      const cost = estimateTextCost('anthropic', 'claude-3-haiku-20240307', result);
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
    throw new Error('Anthropic does not support image generation');
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('Anthropic does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Anthropic does not support audio generation');
  }
}
