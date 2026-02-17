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

  async generateImage(prompt: string, options?: Record<string, unknown>): Promise<ImageGenerationResult> {
    const modelId = (options?.model as string) || 'dall-e-3';
    const dalleSize = (options?.dalleSize as string) || (options?.size as string) || '1024x1024';

    const params: any = {
      model: modelId,
      prompt,
      n: 1,
      size: dalleSize as '1024x1024' | '1792x1024' | '1024x1792',
    };

    // DALL-E 3 supports quality and style
    if (modelId === 'dall-e-3') {
      if (options?.quality) params.quality = options.quality;
      if (options?.style) params.style = options.style;
    }

    const response = await this.client.images.generate(params);

    const imageUrl = response.data?.[0]?.url || '';
    return { imageUrl };
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('OpenAI does not support video generation');
  }

  async generateAudio(
    text: string,
    options?: Record<string, unknown>
  ): Promise<AudioGenerationResult> {
    const model = (options?.model as string) || 'tts-1';
    const voice = (options?.voice as string) || 'alloy';

    const response = await this.client.audio.speech.create({
      model,
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return { audioBuffer: Buffer.from(arrayBuffer) };
  }
}

export const openAIProvider = new OpenAIProvider();
