export interface TextGenerationResult {
  text: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
}

export interface AudioGenerationResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
}

export type GenerationResult =
  | TextGenerationResult
  | ImageGenerationResult
  | VideoGenerationResult
  | AudioGenerationResult;

export abstract class BaseProvider {
  abstract readonly name: string;

  abstract generateText(prompt: string, options?: Record<string, unknown>): Promise<TextGenerationResult>;
  abstract generateImage(prompt: string, options?: Record<string, unknown>): Promise<ImageGenerationResult>;
  abstract generateVideo(prompt: string, options?: Record<string, unknown>): Promise<VideoGenerationResult>;
  abstract generateAudio(text: string, options?: Record<string, unknown>): Promise<AudioGenerationResult>;
}
