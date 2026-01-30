import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { textQueue, imageQueue, videoQueue, audioQueue } from '../queues';
import { checkDatabase, checkRedis, getMetrics } from './checks';
import { logger } from '../utils/logger';
import providerRoutes from '../routes/providers.routes';

export function createHealthServer(port: number = 3000): express.Application {
  const app = express();

  // --- Health endpoints ---

  /** Liveness probe - is the process alive? */
  app.get('/health', async (_req, res) => {
    const db = await checkDatabase();
    const redis = await checkRedis();
    const allHealthy = db.ok && redis.ok;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      instance: process.env.INSTANCE_ID || 'default',
      checks: { database: db, redis },
    });
  });

  /** Readiness probe */
  app.get('/ready', async (_req, res) => {
    const db = await checkDatabase();
    const redis = await checkRedis();
    const ready = db.ok && redis.ok;
    res.status(ready ? 200 : 503).json({ ready, database: db.ok, redis: redis.ok });
  });

  /** Detailed metrics */
  app.get('/metrics', async (_req, res) => {
    try {
      const metrics = await getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // --- Provider monitoring endpoints ---
  app.use('/api', providerRoutes);
  logger.info('Provider monitoring routes mounted at /api/providers/*');

  // --- Bull Board Admin UI ---
  try {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [
        new BullAdapter(textQueue),
        new BullAdapter(imageQueue),
        new BullAdapter(videoQueue),
        new BullAdapter(audioQueue),
      ],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
    logger.info('Bull Board mounted at /admin/queues');
  } catch (error) {
    logger.warn('Failed to mount Bull Board', { error });
  }

  // Start listening
  app.listen(port, () => {
    logger.info(`Health server listening on port ${port}`);
  });

  return app;
}
