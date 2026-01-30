import { ElevenLabsClient } from 'elevenlabs';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';

export class ElevenLabsProvider extends BaseProvider {
  readonly name = 'elevenlabs';
  private client: ElevenLabsClient;

  constructor(apiKey?: string) {
    super();
    this.client = new ElevenLabsClient({
      apiKey: apiKey || config.ai.elevenlabs.apiKey,
    });
  }

  async generateText(): Promise<TextGenerationResult> {
    throw new Error('ElevenLabs does not support text generation');
  }

  async generateImage(): Promise<ImageGenerationResult> {
    throw new Error('ElevenLabs does not support image generation');
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('ElevenLabs does not support video generation');
  }

  async generateAudio(text: string, options?: { voiceId?: string }): Promise<AudioGenerationResult> {
    const voiceId = options?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah

    const audioStream = await this.client.textToSpeech.convert(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    return { audioBuffer };
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
