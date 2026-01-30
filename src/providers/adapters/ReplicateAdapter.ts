import { EnhancedProvider } from '../base/EnhancedProvider';
import { ReplicateProvider } from '../ReplicateProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { estimateImageCost, estimateVideoCost, estimateAudioCost } from '../base/costEstimator';

/**
 * Adapter for ReplicateProvider to implement EnhancedProvider interface
 */
export class ReplicateAdapter extends EnhancedProvider {
  readonly name = 'replicate';
  private provider: ReplicateProvider;

  constructor(config: ProviderConfig) {
    super(config);
    this.provider = new ReplicateProvider(config.apiKey);
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Use OpenAI or Anthropic for text generation');
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateImage(prompt, options);
      const time = Date.now() - start;
      const model = (options?.model as string) || 'flux-schnell';
      const cost = estimateImageCost(model);
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
    const start = Date.now();
    try {
      const result = await this.provider.generateVideo(prompt, options);
      const time = Date.now() - start;
      const model = (options?.model as string) || 'kling';
      const cost = estimateVideoCost(model, 5);
      this.updateStats(true, cost, time);
      return result;
    } catch (error) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateAudio(text, options);
      const time = Date.now() - start;
      const model = (options?.model as string) || 'suno';
      const cost = estimateAudioCost(model, text);
      this.updateStats(true, cost, time);
      return result;
    } catch (error) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      throw error;
    }
  }
}
