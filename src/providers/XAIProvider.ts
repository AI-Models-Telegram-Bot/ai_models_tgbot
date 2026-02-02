import OpenAI from 'openai';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';

export class XAIProvider extends BaseProvider {
  readonly name = 'xai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey || config.ai.xai.apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async generateText(prompt: string, options?: { model?: string }): Promise<TextGenerationResult> {
    const model = options?.model || 'grok-3-mini';

    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content || '';
    return { text };
  }

  async generateImage(): Promise<ImageGenerationResult> {
    throw new Error('xAI does not support image generation');
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('xAI does not support video generation');
  }

  async generateAudio(): Promise<AudioGenerationResult> {
    throw new Error('xAI does not support audio generation');
  }
}

export const xaiProvider = new XAIProvider();
