import { Context } from 'telegraf';
import { User } from '@prisma/client';

export type AudioFunction = 'elevenlabs_voice' | 'voice_cloning' | 'suno' | 'sound_generator';

export type ImageFamily = 'flux' | 'dall-e' | 'midjourney' | 'google-ai';
export type ImageFunction = 'flux-schnell' | 'flux-kontext' | 'flux-dev' | 'flux-pro' | 'dall-e-2' | 'dall-e-3' | 'midjourney' | 'nano-banana-pro';

export type VideoFamily = 'kling' | 'veo' | 'sora' | 'runway' | 'luma' | 'wan' | 'seedance';
export type VideoFunction = 'kling' | 'kling-pro' | 'veo-fast' | 'veo' | 'sora' | 'runway' | 'luma' | 'wan' | 'seedance';

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
  };
}
