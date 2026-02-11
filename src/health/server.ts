import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { textQueue, imageQueue, videoQueue, audioQueue } from '../queues';
import { checkDatabase, checkRedis, getMetrics } from './checks';
import { logger } from '../utils/logger';
import providerRoutes from '../routes/providers.routes';
import authRoutes from '../routes/auth.routes';
import chatRoutes from '../routes/chat.routes';
import webappRoutes from '../webapp/routes';
import { unifiedAuth } from '../webapp/middleware/auth.middleware';
import { yookassaService } from '../services/YooKassaService';

export function createHealthServer(port: number = 3000): express.Application {
  const app = express();

  // --- CORS & JSON parsing (MUST be before all routes) ---
  const allowedOrigins = [
    'https://vseonix.com',
    'https://webapp.vseonix.com',
    'https://webapp-dev.vseonix.com',
    'https://dev.webapp.vseonix.com',
    'https://web.telegram.org',
  ];
  if (process.env.WEBAPP_URL) {
    allowedOrigins.push(process.env.WEBAPP_URL.replace(/\/$/, ''));
  }
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Telegram-Init-Data', 'X-Telegram-Id', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json());

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

  // --- Auth endpoints (unauthenticated) ---
  app.use('/api/auth', authRoutes);
  logger.info('Auth routes mounted at /api/auth/*');

  // --- YooKassa webhook (no auth required) ---
  app.post('/api/payment/yookassa/webhook', async (req, res) => {
    try {
      await yookassaService.handleWebhook(req.body);
      return res.status(200).json({ status: 'ok' });
    } catch (error: any) {
      logger.error('YooKassa webhook processing error', { error: error.message });
      // Always return 200 to YooKassa to prevent retries on application errors
      return res.status(200).json({ status: 'ok' });
    }
  });
  logger.info('YooKassa webhook mounted at /api/payment/yookassa/webhook');

  // --- Web Chat API endpoints (authenticated) ---
  app.use('/api/web/chat', unifiedAuth, chatRoutes);
  logger.info('Web Chat API routes mounted at /api/web/chat/*');

  // --- WebApp API endpoints (authenticated) ---
  app.use('/api/webapp', unifiedAuth, webappRoutes);
  logger.info('WebApp API routes mounted at /api/webapp/*');

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
