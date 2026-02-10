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
const VIDEO_POLL_TIMEOUT_MS = 600000; // 10 minutes max for video

/**
 * AI/ML API Provider
 * Supports: Text (OpenAI-compatible), Image (Flux), Video (Kling async), Audio (TTS)
 * Docs: https://docs.aimlapi.com
 */
export class AIMLAPIProvider extends EnhancedProvider {
  readonly name = 'aimlapi';
  private client: AxiosInstance;
  private v2Client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    // v1 client for text, image, audio
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.aimlapi.com/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 120000,
    });
    // v2 client for video (async generation)
    this.v2Client = axios.create({
      baseURL: 'https://api.aimlapi.com/v2',
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
    const start = Date.now();
    try {
      logger.info('AIMLAPI text: starting generation');

      const response = await this.client.post('/chat/completions', {
        model: (options?.model as string) || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: (options?.maxTokens as number) || 2000,
        temperature: (options?.temperature as number) || 0.7,
      });

      const text = response.data.choices[0].message.content;
      const tokens = response.data.usage?.total_tokens || 0;
      const time = Date.now() - start;
      const cost = (tokens / 1000) * 0.0015;
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI text: success (${time}ms, ${tokens} tokens, $${cost})`);
      return { text };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI text: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Image generation via AIMLAPI Flux models
   * POST /v1/images/generations/
   * Response: { data: [{ url: "..." }] }
   */
  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'flux/schnell';
      logger.info(`AIMLAPI image: starting generation with ${model}`);

      const requestBody: Record<string, unknown> = { model, prompt };

      if (model.includes('nano-banana') || model.includes('gemini-3-pro-image')) {
        requestBody.aspect_ratio = (options?.aspectRatio as string) || '1:1';
        requestBody.resolution = (options?.resolution as string) || '1K';
        requestBody.num_images = 1;
      } else {
        requestBody.image_size = (options?.size as string) || (options?.aspectRatio === '1:1' ? 'square' : 'landscape_4_3');
      }

      const response = await this.client.post('/images/generations', requestBody);

      const imageUrl = response.data.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('AIMLAPI image: no URL in response');
      }

      const time = Date.now() - start;
      const cost = model.includes('schnell') ? 0.003 : 0.04;
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI image: success (${time}ms, $${cost})`);
      return { imageUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI image: failed', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video generation via AIMLAPI
   * Kling: POST /v2/generate/video/kling/generation (legacy endpoint)
   * Veo/Sora/etc: POST /v2/video/generations (universal endpoint)
   */
  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const model = (options?.model as string) || 'klingai/v2-master-text-to-video';

    // Kling uses the legacy endpoint
    if (model.startsWith('klingai/')) {
      return this.generateKlingVideo(prompt, options);
    }

    // Veo, Sora, etc. use the universal endpoint
    return this.generateUniversalVideo(prompt, options);
  }

  private async generateKlingVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'klingai/v2-master-text-to-video';
      logger.info(`AIMLAPI video: starting Kling generation with ${model}`);

      const submitResponse = await this.v2Client.post('/generate/video/kling/generation', {
        model,
        prompt,
        duration: (options?.duration as string) || '5',
        aspect_ratio: (options?.aspectRatio as string) || '16:9',
      });

      const generationId = submitResponse.data?.generation_id || submitResponse.data?.id;
      if (!generationId) {
        throw new Error('AIMLAPI video: no generation_id in response');
      }

      logger.info(`AIMLAPI video: task submitted, generation_id=${generationId}`);

      const videoUrl = await this.pollVideoResult(generationId, '/generate/video/kling/generation');

      const time = Date.now() - start;
      const cost = 0.1;
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI video: failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async generateUniversalVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    try {
      const model = (options?.model as string) || 'google/veo-3.1-t2v-fast';
      logger.info(`AIMLAPI video: starting universal generation with ${model}`);

      const body: Record<string, unknown> = { model, prompt };

      // Veo parameters
      if (model.includes('veo')) {
        body.aspect_ratio = (options?.aspectRatio as string) || '16:9';
        body.duration = (options?.duration as number) || 8;
        body.resolution = (options?.resolution as string) || '1080p';
        if (options?.generateAudio !== undefined) {
          body.generate_audio = options.generateAudio;
        }
      }

      // Sora parameters
      if (model.includes('sora')) {
        body.aspect_ratio = (options?.aspectRatio as string) || '16:9';
        body.duration = (options?.duration as number) || 4;
        body.resolution = (options?.resolution as string) || '720p';
      }

      const submitResponse = await this.v2Client.post('/video/generations', body);

      const generationId = submitResponse.data?.id || submitResponse.data?.generation_id;
      if (!generationId) {
        throw new Error('AIMLAPI video: no generation id in response');
      }

      logger.info(`AIMLAPI video: task submitted, id=${generationId}`);

      const videoUrl = await this.pollVideoResult(generationId, '/video/generations');

      const time = Date.now() - start;
      const cost = 0.4;
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI video: success (${time}ms, $${cost})`);
      return { videoUrl };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI video: failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async pollVideoResult(generationId: string, pollPath: string): Promise<string> {
    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await this.sleep(POLL_INTERVAL_MS);

      const response = await this.v2Client.get(pollPath, {
        params: { generation_id: generationId },
      });

      const status = response.data?.status;
      logger.debug(`AIMLAPI video poll: status=${status}, generation_id=${generationId}`);

      if (status === 'completed') {
        const videoUrl =
          response.data?.video?.url ||
          response.data?.output?.video_url ||
          response.data?.result?.video_url;
        if (!videoUrl) {
          throw new Error('AIMLAPI video: completed but no video URL in response');
        }
        return videoUrl;
      }

      if (status === 'failed' || status === 'error') {
        const errorMsg = response.data?.error?.message || response.data?.error || 'Unknown error';
        throw new Error(`AIMLAPI video generation failed: ${errorMsg}`);
      }
    }

    throw new Error('AIMLAPI video: polling timed out after 10 minutes');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const start = Date.now();
    try {
      logger.info('AIMLAPI audio: starting generation');

      // AIMLAPI TTS uses /tts endpoint (not under /v1), with 'text' field
      const response = await axios.post(
        'https://api.aimlapi.com/tts',
        {
          model: (options?.model as string) || '#g1_aura-asteria-en',
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: this.config.timeout || 30000,
        }
      );

      const time = Date.now() - start;
      const cost = text.length * 0.000015;
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI audio: success (${time}ms, $${cost})`);
      return { audioBuffer: Buffer.from(response.data) };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI audio: failed', error.response?.data || error.message);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
