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
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 minutes for video

/**
 * Kie.ai Provider — Async task-based API
 * Supports: Image (Flux Kontext), Video (Kling 2.6 via Market)
 * Docs: https://docs.kie.ai
 *
 * Image flow:
 *   POST /api/v1/flux/kontext/generate → taskId
 *   Poll GET /api/v1/flux/kontext/record-info?taskId=... → successFlag=1 → resultImageUrl
 *
 * Video flow:
 *   POST /api/v1/jobs/createTask (model: kling-2.6/text-to-video) → taskId
 *   Poll GET /api/v1/jobs/recordInfo?taskId=... → state=success → resultJson.resultUrls[0]
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
    throw new Error('Kie.ai text generation not supported — use AIMLAPI or OpenAI');
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
   * Video generation via Kling 2.6 (Market endpoint)
   * POST /jobs/createTask → poll /jobs/recordInfo
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'kling-2.6/text-to-video';
      logger.info(`KieAI video: starting generation (${model})`);

      const createResponse = await this.client.post('/jobs/createTask', {
        model,
        input: {
          prompt,
          sound: false,
          aspect_ratio: (options?.aspectRatio as string) || '16:9',
          duration: (options?.duration as string) || '5',
        },
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        throw new Error('KieAI video: no taskId in response');
      }

      logger.info(`KieAI video: task created, taskId=${taskId}`);

      const videoUrl = await this.pollMarketTaskResult(taskId);

      const time = Date.now() - start;
      const cost = 0.28; // $0.28 per 5s video
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

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('Kie.ai audio generation not supported — use AIMLAPI or ElevenLabs');
  }

  /**
   * Midjourney image generation via Market endpoint
   * POST /jobs/createTask → poll /jobs/recordInfo
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

      const createResponse = await this.client.post('/jobs/createTask', {
        taskType: 'mj_txt2img',
        params: {
          prompt,
          aspectRatio: (options?.aspectRatio as string) || '1:1',
          version: versionNum,
          stylization: (options?.stylize as number) || 100,
          speed: 'fast',
          waterMark: false,
        },
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        throw new Error('KieAI Midjourney: no taskId in response');
      }

      logger.info(`KieAI Midjourney: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMarketTaskResult(taskId, IMAGE_POLL_TIMEOUT_MS);

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

    throw new Error('KieAI video: polling timed out after 10 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
