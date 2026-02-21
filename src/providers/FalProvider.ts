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
const IMAGE_POLL_TIMEOUT_MS = 180000; // 3 minutes for images
const VIDEO_POLL_TIMEOUT_MS = 300000; // 5 minutes for video (leaves room for fallback providers)

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

  /**
   * Image generation via fal.ai queue API
   * Supports text-to-image and image editing (Flux Kontext)
   */
  /**
   * Switch model ID to editing variant when images are provided.
   * Fal.ai uses different endpoints for text-to-image vs image editing.
   */
  private getImageEditModel(textModel: string): string {
    const modelMap: Record<string, string> = {
      'fal-ai/seedream': 'fal-ai/bytedance/seedream/v4/edit',
    };
    return modelMap[textModel] || textModel;
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    let model = (options?.model as string) || 'fal-ai/flux-kontext/pro';
    const inputImageUrls = options?.inputImageUrls as string[] | undefined;
    const hasImage = inputImageUrls && inputImageUrls.length > 0;
    const start = Date.now();

    // Switch to editing model variant if images are provided
    if (hasImage) {
      model = this.getImageEditModel(model);
    }

    try {
      logger.info(`Fal.ai image: starting generation (${model}, editing: ${!!hasImage})`);

      const input: Record<string, unknown> = { prompt };

      // Add reference image for editing mode
      if (hasImage) {
        input.image_url = inputImageUrls[0];
      }

      // Submit to queue
      const submitResponse = await this.client.post(
        `https://queue.fal.run/${model}`,
        input
      );

      const requestId = submitResponse.data?.request_id;
      if (!requestId) {
        throw new Error(`Fal.ai image: no request_id in response: ${JSON.stringify(submitResponse.data).slice(0, 300)}`);
      }

      const statusUrl = submitResponse.data?.status_url
        || `https://queue.fal.run/${model}/requests/${requestId}/status`;
      const responseUrl = submitResponse.data?.response_url
        || `https://queue.fal.run/${model}/requests/${requestId}`;

      logger.info(`Fal.ai image: queued, request_id=${requestId}`);

      // Poll for completion
      const resultData = await this.pollQueueRawResult(statusUrl, responseUrl, IMAGE_POLL_TIMEOUT_MS);

      // Extract image URL from result
      const imageUrl = resultData?.images?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`Fal.ai image: completed but no image URL: ${JSON.stringify(resultData).slice(0, 300)}`);
      }

      const time = Date.now() - start;
      const cost = 0.04;
      this.updateStats(true, cost, time);

      logger.info(`Fal.ai image: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Fal.ai image: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video generation via fal.ai queue API
   * Submits to queue, polls for completion, returns video URL
   */
  /**
   * Switch model ID from text-to-video to image-to-video variant when images are provided.
   */
  private getImageToVideoModel(textModel: string): string {
    // Seedance: text-to-video → image-to-video
    if (textModel.includes('seedance') && textModel.endsWith('/text-to-video')) {
      return textModel.replace('/text-to-video', '/image-to-video');
    }
    // Kling: append /image-to-video (fal kling IDs don't have /text-to-video suffix)
    if (textModel.includes('kling-video') && !textModel.endsWith('/image-to-video')) {
      return `${textModel}/image-to-video`;
    }
    // Wan: text-to-video → image-to-video
    if (textModel.includes('/wan/') && textModel.endsWith('/text-to-video')) {
      return textModel.replace('/text-to-video', '/image-to-video');
    }
    return textModel;
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
      const resultData = await this.pollQueueRawResult(statusUrl, responseUrl);
      const videoUrl = resultData?.video?.url;
      if (!videoUrl) {
        throw new Error(`Fal.ai video: completed but no video URL: ${JSON.stringify(resultData).slice(0, 300)}`);
      }

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
   * Generic fal.ai queue poller — returns raw result data
   * GET {statusUrl} → { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" }
   * GET {responseUrl} → full result object
   */
  private async pollQueueRawResult(
    statusUrl: string,
    responseUrl: string,
    timeoutMs: number = VIDEO_POLL_TIMEOUT_MS,
  ): Promise<any> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      try {
        const statusResponse = await this.client.get(statusUrl);

        const status = statusResponse.data?.status;
        logger.debug(`Fal.ai poll: status=${status}`);

        if (status === 'COMPLETED') {
          const resultResponse = await this.client.get(responseUrl);
          return resultResponse.data;
        }

        if (status === 'FAILED') {
          const error = statusResponse.data?.error || 'Unknown error';
          throw new Error(`Fal.ai task failed: ${error}`);
        }
      } catch (error: any) {
        if (error.message?.includes('Fal.ai')) {
          throw error;
        }
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw new Error(`Fal.ai: HTTP ${status} from polling endpoint (model may be unavailable)`);
        }
        logger.warn(`Fal.ai poll error (will retry): ${error.message}`);
      }
    }

    throw new Error(`Fal.ai: polling timed out after ${Math.round(timeoutMs / 60000)} minutes`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
