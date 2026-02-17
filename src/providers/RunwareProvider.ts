import axios, { AxiosInstance } from 'axios';
import { EnhancedProvider } from './base/EnhancedProvider';
import { ProviderConfig } from './base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from './BaseProvider';
import { logger } from '../utils/logger';

/** Cost map for Runware models (USD per image at 1024×1024) */
const RUNWARE_COSTS: Record<string, number> = {
  'runware:100@1': 0.0006, // FLUX.1 Schnell
  'runware:101@1': 0.004,  // FLUX.1 Dev
};

/**
 * Runware AI Provider — Image generation only
 * API: POST https://api.runware.ai/v1 with JSON array body
 * Auth: Bearer token
 * Docs: https://runware.ai/docs
 *
 * Cheapest image provider: FLUX.1 Schnell at $0.0006/image
 * Synchronous response (no polling needed)
 */
export class RunwareProvider extends EnhancedProvider {
  readonly name = 'runware';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.runware.ai/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 60000, // 1 min (synchronous API)
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Runware does not support text generation — use OpenAI or Anthropic');
  }

  /**
   * Image generation via Runware imageInference
   * POST / with array body containing taskType: "imageInference"
   * Response: { data: [{ imageURL, cost, ... }] }
   */
  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'runware:100@1';
      const width = (options?.width as number) || 1024;
      const height = (options?.height as number) || 1024;

      logger.info(`Runware image: starting generation (model: ${model})`);

      const taskUUID = crypto.randomUUID();

      const response = await this.client.post('', [
        {
          taskUUID,
          taskType: 'imageInference',
          model,
          positivePrompt: prompt,
          width,
          height,
          numberResults: 1,
          outputType: 'URL',
          includeCost: true,
        },
      ]);

      const result = response.data?.data?.[0];
      if (!result?.imageURL) {
        throw new Error('Runware image: no imageURL in response');
      }

      const time = Date.now() - start;
      const cost = result.cost ?? RUNWARE_COSTS[model] ?? 0.004;
      this.updateStats(true, cost, time);

      logger.info(`Runware image: success (${time}ms, $${cost})`);
      return { imageUrl: result.imageURL };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Runware image: failed', error.response?.data || error.message);
      throw error;
    }
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('Runware does not support video generation — use PiAPI or KieAI');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Runware does not support audio generation — use OpenAI or ElevenLabs');
  }
}
