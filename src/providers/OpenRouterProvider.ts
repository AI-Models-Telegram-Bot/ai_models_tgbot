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
 * OpenRouter Provider
 * Supports: Text generation with multiple model support
 */
export class OpenRouterProvider extends EnhancedProvider {
  readonly name = 'openrouter';
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = axios.create({
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://syntx.ai',
        'X-Title': 'Syntx Bot',
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
      logger.info('OpenRouter text: starting generation');

      const response = await this.client.post('/chat/completions', {
        model: (options?.model as string) || 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.data.choices[0].message.content;
      const tokens = response.data.usage?.total_tokens || 0;
      const time = Date.now() - start;
      const cost = (tokens / 1000) * 0.002; // $0.002 per 1k tokens (approximate)
      this.updateStats(true, cost, time);

      logger.info(`OpenRouter text: success (${time}ms, ${tokens} tokens, $${cost})`);
      return { text };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error('OpenRouter text: failed', error.message);
      throw error;
    }
  }

  async generateImage(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ImageGenerationResult> {
    throw new Error('OpenRouter does not support image generation');
  }

  async generateVideo(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    throw new Error('OpenRouter does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    throw new Error('OpenRouter does not support audio generation');
  }
}
