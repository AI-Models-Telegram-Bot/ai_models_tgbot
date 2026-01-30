import { EnhancedProvider } from '../base/EnhancedProvider';
import { ElevenLabsProvider } from '../ElevenLabsProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { estimateAudioCost } from '../base/costEstimator';

/**
 * Adapter for ElevenLabsProvider to implement EnhancedProvider interface
 */
export class ElevenLabsAdapter extends EnhancedProvider {
  readonly name = 'elevenlabs';
  private provider: ElevenLabsProvider;

  constructor(config: ProviderConfig) {
    super(config);
    this.provider = new ElevenLabsProvider(config.apiKey);
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('ElevenLabs does not support text generation');
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    throw new Error('ElevenLabs does not support image generation');
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('ElevenLabs does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const start = Date.now();
    try {
      const result = await this.provider.generateAudio(text, options);
      const time = Date.now() - start;
      const cost = estimateAudioCost('elevenlabs', text);
      this.updateStats(true, cost, time);
      return result;
    } catch (error) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      throw error;
    }
  }
}
