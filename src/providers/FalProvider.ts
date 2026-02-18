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

const POLL_INTERVAL_MS = 5000;
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 minutes

/**
 * Fal.ai Provider — Queue-based async API
 * Supports: Video (Seedance, Wan, Luma, Kling), Image (Flux)
 *
 * Queue flow:
 *   POST https://queue.fal.run/{model} → { request_id }
 *   GET  https://queue.fal.run/{model}/requests/{request_id}/status → { status }
 *   GET  https://queue.fal.run/{model}/requests/{request_id} → result
 *
 * Auth: Authorization: Key {apiKey}
 */
export class FalProvider extends EnhancedProvider {
  readonly name = 'fal';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      headers: {
        Authorization: `Key ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000,
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Fal.ai text generation not supported');
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    throw new Error('Fal.ai image generation not yet implemented');
  }

  /**
   * Video generation via fal.ai queue API
   * Submits to queue, polls for completion, returns video URL
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const model = (options?.model as string) || 'fal-ai/bytedance/seedance/v1.5/pro/text-to-video';
    const start = Date.now();

    try {
      logger.info(`Fal.ai video: starting generation (${model})`);

      const input: Record<string, unknown> = {
        prompt,
        aspect_ratio: (options?.aspectRatio as string) || '16:9',
        resolution: (options?.resolution as string) || '720p',
        enable_safety_checker: true,
      };

      // Duration handling
      if (options?.duration !== undefined) {
        input.duration = String(options.duration);
      }

      // Submit to queue
      const submitResponse = await this.client.post(
        `https://queue.fal.run/${model}`,
        input
      );

      const requestId = submitResponse.data?.request_id;
      if (!requestId) {
        throw new Error(`Fal.ai video: no request_id in response: ${JSON.stringify(submitResponse.data).slice(0, 300)}`);
      }

      logger.info(`Fal.ai video: queued, request_id=${requestId}`);

      // Poll for completion
      const videoUrl = await this.pollQueueResult(model, requestId);

      const time = Date.now() - start;
      const cost = 0.26; // ~$0.26 for seedance
      this.updateStats(true, cost, time);

      logger.info(`Fal.ai video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Fal.ai video: failed', error.response?.data || error.message);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Fal.ai audio generation not supported');
  }

  /**
   * Poll fal.ai queue for result
   * GET /requests/{request_id}/status → { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" }
   * GET /requests/{request_id} → full result with video URL
   */
  private async pollQueueResult(model: string, requestId: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      try {
        const statusResponse = await this.client.get(
          `https://queue.fal.run/${model}/requests/${requestId}/status`
        );

        const status = statusResponse.data?.status;
        logger.debug(`Fal.ai video poll: status=${status}, requestId=${requestId}`);

        if (status === 'COMPLETED') {
          // Fetch the full result
          const resultResponse = await this.client.get(
            `https://queue.fal.run/${model}/requests/${requestId}`
          );

          const data = resultResponse.data;
          const videoUrl = data?.video?.url;
          if (!videoUrl) {
            throw new Error(`Fal.ai video: completed but no video URL: ${JSON.stringify(data).slice(0, 300)}`);
          }
          return videoUrl;
        }

        if (status === 'FAILED') {
          const error = statusResponse.data?.error || 'Unknown error';
          throw new Error(`Fal.ai video task failed: ${error}`);
        }
      } catch (error: any) {
        // Re-throw if it's our own error (not a network/polling error)
        if (error.message?.includes('Fal.ai video')) {
          throw error;
        }
        logger.warn(`Fal.ai video poll error (will retry): ${error.message}`);
      }
    }

    throw new Error('Fal.ai video: polling timed out after 10 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
