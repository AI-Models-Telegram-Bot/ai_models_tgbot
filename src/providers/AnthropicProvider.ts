import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey?: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey || config.ai.anthropic.apiKey,
    });
  }

  async generateText(prompt: string, options?: { model?: string }): Promise<TextGenerationResult> {
    const model = options?.model || 'claude-sonnet-4-20250514';

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    return { text };
  }

  async generateImage(): Promise<ImageGenerationResult> {
    throw new Error('Anthropic does not support image generation');
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('Anthropic does not support video generation');
  }

  async generateAudio(): Promise<AudioGenerationResult> {
    throw new Error('Anthropic does not support audio generation');
  }
}

export const anthropicProvider = new AnthropicProvider();
