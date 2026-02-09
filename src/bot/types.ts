import { Context } from 'telegraf';
import { User } from '@prisma/client';

export type AudioFunction = 'elevenlabs_voice' | 'voice_cloning' | 'suno' | 'sound_generator';

export type ImageFamily = 'flux' | 'dall-e';
export type ImageFunction = 'flux-schnell' | 'flux-kontext' | 'flux-dev' | 'flux-pro' | 'dall-e-2' | 'dall-e-3';

export interface BotContext extends Context {
  user?: User;
  session?: {
    selectedModel?: string;
    awaitingInput?: boolean;
    lastBotMessageId?: number;
    audioFunction?: AudioFunction;
    inAudioMenu?: boolean;
    imageFunction?: ImageFunction;
    imageFamily?: ImageFamily;
    inImageMenu?: boolean;
  };
}
