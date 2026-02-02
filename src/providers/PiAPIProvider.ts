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

const POLL_INTERVAL_MS = 3000;
const IMAGE_POLL_TIMEOUT_MS = 120000; // 2 minutes for images
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 minutes for video

/**
 * PiAPI Provider — Task-based async API
 * Supports: Image (Flux), Video (Kling)
 * Docs: https://piapi.ai/docs/unified-api-schema
 *
 * Flow: POST /api/v1/task -> get task_id -> poll GET /api/v1/task/{task_id}
 * Auth: X-API-Key header
 */
export class PiAPIProvider extends EnhancedProvider {
  readonly name = 'piapi';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: 'https://api.piapi.ai/api/v1',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 120000,
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('PiAPI text generation not supported — use AIMLAPI or OpenAI');
  }

  /**
   * Image generation via PiAPI Flux models
   * POST /api/v1/task with model "Qubico/flux1-schnell", task_type "txt2img"
   * Poll until completed, output: data.output.image_url
   */
  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'Qubico/flux1-schnell';
      logger.info(`PiAPI image: creating task with ${model}`);

      const createResponse = await this.client.post('/task', {
        model,
        task_type: 'txt2img',
        input: {
          prompt,
          width: (options?.width as number) || 1024,
          height: (options?.height as number) || 768,
        },
      });

      const taskId = createResponse.data?.data?.task_id;
      if (!taskId) {
        throw new Error('PiAPI image: no task_id in response');
      }

      logger.info(`PiAPI image: task created, task_id=${taskId}`);

      // Poll for completion
      const imageUrl = await this.pollImageResult(taskId);

      const time = Date.now() - start;
      const cost = model.includes('schnell') ? 0.0015 : 0.02;
      this.updateStats(true, cost, time);

      logger.info(`PiAPI image: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('PiAPI image: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video generation via PiAPI Kling
   * POST /api/v1/task with model "kling", task_type "video_generation"
   * Poll until completed, output: data.output.works[0].video.resource_without_watermark
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'kling';
      logger.info(`PiAPI video: creating task with ${model}`);

      const createResponse = await this.client.post('/task', {
        model,
        task_type: 'video_generation',
        input: {
          prompt,
          duration: (options?.duration as number) || 5,
        },
      });

      const taskId = createResponse.data?.data?.task_id;
      if (!taskId) {
        throw new Error('PiAPI video: no task_id in response');
      }

      logger.info(`PiAPI video: task created, task_id=${taskId}`);

      const videoUrl = await this.pollVideoResult(taskId);

      const time = Date.now() - start;
      const cost = 0.13; // PiAPI Kling ~$0.13 per 5s video
      this.updateStats(true, cost, time);

      logger.info(`PiAPI video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('PiAPI video: failed', error.response?.data || error.message);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('PiAPI audio generation not supported — use AIMLAPI or ElevenLabs');
  }

  private async pollImageResult(taskId: string): Promise<string> {
    const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get(`/task/${taskId}`);
      const data = response.data?.data;
      const status = data?.status;

      logger.debug(`PiAPI image poll: status=${status}, task_id=${taskId}`);

      if (status === 'Completed' || status === 'completed') {
        const imageUrl = data?.output?.image_url || data?.output?.image_urls?.[0];
        if (!imageUrl) {
          throw new Error('PiAPI image: completed but no image URL in output');
        }
        return imageUrl;
      }

      if (status === 'Failed' || status === 'failed') {
        const errorMsg = data?.error?.message || 'Unknown error';
        throw new Error(`PiAPI image task failed: ${errorMsg}`);
      }
    }

    throw new Error('PiAPI image: polling timed out after 2 minutes');
  }

  private async pollVideoResult(taskId: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get(`/task/${taskId}`);
      const data = response.data?.data;
      const status = data?.status;

      logger.debug(`PiAPI video poll: status=${status}, task_id=${taskId}`);

      if (status === 'Completed' || status === 'completed') {
        // Kling output: works[0].video.resource_without_watermark or resource
        const works = data?.output?.works;
        const videoUrl =
          works?.[0]?.video?.resource_without_watermark ||
          works?.[0]?.video?.resource ||
          data?.output?.video_url;
        if (!videoUrl) {
          throw new Error('PiAPI video: completed but no video URL in output');
        }
        return videoUrl;
      }

      if (status === 'Failed' || status === 'failed') {
        const errorMsg = data?.error?.message || 'Unknown error';
        throw new Error(`PiAPI video task failed: ${errorMsg}`);
      }
    }

    throw new Error('PiAPI video: polling timed out after 10 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
