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
 * Kie.ai Provider — Async task-based API
 * Supports: Image (Flux Kontext, Midjourney), Video (Kling, Veo, Sora, Runway)
 * Docs: https://docs.kie.ai
 *
 * Image flows:
 *   Flux Kontext: POST /api/v1/flux/kontext/generate → poll /flux/kontext/record-info
 *   Midjourney:   POST /api/v1/mj/generate → poll /mj/record-info
 *
 * Video flows:
 *   Kling/Sora: POST /api/v1/jobs/createTask → poll /jobs/recordInfo
 *   Veo:        POST /api/v1/veo/generate → poll /jobs/recordInfo
 *   Runway:     POST /api/v1/runway/generate → poll /jobs/recordInfo
 *
 * Auth: Bearer token
 */
export class KieAIProvider extends EnhancedProvider {
  readonly name = 'kieai';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: 'https://api.kie.ai/api/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 120000,
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    throw new Error('Kie.ai text generation not supported — use OpenAI or Anthropic');
  }

  /**
   * Image generation via Flux Kontext
   * POST /flux/kontext/generate → poll /flux/kontext/record-info
   */
  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const model = (options?.model as string) || 'flux-kontext-pro';

    if (model === 'midjourney') {
      return this.generateMidjourneyImage(prompt, options);
    }

    if (model === 'nano-banana-pro') {
      return this.generateNanoBananaImage(prompt, options);
    }

    const start = Date.now();
    try {
      logger.info(`KieAI image: starting Flux Kontext generation (${model})`);

      const createResponse = await this.client.post('/flux/kontext/generate', {
        prompt,
        model,
        aspectRatio: (options?.aspectRatio as string) || '16:9',
        outputFormat: 'png',
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        throw new Error('KieAI image: no taskId in response');
      }

      logger.info(`KieAI image: task created, taskId=${taskId}`);

      const imageUrl = await this.pollFluxKontextResult(taskId);

      const time = Date.now() - start;
      const cost = 0.01; // ~2 credits × $0.005/credit
      this.updateStats(true, cost, time);

      logger.info(`KieAI image: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI image: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video generation — routes to the correct KieAI endpoint based on model
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const model = (options?.model as string) || 'kling-2.6/text-to-video';

    if (model.startsWith('veo3')) {
      return this.generateVeoVideo(prompt, options);
    }
    if (model === 'runway') {
      return this.generateRunwayVideo(prompt, options);
    }

    // Default: Kling / Sora / Seedance via market endpoint
    return this.generateMarketVideo(prompt, options);
  }

  /**
   * Switch model ID to image-to-video variant when images are provided.
   * KieAI uses different model IDs for text-to-video vs image-to-video.
   */
  private getImageToVideoModelId(textModel: string): string {
    const modelMap: Record<string, string> = {
      'kling-2.6/text-to-video': 'kling-2.6/image-to-video',
      'sora-2-text-to-video': 'sora-2-image-to-video',
      // Seedance uses the same model ID for both text and image-to-video
    };
    return modelMap[textModel] || textModel;
  }

  /**
   * Kling / Sora via Market endpoint
   * POST /jobs/createTask → poll /jobs/recordInfo
   */
  private async generateMarketVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      let model = (options?.model as string) || 'kling-2.6/text-to-video';
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImages = inputImageUrls && inputImageUrls.length > 0;

      // Switch to image-to-video model variant if images are provided
      if (hasImages) {
        model = this.getImageToVideoModelId(model);
      }

      logger.info(`KieAI video: starting market generation (${model}, images: ${hasImages ? inputImageUrls.length : 0})`);

      const input: Record<string, unknown> = {
        prompt,
        aspect_ratio: (options?.aspectRatio as string) || '16:9',
        duration: (options?.duration as string) || '5',
      };

      // Add image URLs for image-to-video
      if (hasImages) {
        input.input_urls = inputImageUrls;
      }

      // Kling-specific: sound off
      if (model.includes('kling')) {
        input.sound = false;
      }

      // Sora-specific: n_frames instead of duration
      if (model.startsWith('sora-')) {
        delete input.duration;
        const dur = parseInt(String(options?.duration || '4'), 10);
        input.n_frames = dur <= 4 ? '10' : '15';
        const ar = (options?.aspectRatio as string) || '16:9';
        input.aspect_ratio = ar === '9:16' ? 'portrait' : 'landscape';
      }

      // Seedance-specific: duration must be 4, 8, or 12 (default 8)
      if (model.includes('seedance')) {
        input.aspect_ratio = (options?.aspectRatio as string) || '16:9';
        const dur = parseInt(String(options?.duration || '8'), 10);
        input.duration = String([4, 8, 12].includes(dur) ? dur : 8);
        input.resolution = (options?.resolution as string) || '720p';
      }

      const createResponse = await this.client.post('/jobs/createTask', {
        model,
        input,
      });

      const respData = createResponse.data;
      const taskId = respData?.data?.taskId || respData?.data?.task_id || respData?.taskId;
      if (!taskId) {
        const respStr = JSON.stringify(respData).slice(0, 500);
        throw new Error(`KieAI video: no taskId in response: ${respStr}`);
      }

      logger.info(`KieAI video: task created, taskId=${taskId}`);

      const videoUrl = await this.pollMarketTaskResult(taskId);

      const time = Date.now() - start;
      let cost = 0.28; // default for Kling
      if (model.includes('seedance')) cost = 0.45;
      if (model.startsWith('sora-')) cost = 0.50;
      this.updateStats(true, cost, time);

      logger.info(`KieAI video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI video: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Google Veo 3.1 via dedicated endpoint
   * POST /veo/generate → poll /jobs/recordInfo
   */
  private async generateVeoVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'veo3_fast';
      logger.info(`KieAI Veo: starting generation (${model})`);

      const createResponse = await this.client.post('/veo/generate', {
        prompt,
        model,
        aspect_ratio: (options?.aspectRatio as string) || '16:9',
        enableTranslation: true,
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        throw new Error('KieAI Veo: no taskId in response');
      }

      logger.info(`KieAI Veo: task created, taskId=${taskId}`);

      const videoUrl = await this.pollMarketTaskResult(taskId);

      const time = Date.now() - start;
      const cost = model === 'veo3' ? 2.0 : 0.4;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Veo: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Veo: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Runway Gen-3 via dedicated endpoint
   * POST /runway/generate → poll /jobs/recordInfo
   */
  private async generateRunwayVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      logger.info('KieAI Runway: starting generation');

      const duration = parseInt(String(options?.duration || '5'), 10);
      let quality = (options?.resolution as string) || '720p';

      // Runway constraint: duration=10 cannot use 1080p
      if (duration === 10 && quality === '1080p') {
        quality = '720p';
      }

      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const body: Record<string, unknown> = {
        prompt,
        duration,
        quality,
        aspectRatio: (options?.aspectRatio as string) || '16:9',
      };

      // Runway supports up to 3 init images
      if (inputImageUrls?.length) {
        body.promptImage = inputImageUrls.slice(0, 3);
      }

      const createResponse = await this.client.post('/runway/generate', body);

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        throw new Error('KieAI Runway: no taskId in response');
      }

      logger.info(`KieAI Runway: task created, taskId=${taskId}`);

      const videoUrl = await this.pollMarketTaskResult(taskId);

      const time = Date.now() - start;
      const cost = 0.3;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Runway: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Runway: failed', error.response?.data || error.message);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Kie.ai audio generation not supported — use OpenAI or ElevenLabs');
  }

  /**
   * Midjourney image generation via dedicated MJ endpoint
   * POST /mj/generate → poll /mj/record-info
   */
  private async generateMidjourneyImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      logger.info('KieAI image: starting Midjourney generation');

      // Map version string: 'v6.1' → '6.1', 'v7' → '7'
      const versionStr = (options?.version as string) || 'v6.1';
      const versionNum = versionStr.replace('v', '');

      const createResponse = await this.client.post('/mj/generate', {
        taskType: 'mj_txt2img',
        prompt,
        aspectRatio: (options?.aspectRatio as string) || '1:1',
        version: versionNum,
        stylization: (options?.stylize as number) || 100,
        speed: 'fast',
        waterMark: false,
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        const respData = JSON.stringify(createResponse.data).slice(0, 500);
        throw new Error(`KieAI Midjourney: no taskId in response: ${respData}`);
      }

      logger.info(`KieAI Midjourney: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMjTaskResult(taskId);

      const time = Date.now() - start;
      const cost = 0.04;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Midjourney: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Midjourney: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Nano Banana Pro (Google Gemini Image) via Market endpoint
   * POST /jobs/createTask → poll /jobs/recordInfo
   */
  private async generateNanoBananaImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      logger.info('KieAI image: starting Nano Banana Pro generation');

      const createResponse = await this.client.post('/jobs/createTask', {
        model: 'nano-banana-pro',
        input: {
          prompt,
          aspect_ratio: (options?.aspectRatio as string) || '1:1',
        },
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        const respData = JSON.stringify(createResponse.data).slice(0, 500);
        throw new Error(`KieAI Nano Banana: no taskId in response: ${respData}`);
      }

      logger.info(`KieAI Nano Banana: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMarketTaskResult(taskId, IMAGE_POLL_TIMEOUT_MS);

      const time = Date.now() - start;
      const cost = 0.09;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Nano Banana: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Nano Banana: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Poll Flux Kontext image task
   * GET /flux/kontext/record-info?taskId=...
   * successFlag: 0=processing, 1=success, 2=create failed, 3=gen failed
   */
  private async pollFluxKontextResult(taskId: string): Promise<string> {
    const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get('/flux/kontext/record-info', {
        params: { taskId },
      });

      const data = response.data?.data;
      const successFlag = data?.successFlag;

      logger.debug(`KieAI image poll: successFlag=${successFlag}, taskId=${taskId}`);

      if (successFlag === 1) {
        const imageUrl = data?.response?.resultImageUrl;
        if (!imageUrl) {
          throw new Error('KieAI image: success but no resultImageUrl');
        }
        return imageUrl;
      }

      if (successFlag === 2 || successFlag === 3) {
        const errorMsg = data?.errorMessage || 'Generation failed';
        throw new Error(`KieAI image task failed: ${errorMsg}`);
      }
    }

    throw new Error('KieAI image: polling timed out after 3 minutes');
  }

  /**
   * Poll Midjourney task via dedicated MJ endpoint
   * GET /mj/record-info?taskId=...
   * successFlag: 0=processing, 1=success
   * resultInfoJson.resultUrls[].resultUrl
   */
  private async pollMjTaskResult(taskId: string): Promise<string> {
    const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get('/mj/record-info', {
        params: { taskId },
      });

      const data = response.data?.data;
      const successFlag = data?.successFlag;

      logger.debug(`KieAI MJ poll: successFlag=${successFlag}, taskId=${taskId}`);

      if (successFlag === 1) {
        const resultUrl = data?.resultInfoJson?.resultUrls?.[0]?.resultUrl;
        if (!resultUrl) {
          throw new Error('KieAI Midjourney: success but no result URL');
        }
        return resultUrl;
      }

      if (data?.errorCode || data?.errorMessage) {
        throw new Error(`KieAI Midjourney task failed: ${data.errorMessage || data.errorCode}`);
      }
    }

    throw new Error('KieAI Midjourney: polling timed out');
  }

  /**
   * Poll Market task (Kling video, etc.)
   * GET /jobs/recordInfo?taskId=...
   * state: waiting, queuing, generating, success, fail
   * result in resultJson (JSON string) → { resultUrls: [...] }
   */
  private async pollMarketTaskResult(taskId: string, timeoutMs: number = VIDEO_POLL_TIMEOUT_MS): Promise<string> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get('/jobs/recordInfo', {
        params: { taskId },
      });

      const data = response.data?.data;
      const state = data?.state;

      logger.debug(`KieAI video poll: state=${state}, taskId=${taskId}`);

      if (state === 'success') {
        // resultJson is a JSON string: {"resultUrls":["https://..."]}
        let resultUrl: string | undefined;
        try {
          const resultData = JSON.parse(data.resultJson);
          resultUrl = resultData?.resultUrls?.[0];
        } catch {
          // If resultJson is not valid JSON, try direct fields
          resultUrl = data?.resultUrls?.[0];
        }

        if (!resultUrl) {
          throw new Error('KieAI video: success but no result URL in resultJson');
        }
        return resultUrl;
      }

      if (state === 'fail') {
        const errorMsg = data?.failMsg || 'Generation failed';
        throw new Error(`KieAI video task failed: ${errorMsg}`);
      }
    }

    throw new Error('KieAI video: polling timed out after 5 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
