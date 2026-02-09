import { Context } from 'telegraf';
import { User } from '@prisma/client';

export type AudioFunction = 'elevenlabs_voice' | 'voice_cloning' | 'suno' | 'sound_generator';

export interface BotContext extends Context {
  user?: User;
  session?: {
    selectedModel?: string;
    awaitingInput?: boolean;
    lastBotMessageId?: number;
    audioFunction?: AudioFunction;
    inAudioMenu?: boolean;
  };
}
