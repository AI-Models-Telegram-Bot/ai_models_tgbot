import { Context } from 'telegraf';
import { User } from '@prisma/client';

export type AudioFunction = 'elevenlabs_voice' | 'voice_cloning' | 'suno' | 'sound_generator';

export type ImageFamily = 'flux' | 'stable-diffusion' | 'dall-e' | 'ideogram';
export type ImageFunction = 'flux-schnell' | 'sdxl-lightning' | 'flux-kontext' | 'dall-e-2'
  | 'sdxl' | 'playground-v2-5' | 'flux-dev' | 'flux-pro' | 'dall-e-3' | 'ideogram';

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
