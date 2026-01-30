import { BotContext } from '../types';
import { getRedis } from '../../config/redis';
import { logger } from '../../utils/logger';

const SESSION_PREFIX = 'sess:';
const SESSION_TTL = 86400; // 24 hours

export async function sessionMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  if (!ctx.from) {
    return next();
  }

  const sessionId = ctx.from.id;
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    const redis = getRedis();
    const raw = await redis.get(key);
    ctx.session = raw ? JSON.parse(raw) : {};
  } catch (error) {
    logger.warn('Failed to load session from Redis, using empty session', { error });
    ctx.session = {};
  }

  await next();

  // Save session back to Redis after handler completes
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(ctx.session), 'EX', SESSION_TTL);
  } catch (error) {
    logger.warn('Failed to save session to Redis', { error });
  }
}

export async function clearSession(userId: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`${SESSION_PREFIX}${userId}`);
  } catch (error) {
    logger.warn('Failed to clear session from Redis', { error });
  }
}
