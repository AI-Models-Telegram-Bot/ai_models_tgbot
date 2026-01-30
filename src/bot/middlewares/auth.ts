import { BotContext } from '../types';
import { userService } from '../../services';
import { logger } from '../../utils/logger';

export async function authMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  try {
    if (!ctx.from) {
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    // Extract referral code from start command if present
    let referredByCode: string | undefined;
    if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/start ')) {
      const startParam = ctx.message.text.split(' ')[1];
      if (startParam && startParam.length === 8) {
        referredByCode = startParam;
      }
    }

    const user = await userService.findOrCreate(telegramId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      languageCode: ctx.from.language_code,
      referredByCode,
    });

    if (user.isBlocked) {
      await ctx.reply('Your account has been blocked. Contact support for assistance.');
      return;
    }

    ctx.user = user;
    await next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
}
