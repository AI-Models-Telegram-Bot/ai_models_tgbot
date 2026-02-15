import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
import net from 'net';

// YooKassa webhook source IP ranges (from official docs)
const YOOKASSA_IP_RANGES = [
  { subnet: '185.71.76.0', mask: 27 },
  { subnet: '185.71.77.0', mask: 27 },
  { subnet: '77.75.153.0', mask: 25 },
  { subnet: '77.75.154.128', mask: 25 },
];
const YOOKASSA_SINGLE_IPS = ['77.75.156.11', '77.75.156.35'];

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isYooKassaIP(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  if (YOOKASSA_SINGLE_IPS.includes(ip)) return true;
  const ipLong = ipToLong(ip);
  return YOOKASSA_IP_RANGES.some(({ subnet, mask }) => {
    const subnetLong = ipToLong(subnet);
    const maskBits = (~0 << (32 - mask)) >>> 0;
    return (ipLong & maskBits) === (subnetLong & maskBits);
  });
}

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

  // --- Rate limiting ---

  // Global: 100 req/min per IP (covers all routes)
  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
    skip: (req) => {
      // Skip rate limiting for health probes and payment webhooks
      const path = req.path;
      return path === '/health' || path === '/ready' || path === '/metrics'
        || path === '/api/payment/yookassa/webhook';
    },
  });
  app.use(globalLimiter);

  // Stricter limit for authenticated API endpoints: 30 req/min per user
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    // Use Telegram ID or auth token to identify users; avoid req.ip fallback
    // to prevent ERR_ERL_KEY_GEN_IPV6 validation error
    keyGenerator: (req) => {
      return (req.headers['x-telegram-id'] as string)
        || (req.headers['authorization'] as string)?.slice(-20)
        || 'anonymous';
    },
    message: { error: 'Rate limit exceeded. Please slow down.' },
  });

  // --- Health endpoints (not rate limited by apiLimiter) ---

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

  // --- YooKassa webhook (no auth required, IP-whitelisted) ---
  app.post('/api/payment/yookassa/webhook', async (req, res) => {
    // Validate source IP against YooKassa's known ranges
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '';
    // Normalize IPv6-mapped IPv4 (::ffff:1.2.3.4 → 1.2.3.4)
    const normalizedIp = clientIp.replace(/^::ffff:/, '');

    if (process.env.NODE_ENV === 'production' && !isYooKassaIP(normalizedIp)) {
      logger.warn('YooKassa webhook: rejected request from non-whitelisted IP', { ip: normalizedIp });
      return res.status(403).json({ error: 'Forbidden' });
    }

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

  // --- Web Chat API endpoints (authenticated + rate limited) ---
  app.use('/api/web/chat', apiLimiter, unifiedAuth, chatRoutes);
  logger.info('Web Chat API routes mounted at /api/web/chat/*');

  // --- WebApp API endpoints (authenticated + rate limited) ---
  app.use('/api/webapp', apiLimiter, unifiedAuth, webappRoutes);
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
