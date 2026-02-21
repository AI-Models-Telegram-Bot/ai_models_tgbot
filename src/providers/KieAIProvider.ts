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

    if (model === 'nano-banana' || model === 'nano-banana-pro') {
      return this.generateNanoBananaImage(prompt, options);
    }

    if (model === 'seedream-4.0') {
      return this.generateSeedreamImage(prompt, options);
    }

    if (model === 'seedream-4.5') {
      return this.generateSeedream45Image(prompt, options);
    }

    const start = Date.now();
    try {
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImage = inputImageUrls && inputImageUrls.length > 0;
      logger.info(`KieAI image: starting Flux Kontext generation (${model}, editing: ${!!hasImage})`);

      const fluxPayload: Record<string, unknown> = {
        prompt,
        model,
        aspectRatio: (options?.aspectRatio as string) || '16:9',
        outputFormat: 'png',
      };

      // Add reference image for editing mode
      if (hasImage) {
        fluxPayload.inputImage = inputImageUrls[0];
      }

      logger.info('KieAI Flux Kontext payload:', { model, aspectRatio: fluxPayload.aspectRatio, hasImage });
      const createResponse = await this.client.post('/flux/kontext/generate', fluxPayload);

      const fluxResp = createResponse.data;
      if (fluxResp?.code && fluxResp.code !== 200 && fluxResp.code !== 0) {
        throw new Error(`KieAI Flux API error (${fluxResp.code}): ${fluxResp.msg || JSON.stringify(fluxResp).slice(0, 300)}`);
      }
      const taskId = fluxResp?.data?.taskId;
      if (!taskId) {
        throw new Error(`KieAI image: no taskId in response: ${JSON.stringify(fluxResp).slice(0, 300)}`);
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
    if (model === 'runway' || model === 'runway-gen4') {
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
    // Kling: any version — replace text-to-video with image-to-video
    if (textModel.startsWith('kling-') && textModel.endsWith('/text-to-video')) {
      return textModel.replace('/text-to-video', '/image-to-video');
    }
    // Sora: any variant — replace text-to-video with image-to-video
    if (textModel.startsWith('sora-') && textModel.includes('text-to-video')) {
      return textModel.replace('text-to-video', 'image-to-video');
    }
    // Seedance: replace text-to-video with image-to-video
    if (textModel.includes('seedance') && textModel.includes('text-to-video')) {
      return textModel.replace('text-to-video', 'image-to-video');
    }
    return textModel;
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

      // Kling: override version in model ID from user settings (e.g. kling-2.6 → kling-1.5)
      if (model.startsWith('kling-') && options?.version) {
        const userVersion = String(options.version);
        model = model.replace(/kling-[\d.]+/, `kling-${userVersion}`);
      }

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

      // Add image URLs for image-to-video (KieAI uses `image_urls` for Kling/Sora)
      if (hasImages) {
        input.image_urls = inputImageUrls;
      }

      // Kling-specific: sound off
      if (model.includes('kling')) {
        input.sound = false;
      }

      // Sora-specific: n_frames instead of duration
      if (model.startsWith('sora-')) {
        delete input.duration;
        const dur = parseInt(String(options?.duration || '4'), 10);
        // Map duration to n_frames: 4s→10, 8s→20, 10s→25, 12s→30, 15s→38
        const framesMap: Record<number, string> = { 4: '10', 8: '20', 10: '25', 12: '30', 15: '38' };
        input.n_frames = framesMap[dur] || (dur <= 4 ? '10' : String(Math.round(dur * 2.5)));
        const ar = (options?.aspectRatio as string) || '16:9';
        input.aspect_ratio = ar === '9:16' ? 'portrait' : 'landscape';
        // Sora Pro: add size param for higher quality
        if (model.includes('pro')) {
          input.size = 'high';
        }
      }

      // Seedance-specific: duration must be 4, 8, or 12 (default 8)
      if (model.includes('seedance')) {
        input.aspect_ratio = (options?.aspectRatio as string) || '16:9';
        const dur = parseInt(String(options?.duration || '8'), 10);
        input.duration = String([4, 8, 12].includes(dur) ? dur : 8);
        input.resolution = (options?.resolution as string) || '720p';
      }

      logger.info('KieAI market video payload:', { model, input });
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
      if (model.includes('sora-2-pro')) cost = 0.80;
      else if (model.startsWith('sora-')) cost = 0.50;
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
   * POST /veo/generate → poll /veo/record-info (NOT /jobs/recordInfo)
   */
  private async generateVeoVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'veo3_fast';
      const mode = (options?.mode as string) || 'text';
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      logger.info(`KieAI Veo: starting generation (${model}, mode: ${mode})`);

      const veoPayload: Record<string, unknown> = {
        prompt,
        model,
        aspect_ratio: (options?.aspectRatio as string) || '16:9',
        enableTranslation: true,
      };

      // Handle image processing modes
      if (mode === 'frames' && inputImageUrls?.length) {
        veoPayload.mode = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
        veoPayload.imageUrls = inputImageUrls.slice(0, 2);
      } else if (mode === 'ingredients' && inputImageUrls?.length) {
        veoPayload.mode = 'REFERENCE_2_VIDEO';
        veoPayload.imageUrls = inputImageUrls.slice(0, 3);
      }

      // Handle 4K resolution
      if (options?.resolution === '4K') {
        veoPayload.resolution = '4k';
      }

      logger.info('KieAI Veo payload:', { model, aspect_ratio: veoPayload.aspect_ratio, mode: veoPayload.mode, resolution: veoPayload.resolution });
      const createResponse = await this.client.post('/veo/generate', veoPayload);

      const respData = createResponse.data;
      // Check for API-level errors (e.g. 402 insufficient credits)
      if (respData?.code && respData.code !== 200 && respData.code !== 0) {
        throw new Error(`KieAI Veo API error (${respData.code}): ${respData.msg || JSON.stringify(respData).slice(0, 300)}`);
      }
      const taskId = respData?.data?.taskId;
      if (!taskId) {
        throw new Error(`KieAI Veo: no taskId in response: ${JSON.stringify(respData).slice(0, 300)}`);
      }

      logger.info(`KieAI Veo: task created, taskId=${taskId}`);

      const videoUrl = await this.pollVeoResult(taskId);

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
   * POST /runway/generate → poll /runway/record-detail
   */
  private async generateRunwayVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const modelSlug = (options?.model as string) || 'runway';
      const runwayModel = modelSlug === 'runway-gen4' ? 'gen-4' : 'gen-4-turbo';
      logger.info(`KieAI Runway: starting generation (${runwayModel})`);

      const duration = parseInt(String(options?.duration || '5'), 10);
      let quality = (options?.resolution as string) || '720p';

      // Runway constraint: duration=10 cannot use 1080p
      if (duration === 10 && quality === '1080p') {
        quality = '720p';
      }

      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const body: Record<string, unknown> = {
        prompt,
        model: runwayModel,
        duration,
        quality,
        aspectRatio: (options?.aspectRatio as string) || '16:9',
      };

      // KieAI Runway expects `imageUrl` (single string), not an array
      if (inputImageUrls?.length) {
        body.imageUrl = inputImageUrls[0];
      }

      logger.info('KieAI Runway payload:', { model: runwayModel, aspectRatio: body.aspectRatio, duration: body.duration, quality: body.quality });
      const createResponse = await this.client.post('/runway/generate', body);

      const runwayResp = createResponse.data;
      if (runwayResp?.code && runwayResp.code !== 200 && runwayResp.code !== 0) {
        throw new Error(`KieAI Runway API error (${runwayResp.code}): ${runwayResp.msg || JSON.stringify(runwayResp).slice(0, 300)}`);
      }
      const taskId = runwayResp?.data?.taskId;
      if (!taskId) {
        throw new Error(`KieAI Runway: no taskId in response: ${JSON.stringify(runwayResp).slice(0, 300)}`);
      }

      logger.info(`KieAI Runway: task created, taskId=${taskId}`);

      const videoUrl = await this.pollRunwayResult(taskId);

      const time = Date.now() - start;
      const cost = runwayModel === 'gen-4' ? 0.4 : 0.3;
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
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImage = inputImageUrls && inputImageUrls.length > 0;
      logger.info(`KieAI image: starting Midjourney generation (img2img: ${!!hasImage})`);

      // Map version string: 'v6.1' → '6.1', 'v7' → '7'
      const versionStr = (options?.version as string) || 'v6.1';
      const versionNum = versionStr.replace('v', '');

      const speed = (options?.speed as string) || 'fast';
      const weirdness = (options?.weirdness as number) ?? 0;

      const payload: Record<string, unknown> = {
        taskType: hasImage ? 'mj_img2img' : 'mj_txt2img',
        prompt,
        aspectRatio: (options?.aspectRatio as string) || '1:1',
        version: versionNum,
        stylization: (options?.stylize as number) || 100,
        speed,
        ...(weirdness > 0 ? { weirdness } : {}),
      };

      // Add reference image for img2img mode
      if (hasImage) {
        payload.fileUrl = inputImageUrls[0];
      }

      logger.info('KieAI Midjourney payload:', { taskType: payload.taskType, hasImage });
      const createResponse = await this.client.post('/mj/generate', payload);

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
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImage = inputImageUrls && inputImageUrls.length > 0;
      const modelId = (options?.model as string) || 'nano-banana-pro';
      logger.info(`KieAI image: starting ${modelId} generation (editing: ${!!hasImage})`);

      const input: Record<string, unknown> = {
        prompt,
        aspect_ratio: (options?.aspectRatio as string) || '1:1',
        output_format: 'png',
      };

      // Add resolution if specified (1K, 2K, 4K) — Pro only
      if (options?.resolution && modelId === 'nano-banana-pro') {
        input.resolution = options.resolution;
      }

      // Add reference image for editing mode
      if (hasImage) {
        input.image_input = inputImageUrls;
      }

      logger.info('KieAI Nano Banana payload:', { aspectRatio: input.aspect_ratio, resolution: input.resolution, hasImage, imageCount: inputImageUrls?.length });
      const createResponse = await this.client.post('/jobs/createTask', {
        model: modelId,
        input,
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        const respData = JSON.stringify(createResponse.data).slice(0, 500);
        throw new Error(`KieAI Nano Banana: no taskId in response: ${respData}`);
      }

      logger.info(`KieAI ${modelId}: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMarketTaskResult(taskId, IMAGE_POLL_TIMEOUT_MS);

      const time = Date.now() - start;
      const cost = modelId === 'nano-banana-pro' ? 0.09 : 0.02;
      this.updateStats(true, cost, time);

      logger.info(`KieAI ${modelId}: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Nano Banana: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Map aspect ratio string to Seedream image_size preset.
   * Seedream uses named presets instead of ratio strings.
   */
  private toSeedreamImageSize(aspectRatio: string): string {
    const map: Record<string, string> = {
      '1:1': 'square_hd',
      '16:9': 'landscape_16_9',
      '9:16': 'portrait_16_9',
      '4:3': 'landscape_4_3',
      '3:4': 'portrait_4_3',
      '3:2': 'landscape_3_2',
      '2:3': 'portrait_3_2',
      '21:9': 'landscape_21_9',
    };
    return map[aspectRatio] || 'square_hd';
  }

  /**
   * Seedream 4.0 (ByteDance) via Market endpoint
   * Text-to-image: model 'bytedance/seedream-v4-text-to-image'
   * Image editing: model 'bytedance/seedream-v4-edit' with image_urls
   * POST /jobs/createTask → poll /jobs/recordInfo
   */
  private async generateSeedreamImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImage = inputImageUrls && inputImageUrls.length > 0;
      const model = hasImage ? 'bytedance/seedream-v4-edit' : 'bytedance/seedream-v4-text-to-image';
      const aspectRatio = (options?.aspectRatio as string) || '1:1';
      logger.info(`KieAI image: starting Seedream generation (${model}, editing: ${!!hasImage})`);

      const input: Record<string, unknown> = {
        prompt,
        image_size: this.toSeedreamImageSize(aspectRatio),
      };

      // Add reference images for editing mode
      if (hasImage) {
        input.image_urls = inputImageUrls;
      }

      logger.info('KieAI Seedream payload:', { model, image_size: input.image_size, hasImage });
      const createResponse = await this.client.post('/jobs/createTask', {
        model,
        input,
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        const respData = JSON.stringify(createResponse.data).slice(0, 500);
        throw new Error(`KieAI Seedream: no taskId in response: ${respData}`);
      }

      logger.info(`KieAI Seedream: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMarketTaskResult(taskId, IMAGE_POLL_TIMEOUT_MS);

      const time = Date.now() - start;
      const cost = 0.0175;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Seedream: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Seedream: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Seedream 4.5 Beta (ByteDance) via Market endpoint
   * Text-to-image: model 'seedream/4.5-text-to-image'
   * Image editing: model 'seedream/4.5-edit' with image_urls
   * Supports quality: 'basic' (1K) | 'high' (2K/4K)
   * POST /jobs/createTask → poll /jobs/recordInfo
   */
  private async generateSeedream45Image(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const inputImageUrls = options?.inputImageUrls as string[] | undefined;
      const hasImage = inputImageUrls && inputImageUrls.length > 0;
      const model = hasImage ? 'seedream/4.5-edit' : 'seedream/4.5-text-to-image';
      const aspectRatio = (options?.aspectRatio as string) || '1:1';
      const resolution = (options?.resolution as string) || '1K';
      logger.info(`KieAI image: starting Seedream 4.5 generation (${model}, editing: ${!!hasImage})`);

      const input: Record<string, unknown> = {
        prompt,
        image_size: this.toSeedreamImageSize(aspectRatio),
        quality: resolution === '1K' ? 'basic' : 'high',
      };

      // Add reference images for editing mode
      if (hasImage) {
        input.image_urls = inputImageUrls;
      }

      logger.info('KieAI Seedream 4.5 payload:', { model, image_size: input.image_size, quality: input.quality, hasImage });
      const createResponse = await this.client.post('/jobs/createTask', {
        model,
        input,
      });

      const taskId = createResponse.data?.data?.taskId;
      if (!taskId) {
        const respData = JSON.stringify(createResponse.data).slice(0, 500);
        throw new Error(`KieAI Seedream 4.5: no taskId in response: ${respData}`);
      }

      logger.info(`KieAI Seedream 4.5: task created, taskId=${taskId}`);

      const imageUrl = await this.pollMarketTaskResult(taskId, IMAGE_POLL_TIMEOUT_MS);

      const time = Date.now() - start;
      const cost = resolution === '1K' ? 0.03 : 0.06;
      this.updateStats(true, cost, time);

      logger.info(`KieAI Seedream 4.5: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('KieAI Seedream 4.5: failed', error.response?.data || error.message);
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
   * Poll Veo task via dedicated endpoint
   * GET /veo/record-info?taskId=...
   * successFlag: 0=processing, 1=success, 2=create failed, 3=gen failed
   * response.resultUrls[0] for video URL
   */
  private async pollVeoResult(taskId: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get('/veo/record-info', {
        params: { taskId },
      });

      const data = response.data?.data;
      const successFlag = data?.successFlag;

      logger.debug(`KieAI Veo poll: successFlag=${successFlag}, taskId=${taskId}`);

      if (successFlag === 1) {
        const videoUrl = data?.response?.resultUrls?.[0];
        if (!videoUrl) {
          throw new Error('KieAI Veo: success but no resultUrl');
        }
        return videoUrl;
      }

      if (successFlag === 2 || successFlag === 3) {
        const errorMsg = data?.errorMessage || 'Generation failed';
        throw new Error(`KieAI Veo task failed: ${errorMsg}`);
      }
    }

    throw new Error('KieAI Veo: polling timed out after 5 minutes');
  }

  /**
   * Poll Runway task via dedicated endpoint
   * GET /runway/record-detail?taskId=...
   * state: wait, queueing, generating, success, fail
   * videoInfo.videoUrl for result
   */
  private async pollRunwayResult(taskId: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get('/runway/record-detail', {
        params: { taskId },
      });

      const data = response.data?.data;
      const state = data?.state;

      logger.debug(`KieAI Runway poll: state=${state}, taskId=${taskId}`);

      if (state === 'success') {
        const videoUrl = data?.videoInfo?.videoUrl;
        if (!videoUrl) {
          throw new Error('KieAI Runway: success but no videoUrl');
        }
        return videoUrl;
      }

      if (state === 'fail') {
        const errorMsg = data?.failMsg || 'Generation failed';
        throw new Error(`KieAI Runway task failed: ${errorMsg}`);
      }
    }

    throw new Error('KieAI Runway: polling timed out after 5 minutes');
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
