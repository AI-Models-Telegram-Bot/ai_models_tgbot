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

  async generateImage(prompt: string, options?: Record<string, unknown>): Promise<ImageGenerationResult> {
    const modelSlug = (options?.model as string) || 'flux-schnell';

    // Official Replicate models: use "owner/model" format (no version hash)
    let modelId: string;
    switch (modelSlug) {
      case 'flux-pro':
        modelId = 'black-forest-labs/flux-1.1-pro';
        break;
      case 'flux-dev':
        modelId = 'black-forest-labs/flux-dev';
        break;
      case 'flux-schnell':
      default:
        modelId = 'black-forest-labs/flux-schnell';
        break;
    }

    logger.info(`Replicate image: running ${modelId}`);

    const input: Record<string, unknown> = { prompt };

    // Flux models: pass aspect_ratio (validated against Replicate's supported values)
    const SUPPORTED_RATIOS = new Set(['1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3']);
    const ar = options?.aspectRatio as string;
    input.aspect_ratio = (ar && SUPPORTED_RATIOS.has(ar)) ? ar : '1:1';

    const output = await this.client.run(modelId as `${string}/${string}`, { input });

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
      case 'wan':
        modelId = 'wan-video/wan2.1-t2v-720p';
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

  async generateAudio(text: string, options?: Record<string, unknown>): Promise<AudioGenerationResult> {
    const modelSlug = (options?.model as string) || 'bark';
    let modelId: string;
    let input: Record<string, unknown>;

    switch (modelSlug) {
      case 'bark':
        modelId = 'suno-ai/bark';
        input = {
          prompt: text,
          text_temp: (options?.textTemp as number) ?? 0.7,
          waveform_temp: (options?.waveformTemp as number) ?? 0.7,
        };
        break;
      case 'xtts-v2':
        modelId = 'lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e';
        input = {
          text,
          language: (options?.language as string) || 'en',
          ...(options?.speaker ? { speaker: options.speaker } : {}),
        };
        break;
      case 'suno': {
        modelId = 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';
        const sunoStyle = options?.sunoStyle as string;
        const prompt = sunoStyle ? `${text}, style: ${sunoStyle}` : text;
        input = {
          prompt,
          model_version: 'stereo-melody-large',
          duration: 15,
          output_format: 'mp3',
        };
        break;
      }
      case 'fish-speech':
        modelId = 'fishaudio/fish-speech-1';
        input = { text };
        break;
      default:
        modelId = 'suno-ai/bark';
        input = {
          prompt: text,
          text_temp: 0.7,
          waveform_temp: 0.7,
        };
        break;
    }

    logger.info(`Replicate audio: running ${modelId}`);

    const output = await this.client.run(
      modelId.includes(':') ? (modelId as `${string}/${string}:${string}`) : (modelId as `${string}/${string}`),
      { input }
    );

    // Log raw output for debugging
    logger.info(`Replicate audio raw output type: ${typeof output}, keys: ${typeof output === 'object' && output !== null ? Object.keys(output as any).join(',') : 'N/A'}`);

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
