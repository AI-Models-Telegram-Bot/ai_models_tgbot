import { Context } from 'telegraf';
import { User } from '@prisma/client';

export type AudioFunction = 'elevenlabs_voice' | 'voice_cloning' | 'suno' | 'sound_generator';

export type ImageFamily = 'flux' | 'dall-e' | 'midjourney' | 'nano-banana' | 'nano-banana-pro' | 'nano-banana-2' | 'seedream';
export type ImageFunction = 'flux-schnell' | 'flux-kontext' | 'flux-dev' | 'flux-pro' | 'dall-e-2' | 'dall-e-3' | 'midjourney' | 'nano-banana' | 'nano-banana-pro' | 'nano-banana-2' | 'seedream' | 'seedream-4.5';

export type VideoFamily = 'kling' | 'veo' | 'sora' | 'runway' | 'luma' | 'wan' | 'seedance' | 'enhancement';
export type VideoFunction = 'kling' | 'kling-pro' | 'kling-3.0' | 'kling-motion' | 'kling-avatar-pro' | 'kling-avatar' | 'veo-fast' | 'veo' | 'sora' | 'sora-pro' | 'runway' | 'runway-gen4' | 'luma' | 'wan' | 'seedance' | 'seedance-lite' | 'seedance-1-pro' | 'seedance-fast' | 'topaz';

export interface BotContext extends Context {
  user?: User;
  webAuthConfirmed?: boolean;
  session?: {
    selectedModel?: string;
    awaitingInput?: boolean;
    lastBotMessageId?: number;
    audioFunction?: AudioFunction;
    inAudioMenu?: boolean;
    imageFunction?: ImageFunction;
    imageFamily?: ImageFamily;
    inImageMenu?: boolean;
    videoFunction?: VideoFunction;
    videoFamily?: VideoFamily;
    inVideoMenu?: boolean;
    uploadedImageUrls?: string[]; // Stored image URLs for image-to-video generation
    imageUploadMsgIds?: number[]; // Message IDs of "image added" messages to clean up
    uploadedVideoUrl?: string; // Video URL for Kling Motion Control
    uploadedAudioUrl?: string; // Audio URL for Kling AI Avatar
    lastPrompt?: string; // Last prompt used for generation (for auto-reuse on bare photo uploads)
    activeConversationId?: string; // Active multi-turn chat conversation ID
    chatModelPicker?: boolean; // Showing model picker reply keyboard
  };
}
