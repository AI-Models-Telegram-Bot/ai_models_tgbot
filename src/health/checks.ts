import { prisma } from '../config/database';
import { getRedis } from '../config/redis';
import { getQueueStats } from '../queues';
import { getKeyPoolStats } from '../config/keyPool';
import { logger } from '../utils/logger';

interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start, error: String(error) };
  }
}

export async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const redis = getRedis();
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start, error: String(error) };
  }
}

export async function getMetrics(): Promise<Record<string, unknown>> {
  let queues = {};
  let apiKeys = {};

  try {
    queues = await getQueueStats();
  } catch (error) {
    logger.warn('Failed to get queue stats', { error });
  }

  try {
    apiKeys = await getKeyPoolStats();
  } catch (error) {
    logger.warn('Failed to get key pool stats', { error });
  }

  return {
    timestamp: new Date().toISOString(),
    instance: process.env.INSTANCE_ID || 'default',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    queues,
    apiKeys,
  };
}
