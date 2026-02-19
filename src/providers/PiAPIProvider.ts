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
const VIDEO_POLL_TIMEOUT_MS = 300000; // 5 minutes for video (leaves room for fallback)

/**
 * PiAPI Provider — Task-based async API
 * Supports: Image (Flux Schnell/Dev), Video (Kling 2.6)
 * Docs: https://piapi.ai/docs/unified-api-schema
 *
 * Flow: POST /api/v1/task -> get task_id -> poll GET /api/v1/task/{task_id}
 * Auth: X-API-Key header
 *
 * Pricing (Feb 2026):
 *   Kling 2.6 Std 5s: $0.20  |  Kling 2.6 Pro 5s: $0.33
 *   Kling 2.6 Std 10s: $0.40 |  Kling 2.6 Pro 10s: $0.66
 *   Kling 2.1-Master 5s: $0.96
 *   Flux Schnell: $0.002/image | Flux Dev: $0.015/image
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
    throw new Error('PiAPI text generation not supported — use OpenAI or Anthropic');
  }

  /**
   * Image generation via PiAPI Flux models
   * POST /api/v1/task with model "Qubico/flux1-schnell", task_type "txt2img"
   */
  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const model = (options?.model as string) || 'Qubico/flux1-schnell';
    const start = Date.now();

    try {
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

      const imageUrl = await this.pollImageResult(taskId);

      const time = Date.now() - start;
      const cost = model.includes('schnell') ? 0.002 : 0.015;
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
   *
   * Supports:
   * - mode: 'std' (standard) or 'pro' (professional)
   * - duration: 5 or 10 seconds
   * - version: '2.6' (default), '2.5', '2.1', '2.1-master'
   * - aspect_ratio: '16:9', '9:16', '1:1'
   * - image_url: start frame for image-to-video
   * - image_tail_url: end frame (optional, requires image_url)
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'kling';
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImages = inputImageUrls && inputImageUrls.length > 0;

      const mode = (options?.mode as string) || 'std';
      const duration = (options?.duration as number) || 5;
      const version = (options?.version as string) || '2.6';
      const aspectRatio = (options?.aspectRatio as string) || '16:9';

      logger.info(`PiAPI video: creating task (model=${model}, mode=${mode}, v=${version}, dur=${duration}s, images=${hasImages ? inputImageUrls!.length : 0})`);

      const input: Record<string, unknown> = {
        prompt,
        duration,
        mode,
        version,
        aspect_ratio: aspectRatio,
      };

      // Image-to-video: pass start frame
      if (hasImages) {
        input.image_url = inputImageUrls![0];
        // If 2 images provided, use second as end frame
        if (inputImageUrls!.length >= 2) {
          input.image_tail_url = inputImageUrls![1];
        }
      }

      // Negative prompt
      if (options?.negativePrompt) {
        input.negative_prompt = options.negativePrompt;
      }

      // CFG Scale (creativity)
      if (options?.cfgScale !== undefined) {
        input.cfg_scale = options.cfgScale;
      }

      // Enable audio (Kling native audio)
      if (options?.enableAudio !== undefined) {
        input.enable_audio = options.enableAudio;
      }

      logger.info('PiAPI video payload:', { model, aspect_ratio: input.aspect_ratio, duration: input.duration, mode: input.mode, version: input.version, hasImage: !!input.image_url, enableAudio: !!input.enable_audio });
      const createResponse = await this.client.post('/task', {
        model,
        task_type: 'video_generation',
        input,
      });

      const taskId = createResponse.data?.data?.task_id;
      if (!taskId) {
        throw new Error(`PiAPI video: no task_id in response: ${JSON.stringify(createResponse.data).slice(0, 300)}`);
      }

      logger.info(`PiAPI video: task created, task_id=${taskId}`);

      const videoUrl = await this.pollVideoResult(taskId);

      const time = Date.now() - start;
      const enableAudio = (options?.enableAudio as boolean) || false;
      const cost = this.estimateVideoCost(mode, duration, version, enableAudio);
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
    throw new Error('PiAPI audio generation not supported — use OpenAI or ElevenLabs');
  }

  private estimateVideoCost(mode: string, duration: number, version: string, enableAudio = false): number {
    const isNewVersion = ['2.5', '2.6'].includes(version);

    if (version === '2.1-master') {
      return duration <= 5 ? 0.96 : 1.92;
    }

    if (mode === 'pro') {
      const baseCost = isNewVersion
        ? (duration <= 5 ? 0.33 : 0.66)
        : (duration <= 5 ? 0.46 : 0.92);
      // 2.6 pro audio = 2× pro price
      if (enableAudio && version === '2.6') return baseCost * 2;
      return baseCost;
    }

    return isNewVersion
      ? (duration <= 5 ? 0.20 : 0.40)
      : (duration <= 5 ? 0.26 : 0.52);
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
        // Try multiple output paths — Kling API format varies
        const works = data?.output?.works;
        const videoUrl =
          data?.output?.video ||
          works?.[0]?.video?.resource_without_watermark ||
          works?.[0]?.video?.resource ||
          data?.output?.video_url;
        if (!videoUrl) {
          throw new Error(`PiAPI video: completed but no video URL in output: ${JSON.stringify(data?.output).slice(0, 300)}`);
        }
        return videoUrl;
      }

      if (status === 'Failed' || status === 'failed') {
        const errorMsg = data?.error?.message || 'Unknown error';
        throw new Error(`PiAPI video task failed: ${errorMsg}`);
      }
    }

    throw new Error('PiAPI video: polling timed out after 5 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
