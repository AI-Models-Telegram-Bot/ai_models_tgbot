import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

/**
 * Validates Telegram WebApp init data.
 * Attaches the parsed Telegram user to req.telegramUser.
 *
 * In production, use @telegram-apps/init-data-node to verify the HMAC signature.
 * For now we parse the user field from the init data query string.
 */
export function validateTelegramAuth(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string | undefined;

  if (!initData) {
    // Fallback: check X-Telegram-Id header (set by bot WebApp buttons via ?tgid= URL param)
    const telegramIdHeader = req.headers['x-telegram-id'] as string | undefined;
    if (telegramIdHeader) {
      const parsed = parseInt(telegramIdHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        (req as any).telegramUser = {
          id: parsed,
          first_name: 'WebApp',
          username: 'webapp_user',
        };
        return next();
      }
    }

    // Allow unauthenticated requests in development
    if (process.env.NODE_ENV !== 'production') {
      (req as any).telegramUser = {
        id: 0,
        first_name: 'Dev',
        username: 'devuser',
      };
      return next();
    }
    return res.status(401).json({ message: 'Missing Telegram init data' });
  }

  try {
    // TODO: Replace with proper HMAC validation:
    // import { validate, parse } from '@telegram-apps/init-data-node';
    // validate(initData, process.env.BOT_TOKEN!, { expiresIn: 3600 });
    // const parsed = parse(initData);
    // (req as any).telegramUser = parsed.user;

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (userStr) {
      (req as any).telegramUser = JSON.parse(userStr);
    } else {
      return res.status(401).json({ message: 'No user in init data' });
    }

    next();
  } catch (error) {
    logger.warn('Invalid Telegram init data', { error });
    return res.status(401).json({ message: 'Invalid Telegram init data' });
  }
}
