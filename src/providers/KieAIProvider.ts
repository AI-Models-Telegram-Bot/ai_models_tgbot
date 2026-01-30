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

/**
 * Kie.ai Provider
 * Supports: Image, Video generation
 */
export class KieAIProvider extends EnhancedProvider {
  readonly name = 'kieai';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.kie.ai/v1',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 300000, // 5 minutes default
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Kie.ai does not support text generation');
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      logger.info('KieAI image: starting generation');

      const response = await this.client.post('/images', {
        prompt,
        width: (options?.width as number) || 1024,
        height: (options?.height as number) || 1024,
      });

      const time = Date.now() - start;
      const cost = 0.003; // $0.003 per image
      this.updateStats(true, cost, time);

      logger.info(`KieAI image: success (${time}ms, $${cost})`);
      return { imageUrl: response.data.url };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI image: failed', error.message);
      throw error;
    }
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const duration = (options?.duration as number) || 5;
      logger.info(`KieAI video: starting generation (${duration}s)`);

      // Start video generation
      const response = await this.client.post('/videos', {
        prompt,
        duration,
      });

      const jobId = response.data.id;

      // Poll for completion (max 120 attempts x 5s = 10 minutes)
      let videoUrl = '';
      for (let i = 0; i < 120; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const status = await this.client.get(`/videos/${jobId}`);
        if (status.data.status === 'completed') {
          videoUrl = status.data.url;
          break;
        } else if (status.data.status === 'failed') {
          throw new Error('Video generation failed');
        }
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out');
      }

      const time = Date.now() - start;
      const cost = duration * 0.015; // $0.015 per second
      this.updateStats(true, cost, time);

      logger.info(`KieAI video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI video: failed', error.message);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Kie.ai does not support audio generation');
  }
}
