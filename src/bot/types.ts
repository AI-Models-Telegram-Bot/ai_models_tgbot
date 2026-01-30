import { Context } from 'telegraf';
import { User } from '@prisma/client';

export interface BotContext extends Context {
  user?: User;
  session?: {
    selectedModel?: string;
    awaitingInput?: boolean;
    lastBotMessageId?: number;
  };
}
