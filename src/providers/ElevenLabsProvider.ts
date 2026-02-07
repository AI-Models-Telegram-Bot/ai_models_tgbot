import { ElevenLabsClient } from 'elevenlabs';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';
import { logger } from '../utils/logger';

export interface VoiceInfo {
  voiceId: string;
  name: string;
  category: string;
  previewUrl: string | null;
  labels: Record<string, string>;
  description: string | null;
}

export class ElevenLabsProvider extends BaseProvider {
  readonly name = 'elevenlabs';
  private client: ElevenLabsClient;
  private voicesCache: VoiceInfo[] | null = null;
  private voicesCacheTime = 0;
  private static CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

  async generateAudio(text: string, options?: { voiceId?: string; modelId?: string; stability?: number; similarityBoost?: number }): Promise<AudioGenerationResult> {
    const voiceId = options?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
    const modelId = options?.modelId || 'eleven_multilingual_v2';

    const audioStream = await this.client.textToSpeech.convert(voiceId, {
      text,
      model_id: modelId,
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
      },
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    return { audioBuffer };
  }

  async listVoices(options?: { search?: string; category?: string }): Promise<VoiceInfo[]> {
    try {
      // Check cache
      const now = Date.now();
      if (this.voicesCache && (now - this.voicesCacheTime) < ElevenLabsProvider.CACHE_TTL) {
        return this.filterVoices(this.voicesCache, options);
      }

      const response = await this.client.voices.getAll();
      const voices: VoiceInfo[] = (response.voices || []).map((v: any) => ({
        voiceId: v.voice_id,
        name: v.name,
        category: v.category || 'premade',
        previewUrl: v.preview_url || null,
        labels: v.labels || {},
        description: v.description || null,
      }));

      this.voicesCache = voices;
      this.voicesCacheTime = now;

      logger.info(`ElevenLabs: fetched ${voices.length} voices`);
      return this.filterVoices(voices, options);
    } catch (error) {
      logger.error('Failed to list ElevenLabs voices', { error });
      throw error;
    }
  }

  private filterVoices(voices: VoiceInfo[], options?: { search?: string; category?: string }): VoiceInfo[] {
    let filtered = voices;

    if (options?.category && options.category !== 'all') {
      filtered = filtered.filter(v => v.category === options.category);
    }

    if (options?.search) {
      const query = options.search.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        Object.values(v.labels).some(l => l.toLowerCase().includes(query))
      );
    }

    return filtered;
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
