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

const POLL_INTERVAL_MS = 10000; // 10s — Topaz processing is slower
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 min

interface VideoMeta {
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Topaz Labs Direct API Provider — Premium video enhancement
 * Full control: upscale model, FPS interpolation, quality parameters
 * Docs: https://developer.topazlabs.com/video-api/introduction
 *
 * Flow:
 *  1. Download video from URL into buffer
 *  2. POST /video/ with source metadata + filters → requestId
 *  3. PATCH /video/{id}/accept → signed upload URL
 *  4. PUT buffer to signed URL → ETag
 *  5. PATCH /video/{id}/complete-upload/ → queues processing
 *  6. Poll GET /video/{id}/status → downloadUrl
 */
export class TopazDirectProvider extends EnhancedProvider {
  readonly name = 'topaz-direct';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: 'https://api.topazlabs.com',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 60000,
    });
  }

  async generateText(_prompt: string, _options?: Record<string, unknown>): Promise<TextGenerationResult> {
    throw new Error('Topaz Direct does not support text generation');
  }

  async generateImage(_prompt: string, _options?: Record<string, unknown>): Promise<ImageGenerationResult> {
    throw new Error('Topaz Direct does not support image generation');
  }

  async generateAudio(_text: string, _options?: Record<string, unknown>): Promise<AudioGenerationResult> {
    throw new Error('Topaz Direct does not support audio generation');
  }

  async generateVideo(
    _prompt: string,
    options?: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const inputVideoUrl = options?.inputVideoUrl as string | undefined;
      if (!inputVideoUrl) {
        throw new Error('Topaz AI Pro requires a video. Please upload a video first.');
      }

      const videoMeta = (options?.videoMeta as VideoMeta) || {};

      logger.info('Topaz Direct: downloading video from Telegram...');

      // Step 1: Download video into buffer
      const downloadResponse = await axios.get(inputVideoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const videoBuffer = Buffer.from(downloadResponse.data);
      const actualSize = videoBuffer.length;

      logger.info(`Topaz Direct: downloaded ${(actualSize / 1024 / 1024).toFixed(1)}MB`);

      // Step 2: Create request with source metadata + filters
      const sourceWidth = videoMeta.width || 1920;
      const sourceHeight = videoMeta.height || 1080;
      const sourceDuration = videoMeta.duration || 10;
      const assumedFps = 30;
      const frameCount = Math.round(sourceDuration * assumedFps);

      const filters = this.buildFilters(options);

      // Compute output resolution from upscale setting
      const upscaleSetting = (options?.upscale as string) || '2x';
      let scaleFactor = 2;
      if (upscaleSetting === 'original' || upscaleSetting === '1') scaleFactor = 1;
      else if (upscaleSetting === '4x' || upscaleSetting === '4') scaleFactor = 4;

      const outputWidth = sourceWidth * scaleFactor;
      const outputHeight = sourceHeight * scaleFactor;

      // Determine output frame rate (if FPS interpolation, use target; otherwise match source)
      const topazFpsModel = options?.topazFpsModel as string | undefined;
      const outputFps = topazFpsModel ? ((options?.targetFps as number) || 60) : assumedFps;

      const createBody = {
        source: {
          container: 'mp4',
          size: actualSize,
          duration: sourceDuration,
          frameCount,
          frameRate: assumedFps,
          resolution: { width: sourceWidth, height: sourceHeight },
        },
        filters,
        output: {
          container: 'mp4',
          resolution: { width: outputWidth, height: outputHeight },
          frameRate: outputFps,
          audioCodec: 'AAC',
          audioTransfer: 'Copy',
          dynamicCompressionLevel: 'Mid',
        },
      };

      logger.info('Topaz Direct: creating request...', { filters: filters.map((f: any) => f.model) });
      const createResponse = await this.client.post('/video/', createBody);
      const requestId = createResponse.data?.requestId || createResponse.data?.id;

      if (!requestId) {
        const msg = createResponse.data?.message || createResponse.data?.error || JSON.stringify(createResponse.data).slice(0, 300);
        throw new Error(`Topaz Direct: no requestId: ${msg}`);
      }

      logger.info(`Topaz Direct: request created, id=${requestId}`);

      // Step 3: Accept request → get signed upload URLs
      const acceptResponse = await this.client.patch(`/video/${requestId}/accept`);
      const uploadUrls = acceptResponse.data?.uploadUrls || acceptResponse.data?.urls;

      if (!uploadUrls || !Array.isArray(uploadUrls) || uploadUrls.length === 0) {
        throw new Error('Topaz Direct: no upload URLs returned after accept');
      }

      logger.info(`Topaz Direct: accepted, got ${uploadUrls.length} upload URL(s)`);

      // Step 4: Upload video via PUT to signed URL (single part for ≤20MB)
      const uploadUrl = uploadUrls[0];
      const uploadResponse = await axios.put(uploadUrl, videoBuffer, {
        headers: { 'Content-Type': 'video/mp4' },
        timeout: 120000,
        maxBodyLength: 50 * 1024 * 1024,
        maxContentLength: 50 * 1024 * 1024,
      });
      const etag = uploadResponse.headers['etag'] || uploadResponse.headers['ETag'];

      logger.info(`Topaz Direct: uploaded, ETag=${etag}`);

      // Step 5: Complete upload
      await this.client.patch(`/video/${requestId}/complete-upload/`, {
        parts: [{ partNumber: 1, eTag: etag }],
      });

      logger.info('Topaz Direct: upload completed, processing started');

      // Step 6: Poll for result
      const videoUrl = await this.pollStatus(requestId);

      const time = Date.now() - start;
      this.updateStats(true, 0.08, time);
      logger.info(`Topaz Direct: success (${time}ms)`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('Topaz Direct: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Build Topaz filter array from user settings.
   * Supports upscale filter + optional FPS interpolation filter.
   */
  private buildFilters(
    options: Record<string, unknown> | undefined,
  ): any[] {
    const filters: any[] = [];

    // Upscale/enhancement filter — model + quality params only
    // Output resolution is set in the top-level output object, not in the filter
    const topazModel = (options?.topazModel as string) || 'prob-4';

    const upscaleFilter: Record<string, unknown> = {
      model: topazModel,
    };

    // Quality parameters (0.0-1.0)
    if (options?.compression !== undefined) upscaleFilter.compression = options.compression;
    if (options?.details !== undefined) upscaleFilter.details = options.details;
    if (options?.noise !== undefined) upscaleFilter.noise = options.noise;
    if (options?.halo !== undefined) upscaleFilter.halo = options.halo;
    if (options?.blur !== undefined) upscaleFilter.blur = options.blur;
    if (options?.grain !== undefined) upscaleFilter.grain = options.grain;
    if (options?.grainSize !== undefined) upscaleFilter.grainSize = options.grainSize;
    if (options?.recoverOriginalDetail !== undefined) {
      upscaleFilter.recoverOriginalDetailValue = options.recoverOriginalDetail;
    }

    filters.push(upscaleFilter);

    // FPS interpolation filter (optional)
    const topazFpsModel = options?.topazFpsModel as string | undefined;
    if (topazFpsModel) {
      const targetFps = (options?.targetFps as number) || 60;
      filters.push({
        type: 'interpolation',
        model: topazFpsModel,
        fps: targetFps,
      });
    }

    return filters;
  }

  private async pollStatus(requestId: string): Promise<string> {
    const startTime = Date.now();
    const absoluteDeadline = startTime + 840000; // 14 min hard max

    while (Date.now() < absoluteDeadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get(`/video/${requestId}/status`);
      const data = response.data;
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      logger.debug(`Topaz Direct poll: status=${data?.status}, elapsed=${elapsed}s`);

      if (data?.downloadUrl) {
        return data.downloadUrl;
      }

      if (data?.status === 'failed' || data?.status === 'error') {
        const errMsg = data?.error || data?.message || 'Unknown error';
        throw new Error(`Topaz Direct: processing failed: ${errMsg}`);
      }

      // If still in queue after 10 min, timeout
      if (Date.now() > startTime + VIDEO_POLL_TIMEOUT_MS) {
        throw new Error('Topaz Direct: polling timed out');
      }
    }

    throw new Error('Topaz Direct: polling timed out');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
