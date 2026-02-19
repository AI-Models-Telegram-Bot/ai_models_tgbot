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
const VIDEO_POLL_TIMEOUT_MS = 300000; // 5 minutes (leaves room for fallback providers)

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
  /**
   * Switch model ID from text-to-video to image-to-video variant when images are provided.
   */
  private getImageToVideoModel(textModel: string): string {
    const modelMap: Record<string, string> = {
      'fal-ai/bytedance/seedance/v1.5/pro/text-to-video': 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video',
      'fal-ai/kling-video/v2.5/standard': 'fal-ai/kling-video/v2.5/standard/image-to-video',
      'fal-ai/kling-video/v2.5/pro': 'fal-ai/kling-video/v2.5/pro/image-to-video',
      'fal-ai/wan/v2.5/text-to-video': 'fal-ai/wan/v2.5/image-to-video',
    };
    return modelMap[textModel] || textModel;
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    let model = (options?.model as string) || 'fal-ai/bytedance/seedance/v1.5/pro/text-to-video';
    const inputImageUrls = options?.inputImageUrls as string[] | undefined;
    const hasImages = inputImageUrls && inputImageUrls.length > 0;
    const start = Date.now();

    // Switch to image-to-video model variant if images are provided
    if (hasImages) {
      model = this.getImageToVideoModel(model);
    }

    try {
      logger.info(`Fal.ai video: starting generation (${model}, images: ${hasImages ? inputImageUrls.length : 0})`);

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

      // Add image URL for image-to-video
      if (hasImages) {
        input.image_url = inputImageUrls[0];
      }

      // Submit to queue
      logger.info('Fal.ai video payload:', { model, aspect_ratio: input.aspect_ratio, resolution: input.resolution, duration: input.duration, hasImage: !!input.image_url });
      const submitResponse = await this.client.post(
        `https://queue.fal.run/${model}`,
        input
      );

      const requestId = submitResponse.data?.request_id;
      if (!requestId) {
        throw new Error(`Fal.ai video: no request_id in response: ${JSON.stringify(submitResponse.data).slice(0, 300)}`);
      }

      // Use URLs returned by fal — model aliases (e.g. veo3/fast → veo3) change the base path
      const statusUrl = submitResponse.data?.status_url
        || `https://queue.fal.run/${model}/requests/${requestId}/status`;
      const responseUrl = submitResponse.data?.response_url
        || `https://queue.fal.run/${model}/requests/${requestId}`;

      logger.info(`Fal.ai video: queued, request_id=${requestId}`);

      // Poll for completion
      const videoUrl = await this.pollQueueResult(statusUrl, responseUrl);

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
   * Poll fal.ai queue for result using URLs returned by submission
   * GET {statusUrl} → { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" }
   * GET {responseUrl} → full result with video URL
   */
  private async pollQueueResult(statusUrl: string, responseUrl: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      try {
        const statusResponse = await this.client.get(statusUrl);

        const status = statusResponse.data?.status;
        logger.debug(`Fal.ai video poll: status=${status}`);

        if (status === 'COMPLETED') {
          // Fetch the full result
          const resultResponse = await this.client.get(responseUrl);

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
        // Fail immediately on 4xx client errors — retrying won't help
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw new Error(`Fal.ai video: HTTP ${status} from polling endpoint (model may be unavailable)`);
        }
        logger.warn(`Fal.ai video poll error (will retry): ${error.message}`);
      }
    }

    throw new Error('Fal.ai video: polling timed out after 5 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
