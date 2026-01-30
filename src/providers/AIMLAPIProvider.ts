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

/**
 * AI/ML API Provider
 * Supports: Text generation (OpenAI-compatible), Audio generation
 */
export class AIMLAPIProvider extends EnhancedProvider {
  readonly name = 'aimlapi';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.aimlapi.com/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 120000, // 2 minutes default
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
      const cost = (tokens / 1000) * 0.0015; // $0.0015 per 1k tokens
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI text: success (${time}ms, ${tokens} tokens, $${cost})`);
      return { text };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI text: failed', error.message);
      throw error;
    }
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    throw new Error('AIMLAPI does not support image generation');
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('AIMLAPI does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const start = Date.now();
    try {
      logger.info('AIMLAPI audio: starting generation');

      const response = await this.client.post('/audio/speech', {
        model: 'tts-1',
        input: text,
        voice: (options?.voice as string) || 'alloy',
      });

      const time = Date.now() - start;
      const cost = text.length * 0.000015; // $0.000015 per character
      this.updateStats(true, cost, time);

      logger.info(`AIMLAPI audio: success (${time}ms, $${cost})`);
      return { audioUrl: response.data.url };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('AIMLAPI audio: failed', error.message);
      throw error;
    }
  }
}
