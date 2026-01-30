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
 * Runware AI Provider
 * Supports: Image, Video, Audio generation
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
      timeout: config.timeout || 180000, // 3 minutes default
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Runware does not support text generation');
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      logger.info('Runware image: starting generation');

      const response = await this.client.post('/image', {
        prompt,
        model: options?.model || 'runware:100@1',
        width: (options?.width as number) || 1024,
        height: (options?.height as number) || 1024,
      });

      const time = Date.now() - start;
      const cost = 0.004; // $0.004 per image
      this.updateStats(true, cost, time);

      logger.info(`Runware image: success (${time}ms, $${cost})`);
      return { imageUrl: response.data.imageURL };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Runware image: failed', error.message);
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
      logger.info(`Runware video: starting generation (${duration}s)`);

      // Start video generation
      const response = await this.client.post('/video', {
        prompt,
        duration,
      });

      const jobId = response.data.id;

      // Poll for completion (max 60 attempts x 5s = 5 minutes)
      let videoUrl = '';
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const status = await this.client.get(`/video/${jobId}`);
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
      const cost = duration * 0.02; // $0.02 per second
      this.updateStats(true, cost, time);

      logger.info(`Runware video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Runware video: failed', error.message);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const start = Date.now();
    try {
      logger.info('Runware audio: starting generation');

      const response = await this.client.post('/audio', {
        text,
        voice: (options?.voice as string) || 'en-US-1',
      });

      const time = Date.now() - start;
      const cost = text.length * 0.000015; // $0.000015 per character
      this.updateStats(true, cost, time);

      logger.info(`Runware audio: success (${time}ms, $${cost})`);
      return { audioUrl: response.data.url };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Runware audio: failed', error.message);
      throw error;
    }
  }
}
