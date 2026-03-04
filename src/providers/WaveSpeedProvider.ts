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
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 min

/**
 * WaveSpeed AI Provider — Video upscaling
 * Standard: POST /api/v3/wavespeed-ai/video-upscaler
 * Pro:      POST /api/v3/wavespeed-ai/video-upscaler-pro
 * Poll:     GET  /api/v3/predictions/{taskId}/result
 * Auth:     Bearer token
 * Docs:     https://wavespeed.ai/docs
 */
export class WaveSpeedProvider extends EnhancedProvider {
  readonly name = 'wavespeed';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: 'https://api.wavespeed.ai/api/v3',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000,
    });
  }

  async generateText(_prompt: string, _options?: Record<string, unknown>): Promise<TextGenerationResult> {
    throw new Error('WaveSpeed does not support text generation');
  }

  async generateImage(_prompt: string, _options?: Record<string, unknown>): Promise<ImageGenerationResult> {
    throw new Error('WaveSpeed does not support image generation');
  }

  async generateAudio(_text: string, _options?: Record<string, unknown>): Promise<AudioGenerationResult> {
    throw new Error('WaveSpeed does not support audio generation');
  }

  async generateVideo(
    _prompt: string,
    options?: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'wavespeed-ai/video-upscaler';
      const inputVideoUrl = options?.inputVideoUrl as string | undefined;

      if (!inputVideoUrl) {
        throw new Error('WaveSpeed requires a video. Please upload a video first.');
      }

      const targetResolution = (options?.targetResolution as string) || '1080p';
      const isPro = model.includes('pro');

      logger.info(`WaveSpeed: starting ${isPro ? 'Pro' : 'Standard'} upscale to ${targetResolution}`);

      const endpoint = isPro
        ? '/wavespeed-ai/video-upscaler-pro'
        : '/wavespeed-ai/video-upscaler';

      const response = await this.client.post(endpoint, {
        video: inputVideoUrl,
        target_resolution: targetResolution,
      });

      const taskId = response.data?.data?.id;
      if (!taskId) {
        const msg = response.data?.message || response.data?.error || JSON.stringify(response.data).slice(0, 300);
        throw new Error(`WaveSpeed: no task ID in response: ${msg}`);
      }

      logger.info(`WaveSpeed: task created, id=${taskId}`);
      const videoUrl = await this.pollResult(taskId);

      const time = Date.now() - start;
      const cost = isPro ? 0.03 : 0.005; // per-second estimate
      this.updateStats(true, cost, time);
      logger.info(`WaveSpeed: success (${time}ms)`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('WaveSpeed: failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async pollResult(taskId: string): Promise<string> {
    const startTime = Date.now();
    const absoluteDeadline = startTime + 840000; // 14 min hard max
    const softDeadline = startTime + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < absoluteDeadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.client.get(`/predictions/${taskId}/result`);
      const data = response.data?.data;
      const status = data?.status;
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      logger.debug(`WaveSpeed poll: status=${status}, taskId=${taskId}, elapsed=${elapsed}s`);

      if (status === 'completed') {
        const outputs = data?.outputs;
        if (Array.isArray(outputs) && outputs.length > 0) {
          return outputs[0];
        }
        throw new Error('WaveSpeed: task completed but no output URL');
      }

      if (status === 'failed') {
        const errMsg = data?.error || data?.message || 'Unknown error';
        throw new Error(`WaveSpeed: task failed: ${errMsg}`);
      }

      // If still queued after soft deadline, give up
      if (Date.now() > softDeadline && (status === 'created' || status === 'queued')) {
        throw new Error('WaveSpeed: polling timed out (still queued)');
      }
    }

    throw new Error('WaveSpeed: polling timed out');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
