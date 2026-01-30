import Replicate from 'replicate';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';
import { logger } from '../utils/logger';

/** Extract a URL string from Replicate output (handles FileOutput objects, arrays, strings) */
function extractUrl(output: unknown): string {
  if (!output) throw new Error('Empty output from Replicate');

  // Array of outputs - take the first
  if (Array.isArray(output)) {
    return extractUrl(output[0]);
  }

  // String URL
  if (typeof output === 'string') {
    return output;
  }

  // FileOutput objects: toString() returns the URL string directly
  if (typeof output === 'object' && output !== null) {
    const str = String(output);
    if (str.startsWith('http')) {
      return str;
    }
  }

  throw new Error(`Cannot extract URL from Replicate output: ${typeof output}`);
}

export class ReplicateProvider extends BaseProvider {
  readonly name = 'replicate';
  private client: Replicate;

  constructor(apiToken?: string) {
    super();
    this.client = new Replicate({
      auth: apiToken || config.ai.replicate.apiToken,
    });
  }

  async generateText(): Promise<TextGenerationResult> {
    throw new Error('Use OpenAI or Anthropic for text generation');
  }

  async generateImage(prompt: string, options?: { model?: string }): Promise<ImageGenerationResult> {
    const modelSlug = options?.model || 'flux-schnell';

    // Official Replicate models: use "owner/model" format (no version hash)
    let modelId: string;
    switch (modelSlug) {
      case 'flux-pro':
        modelId = 'black-forest-labs/flux-1.1-pro';
        break;
      case 'sdxl-lightning':
        modelId = 'bytedance/sdxl-lightning-4step';
        break;
      case 'sdxl':
        modelId = 'stability-ai/sdxl';
        break;
      case 'playground-v2-5':
        modelId = 'playgroundai/playground-v2.5-1024px-aesthetic';
        break;
      case 'flux-schnell':
      default:
        modelId = 'black-forest-labs/flux-schnell';
        break;
    }

    logger.info(`Replicate image: running ${modelId}`);

    const output = await this.client.run(modelId as `${string}/${string}`, {
      input: { prompt },
    });

    const imageUrl = extractUrl(output);
    logger.info(`Replicate image result: ${imageUrl.slice(0, 100)}`);
    return { imageUrl };
  }

  async generateVideo(prompt: string, options?: { model?: string }): Promise<VideoGenerationResult> {
    const modelSlug = options?.model || 'kling';

    // Use actual model IDs from Replicate's catalog
    let modelId: string;
    let input: Record<string, unknown>;

    switch (modelSlug) {
      case 'luma':
        modelId = 'luma/ray-2-720p';
        input = { prompt };
        break;
      case 'animatediff':
        modelId = 'lucataco/animate-diff';
        input = { prompt };
        break;
      case 'zeroscope-v2':
        modelId = 'anotherjesse/zeroscope-v2-xl';
        input = { prompt };
        break;
      case 'kling':
      default:
        modelId = 'kwaivgi/kling-v2.0';
        input = { prompt, duration: 5 };
        break;
    }

    logger.info(`Replicate video: running ${modelId}`);

    const output = await this.client.run(modelId as `${string}/${string}`, {
      input,
    });

    const videoUrl = extractUrl(output);
    logger.info(`Replicate video result: ${videoUrl.slice(0, 100)}`);
    return { videoUrl };
  }

  async generateAudio(text: string, options?: { model?: string }): Promise<AudioGenerationResult> {
    const modelSlug = options?.model || 'bark';
    let modelId: string;
    let input: Record<string, unknown>;

    switch (modelSlug) {
      case 'suno':
        // Community model requires version hash
        modelId = 'suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787';
        input = {
          prompt: text,
          text_temp: 0.7,
          waveform_temp: 0.7,
        };
        break;
      case 'bark':
        // Bark model
        modelId = 'suno-ai/bark';
        input = {
          text,
          text_temp: 0.7,
          waveform_temp: 0.7,
        };
        break;
      case 'xtts-v2':
        // XTTS v2 voice cloning model
        modelId = 'coqui/xtts-v2';
        input = { text };
        break;
      case 'fish-speech':
        // Fish Speech voice cloning model
        modelId = 'fishaudio/fish-speech-1';
        input = { text };
        break;
      default:
        throw new Error('Use ElevenLabs for TTS');
    }

    logger.info(`Replicate audio: running ${modelId}`);

    const output = await this.client.run(
      modelId.includes(':') ? (modelId as `${string}/${string}:${string}`) : (modelId as `${string}/${string}`),
      { input }
    );

    // Handle different output formats
    let audioUrl: string;
    if (typeof output === 'object' && output !== null && 'audio_out' in output) {
      // bark returns {audio_out: FileOutput, prompt_npz: ...}
      const result = output as Record<string, unknown>;
      audioUrl = extractUrl(result.audio_out);
    } else {
      // Other models return URL directly or in array
      audioUrl = extractUrl(output);
    }

    logger.info(`Replicate audio result: ${audioUrl.slice(0, 100)}`);
    return { audioUrl };
  }
}

export const replicateProvider = new ReplicateProvider();
