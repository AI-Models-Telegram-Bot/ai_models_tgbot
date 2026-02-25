import OpenAI from 'openai';
import { EnhancedProvider } from '../base/EnhancedProvider';
import { ProviderConfig } from '../base/ProviderConfig';
import {
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  AudioGenerationResult,
} from '../BaseProvider';
import { logger } from '../../utils/logger';

/**
 * Generic adapter for OpenAI-compatible text APIs.
 * Works with: Groq, Together, Google AI (Gemini), OpenRouter, and any other
 * provider that exposes an OpenAI-compatible /chat/completions endpoint.
 */
export class OpenAICompatibleAdapter extends EnhancedProvider {
  readonly name: string;
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.name = config.name;
    if (!config.baseURL) {
      throw new Error(`OpenAICompatibleAdapter requires baseURL for ${config.name}`);
    }
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async generateText(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<TextGenerationResult> {
    const start = Date.now();
    const model = (options?.model as string) || 'default';

    try {
      logger.info(`${this.name} text: generating with model ${model}`);

      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      });

      const text = response.choices[0]?.message?.content || '';
      const time = Date.now() - start;
      const tokens = response.usage?.total_tokens || 0;
      const cost = (tokens / 1000) * 0.002; // rough estimate
      this.updateStats(true, cost, time);

      logger.info(`${this.name} text: success (${time}ms, ${tokens} tokens)`);
      return { text };
    } catch (error: any) {
      const time = Date.now() - start;
      this.updateStats(false, 0, time);
      logger.error(`${this.name} text: failed — ${error.message}`);
      throw error;
    }
  }

  async generateImage(): Promise<ImageGenerationResult> {
    throw new Error(`${this.name} does not support image generation`);
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error(`${this.name} does not support video generation`);
  }

  async generateAudio(): Promise<AudioGenerationResult> {
    throw new Error(`${this.name} does not support audio generation`);
  }
}
