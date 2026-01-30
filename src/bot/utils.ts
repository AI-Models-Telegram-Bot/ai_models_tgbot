import { BotContext } from './types';
import { logger } from '../utils/logger';

/**
 * Safely delete a message, ignoring errors if message doesn't exist
 */
export async function deleteMessage(ctx: BotContext, messageId?: number): Promise<void> {
  if (!messageId || !ctx.chat) return;

  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
  } catch (error) {
    // Ignore errors - message may already be deleted or too old
    logger.debug('Could not delete message:', error);
  }
}

/**
 * Delete the last tracked bot message from session
 */
export async function deleteLastBotMessage(ctx: BotContext): Promise<void> {
  if (!ctx.session?.lastBotMessageId) return;
  await deleteMessage(ctx, ctx.session.lastBotMessageId);
  ctx.session.lastBotMessageId = undefined;
}

/**
 * Send a message and track it for later deletion
 */
export async function sendTrackedMessage(
  ctx: BotContext,
  text: string,
  options?: Parameters<BotContext['reply']>[1]
): Promise<number> {
  const sent = await ctx.reply(text, options);
  if (ctx.session) {
    ctx.session.lastBotMessageId = sent.message_id;
  }
  return sent.message_id;
}
