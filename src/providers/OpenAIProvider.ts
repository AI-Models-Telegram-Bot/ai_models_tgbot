import OpenAI from 'openai';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey || config.ai.openai.apiKey,
    });
  }

  async generateText(prompt: string, options?: { model?: string }): Promise<TextGenerationResult> {
    const model = options?.model || 'gpt-4o-mini';

    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content || '';
    return { text };
  }

  async generateImage(prompt: string, options?: { model?: string; size?: string }): Promise<ImageGenerationResult> {
    const response = await this.client.images.generate({
      model: options?.model || 'dall-e-3',
      prompt,
      n: 1,
      size: (options?.size as '1024x1024' | '1792x1024' | '1024x1792') || '1024x1024',
    });

    const imageUrl = response.data?.[0]?.url || '';
    return { imageUrl };
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('OpenAI does not support video generation');
  }

  async generateAudio(): Promise<AudioGenerationResult> {
    throw new Error('Use ElevenLabs for audio generation');
  }
}

export const openAIProvider = new OpenAIProvider();
