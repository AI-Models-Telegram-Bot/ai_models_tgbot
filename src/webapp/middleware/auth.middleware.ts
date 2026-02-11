import { Request, Response, NextFunction } from 'express';
import { authService, JwtPayload } from '../../services/AuthService';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

/**
 * Authenticated user shape attached to req.user by the middleware.
 * Works for both JWT (web) and Telegram init data auth.
 */
export interface AuthUser {
  id: string;
  telegramId?: bigint;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      telegramUser?: { id: number; first_name: string; username?: string };
    }
  }
}

/**
 * Unified auth middleware — supports JWT Bearer tokens AND Telegram init data.
 *
 * Priority:
 * 1. Authorization: Bearer <jwt> — web users
 * 2. X-Telegram-Init-Data — Telegram WebApp
 * 3. X-Telegram-Id — fallback for bot buttons
 * 4. Dev mode bypass
 */
export function unifiedAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Try JWT Bearer token
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = authService.verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        telegramId: payload.telegramId ? BigInt(payload.telegramId) : undefined,
      };
      // Also set telegramUser for backward compatibility with existing routes
      if (payload.telegramId) {
        (req as any).telegramUser = {
          id: Number(payload.telegramId),
          first_name: 'WebUser',
          username: 'web_user',
        };
      }
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }
  }

  // 2. Try Telegram init data
  const initData = req.headers['x-telegram-init-data'] as string | undefined;
  if (initData) {
    try {
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      if (userStr) {
        const tgUser = JSON.parse(userStr);
        (req as any).telegramUser = tgUser;

        // Resolve to internal user
        resolveTelegramUser(tgUser.id)
          .then((user) => {
            if (user) {
              req.user = {
                id: user.id,
                telegramId: user.telegramId ?? undefined,
                email: user.email ?? undefined,
              };
            }
            next();
          })
          .catch(() => next());
        return;
      }
      return res.status(401).json({ message: 'No user in init data' });
    } catch (error) {
      logger.warn('Invalid Telegram init data', { error });
      return res.status(401).json({ message: 'Invalid Telegram init data' });
    }
  }

  // 3. Fallback: X-Telegram-Id header (set by bot WebApp buttons)
  const telegramIdHeader = req.headers['x-telegram-id'] as string | undefined;
  if (telegramIdHeader) {
    const parsed = parseInt(telegramIdHeader, 10);
    if (!isNaN(parsed) && parsed > 0) {
      (req as any).telegramUser = {
        id: parsed,
        first_name: 'WebApp',
        username: 'webapp_user',
      };

      resolveTelegramUser(parsed)
        .then((user) => {
          if (user) {
            req.user = {
              id: user.id,
              telegramId: user.telegramId ?? undefined,
              email: user.email ?? undefined,
            };
          }
          next();
        })
        .catch(() => next());
      return;
    }
  }

  // 4. Dev mode bypass
  if (process.env.NODE_ENV !== 'production') {
    (req as any).telegramUser = {
      id: 0,
      first_name: 'Dev',
      username: 'devuser',
    };
    return next();
  }

  return res.status(401).json({ message: 'Authentication required' });
}

/**
 * Legacy middleware kept for backward compatibility.
 * Routes that specifically need Telegram-only auth can still use this.
 */
export const validateTelegramAuth = unifiedAuth;

/**
 * Resolve a Telegram ID to the internal User record.
 */
async function resolveTelegramUser(telegramId: number) {
  try {
    return await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true, telegramId: true, email: true },
    });
  } catch {
    return null;
  }
}
