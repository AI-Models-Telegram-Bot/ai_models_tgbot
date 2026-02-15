import { BotContext } from '../types';
import { userService } from '../../services';
import { authService } from '../../services/AuthService';
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

    // Extract start command parameter
    let referredByCode: string | undefined;
    let webAuthToken: string | undefined;

    if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/start ')) {
      const startParam = ctx.message.text.split(' ')[1];
      if (startParam?.startsWith('auth_')) {
        // Web QR auth deep link
        webAuthToken = startParam.slice(5); // remove "auth_" prefix
      } else if (startParam && startParam.length === 8) {
        // Referral code
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

    // Confirm web auth token if present
    if (webAuthToken) {
      try {
        await authService.confirmWebAuthToken(webAuthToken, user.id);
        ctx.webAuthConfirmed = true;
      } catch (error) {
        logger.warn('Web auth token confirmation failed', { error });
        // Continue anyway — user still gets normal bot experience
      }
    }

    await next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
}
