/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck — admin panel: suppress query-string type mismatches
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { config } from '../config';
import { AdminRole, Prisma } from '@prisma/client';
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  generateOtp,
  sendOtpViaTelegram,
} from './auth';
import { adminAuth, requireRole, getClientIp } from './middleware';
import { logAudit } from './audit';
import { storeOtp, verifyOtp, setBroadcastCancel, isBroadcastCancelled } from './redis';
import { textQueue, imageQueue, videoQueue, audioQueue } from '../queues';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { getProviderManager } from '../config/providerFactory';

const execFileAsync = promisify(execFile);

const router = Router();

// BigInt serialization helper
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}

// ── Auth Routes (no middleware) ─────────────────────────

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check lockout
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remaining = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} minutes.` });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      const attempts = admin.failedAttempts + 1;
      const update: any = { failedAttempts: attempts };
      if (attempts >= config.admin.maxFailedAttempts) {
        update.lockedUntil = new Date(Date.now() + config.admin.lockoutDuration);
      }
      await prisma.adminUser.update({ where: { id: admin.id }, data: update });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and send OTP
    const code = generateOtp();
    await storeOtp(admin.id, code);
    await sendOtpViaTelegram(admin.telegramId, code);

    return res.json({ requiresVerification: true, adminId: admin.id });
  } catch (err: any) {
    logger.error('Admin login error', { error: err.message });
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/verify', async (req: Request, res: Response) => {
  try {
    const { adminId, code } = req.body;
    if (!adminId || !code) {
      return res.status(400).json({ error: 'Admin ID and code required' });
    }

    const valid = await verifyOtp(adminId, code);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Account not found or inactive' });
    }

    // Reset failed attempts
    const ip = getClientIp(req);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    });

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token: signAdminToken({ adminId: admin.id, sessionId: '' }), // placeholder
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || null,
        expiresAt,
      },
    });

    // Sign real token with session ID
    const token = signAdminToken({ adminId: admin.id, sessionId: session.id });
    await prisma.adminSession.update({ where: { id: session.id }, data: { token } });

    await logAudit(admin.id, 'LOGIN_SUCCESS', { ipAddress: ip });

    return res.json({
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (err: any) {
    logger.error('Admin verify error', { error: err.message });
    return res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/auth/logout', adminAuth, async (req: Request, res: Response) => {
  try {
    await prisma.adminSession.delete({ where: { id: req.adminUser!.sessionId } });
    await logAudit(req.adminUser!.id, 'LOGOUT', { ipAddress: getClientIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/auth/me', adminAuth, async (req: Request, res: Response) => {
  return res.json({
    admin: {
      id: req.adminUser!.id,
      username: req.adminUser!.username,
      role: req.adminUser!.role,
    },
  });
});

// ── All subsequent routes require auth ──────────────────
router.use(adminAuth);

// ── Dashboard Stats ─────────────────────────────────────

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const now = new Date();
    let since: Date;

    switch (range) {
      case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'all': since = new Date(0); break;
      default: since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsers,
      newUsers,
      totalRequests,
      recentRequests,
      totalPayments,
      recentRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.request.count(),
      prisma.request.count({ where: { createdAt: { gte: since } } }),
      prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED', createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.userSubscription.count({ where: { status: 'ACTIVE', tier: { not: 'FREE' } } }),
    ]);

    return res.json({
      totalUsers,
      newUsers,
      totalRequests,
      recentRequests,
      totalPayments,
      recentRevenue: recentRevenue._sum.amount || 0,
      recentPaymentCount: recentRevenue._count,
      activeSubscriptions,
    });
  } catch (err: any) {
    logger.error('Stats error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/stats/charts', async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User growth (daily new users)
    const userGrowth = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Requests by day
    const requestActivity = await prisma.$queryRaw<{ date: string; count: bigint; category: string }[]>`
      SELECT DATE(r.created_at) as date, COUNT(*) as count, m.category
      FROM requests r
      JOIN ai_models m ON r.model_id = m.id
      WHERE r.created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(r.created_at), m.category
      ORDER BY date
    `;

    // Revenue by day
    const revenueByDay = await prisma.$queryRaw<{ date: string; total: number }[]>`
      SELECT DATE(created_at) as date, SUM(amount) as total
      FROM payments
      WHERE status = 'SUCCEEDED' AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return res.json(serializeBigInt({
      userGrowth,
      requestActivity,
      revenueByDay,
    }));
  } catch (err: any) {
    logger.error('Charts error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

router.get('/stats/processing', async (_req: Request, res: Response) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [avgTime, errorRate24h, errorRate7d, byModel] = await Promise.all([
      prisma.request.aggregate({
        where: { status: 'COMPLETED', processingTime: { not: null } },
        _avg: { processingTime: true },
      }),
      prisma.request.groupBy({
        by: ['status'],
        where: { createdAt: { gte: dayAgo } },
        _count: true,
      }),
      prisma.request.groupBy({
        by: ['status'],
        where: { createdAt: { gte: weekAgo } },
        _count: true,
      }),
      prisma.$queryRaw<{ model_slug: string; count: bigint; avg_time: number }[]>`
        SELECT r.model_id, m.name as model_slug, COUNT(*) as count,
               AVG(r.processing_time) as avg_time
        FROM requests r
        JOIN ai_models m ON r.model_id = m.id
        WHERE r.created_at >= ${weekAgo}
        GROUP BY r.model_id, m.name
        ORDER BY count DESC
        LIMIT 20
      `,
    ]);

    const calc24h = errorRate24h.reduce((acc, r) => {
      acc[r.status] = r._count;
      return acc;
    }, {} as Record<string, number>);

    const calc7d = errorRate7d.reduce((acc, r) => {
      acc[r.status] = r._count;
      return acc;
    }, {} as Record<string, number>);

    return res.json(serializeBigInt({
      avgProcessingTime: avgTime._avg.processingTime || 0,
      errorRate24h: {
        total: (calc24h['COMPLETED'] || 0) + (calc24h['FAILED'] || 0),
        failed: calc24h['FAILED'] || 0,
      },
      errorRate7d: {
        total: (calc7d['COMPLETED'] || 0) + (calc7d['FAILED'] || 0),
        failed: calc7d['FAILED'] || 0,
      },
      byModel,
    }));
  } catch (err: any) {
    logger.error('Processing stats error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch processing stats' });
  }
});

router.get('/stats/subscriptions', async (_req: Request, res: Response) => {
  try {
    const [byTier, byStatus, pastDue] = await Promise.all([
      prisma.userSubscription.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.userSubscription.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.userSubscription.count({ where: { status: 'PAST_DUE' } }),
    ]);

    // Calculate MRR from succeeded payments in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mrr = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

    return res.json({
      byTier: byTier.map((t) => ({ tier: t.tier, count: t._count })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      pastDue,
      mrr: mrr._sum.amount || 0,
    });
  } catch (err: any) {
    logger.error('Subscription stats error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

router.get('/system-health', async (_req: Request, res: Response) => {
  try {
    // Queue stats
    const queueStats = await Promise.all(
      [
        { name: 'text', queue: textQueue },
        { name: 'image', queue: imageQueue },
        { name: 'video', queue: videoQueue },
        { name: 'audio', queue: audioQueue },
      ].map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts();
        return { name, ...counts };
      })
    );

    // Redis ping
    let redisPing = false;
    try {
      const pong = await getRedis().ping();
      redisPing = pong === 'PONG';
    } catch {}

    // DB ping
    let dbPing = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbPing = true;
    } catch {}

    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // Uptime
    const uptime = process.uptime();

    return res.json({
      queues: queueStats,
      redis: redisPing,
      database: dbPing,
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
    });
  } catch (err: any) {
    logger.error('System health error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// ── User Management ─────────────────────────────────────

router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || '';
    const plan = req.query.plan as string;
    const status = req.query.status as string;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (plan) {
      where.subscription = { tier: plan as any };
    }

    if (status === 'blocked') {
      where.isBlocked = true;
    } else if (status === 'active') {
      where.isBlocked = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          subscription: { select: { tier: true, status: true } },
          wallet: { select: { tokenBalance: true, moneyBalance: true } },
          _count: { select: { requests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json(serializeBigInt({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (err: any) {
    logger.error('Users list error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: true,
        wallet: true,
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { model: { select: { name: true, category: true } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(serializeBigInt(user));
  } catch (err: any) {
    logger.error('User detail error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/users/:id/ban', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: true },
    });

    await logAudit(req.adminUser!.id, 'BAN_USER', {
      targetType: 'user',
      targetId: req.params.id,
      ipAddress: getClientIp(req),
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:id/unban', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: false },
    });

    await logAudit(req.adminUser!.id, 'UNBAN_USER', {
      targetType: 'user',
      targetId: req.params.id,
      ipAddress: getClientIp(req),
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unban user' });
  }
});

router.post('/users/:id/update-plan', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    if (!tier) {
      return res.status(400).json({ error: 'Tier required' });
    }

    await prisma.userSubscription.upsert({
      where: { userId: req.params.id },
      update: { tier, status: 'ACTIVE' },
      create: {
        userId: req.params.id,
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit(req.adminUser!.id, 'UPDATE_PLAN', {
      targetType: 'user',
      targetId: req.params.id,
      details: { tier },
      ipAddress: getClientIp(req),
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.post('/users/:id/update', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { tokenBalance, moneyBalance } = req.body;
    const updates: any = {};

    if (tokenBalance !== undefined || moneyBalance !== undefined) {
      const walletData: any = {};
      if (tokenBalance !== undefined) walletData.tokenBalance = parseFloat(tokenBalance);
      if (moneyBalance !== undefined) walletData.moneyBalance = parseFloat(moneyBalance);

      await prisma.userWallet.upsert({
        where: { userId: req.params.id },
        update: walletData,
        create: { userId: req.params.id, ...walletData },
      });
    }

    await logAudit(req.adminUser!.id, 'UPDATE_USER', {
      targetType: 'user',
      targetId: req.params.id,
      details: req.body,
      ipAddress: getClientIp(req),
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── Content Management ──────────────────────────────────

router.get('/requests', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const category = req.query.category as string;
    const status = req.query.status as string;
    const search = (req.query.search as string) || '';

    const where: Prisma.RequestWhereInput = {};

    if (category) {
      where.model = { category: category as any };
    }
    if (status) {
      where.status = status as any;
    }
    if (search) {
      where.inputText = { contains: search, mode: 'insensitive' };
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, firstName: true, email: true } },
          model: { select: { name: true, category: true, provider: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return res.json(serializeBigInt({
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (err: any) {
    logger.error('Requests list error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string;

    const where: Prisma.PaymentWhereInput = {};
    if (status) where.status = status as any;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, firstName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json(serializeBigInt({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ── Revenue ─────────────────────────────────────────────

router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    const now = new Date();
    let since: Date;

    switch (period) {
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '90d': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'all': since = new Date(0); break;
      default: since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [dailyRevenue, byPlan, summary] = await Promise.all([
      prisma.$queryRaw<{ date: string; total: number; count: bigint }[]>`
        SELECT DATE(created_at) as date, SUM(amount) as total, COUNT(*) as count
        FROM payments
        WHERE status = 'SUCCEEDED' AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      prisma.$queryRaw<{ tier: string; total: number; count: bigint }[]>`
        SELECT tier, SUM(amount) as total, COUNT(*) as count
        FROM payments
        WHERE status = 'SUCCEEDED' AND created_at >= ${since} AND tier IS NOT NULL
        GROUP BY tier
        ORDER BY total DESC
      `,
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED', createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
    ]);

    return res.json(serializeBigInt({
      dailyRevenue,
      byPlan,
      summary: {
        total: summary._sum.amount || 0,
        count: summary._count,
        avg: summary._avg.amount || 0,
      },
    }));
  } catch (err: any) {
    logger.error('Revenue error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// ── Audit Logs ──────────────────────────────────────────

router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const action = req.query.action as string;

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: { admin: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ── Broadcasts ──────────────────────────────────────────

router.get('/broadcasts', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string;

    const where: Prisma.BroadcastWhereInput = {};
    if (status) where.status = status as any;

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where,
        include: { admin: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.broadcast.count({ where }),
    ]);

    return res.json({ broadcasts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

router.get('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: req.params.id },
      include: { admin: { select: { username: true } } },
    });
    if (!broadcast) return res.status(404).json({ error: 'Not found' });
    return res.json(broadcast);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch broadcast' });
  }
});

router.post('/broadcasts', async (req: Request, res: Response) => {
  try {
    const { name, message, targetType, targetPlans, targetStatuses, targetUserIds, scheduledFor } = req.body;

    const broadcast = await prisma.broadcast.create({
      data: {
        name,
        message,
        targetType: targetType || 'ALL',
        targetPlans: targetPlans || [],
        targetStatuses: targetStatuses || [],
        targetUserIds: targetUserIds || [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        adminId: req.adminUser!.id,
      },
    });

    await logAudit(req.adminUser!.id, 'CREATE_BROADCAST', {
      targetType: 'broadcast',
      targetId: broadcast.id,
      ipAddress: getClientIp(req),
    });

    return res.json(broadcast);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

router.put('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.broadcast.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only edit drafts' });
    }

    const { name, message, targetType, targetPlans, targetStatuses, targetUserIds, scheduledFor } = req.body;
    const broadcast = await prisma.broadcast.update({
      where: { id: req.params.id },
      data: {
        name, message, targetType, targetPlans, targetStatuses, targetUserIds,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    return res.json(broadcast);
  } catch {
    return res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

router.delete('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.broadcast.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete drafts' });
    }
    await prisma.broadcast.delete({ where: { id: req.params.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

router.post('/broadcasts/preview', async (req: Request, res: Response) => {
  try {
    const { targetType, targetPlans, targetStatuses, targetUserIds } = req.body;
    const where = buildBroadcastTargetWhere(targetType, targetPlans, targetStatuses, targetUserIds);
    const count = await prisma.user.count({ where });
    return res.json({ count });
  } catch {
    return res.status(500).json({ error: 'Failed to count recipients' });
  }
});

router.post('/broadcasts/:id/send', async (req: Request, res: Response) => {
  try {
    const broadcastId = req.params.id as string;
    const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast || (broadcast.status !== 'DRAFT' && broadcast.status !== 'SCHEDULED')) {
      return res.status(400).json({ error: 'Broadcast cannot be sent' });
    }

    // Count recipients
    const where = buildBroadcastTargetWhere(
      String(broadcast.targetType), broadcast.targetPlans, broadcast.targetStatuses, broadcast.targetUserIds
    );
    const totalRecipients = await prisma.user.count({ where });

    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: 'SENDING', totalRecipients, startedAt: new Date(), sentCount: 0, failedCount: 0 },
    });

    await logAudit(req.adminUser!.id, 'SEND_BROADCAST', {
      targetType: 'broadcast',
      targetId: broadcast.id,
      details: { totalRecipients },
      ipAddress: getClientIp(req),
    });

    // Start sending in background
    sendBroadcastAsync(broadcast.id, broadcast.message, broadcast.parseMode, where);

    return res.json({ ok: true, totalRecipients });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to start broadcast' });
  }
});

router.post('/broadcasts/:id/cancel', async (req: Request, res: Response) => {
  try {
    const broadcastId = req.params.id as string;
    await setBroadcastCancel(broadcastId);
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'CANCELLED' },
    });

    await logAudit(req.adminUser!.id, 'CANCEL_BROADCAST', {
      targetType: 'broadcast',
      targetId: broadcastId,
      ipAddress: getClientIp(req),
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to cancel broadcast' });
  }
});

// ── System / Logs ───────────────────────────────────────

const SERVICE_CONTAINERS: Record<string, string> = {
  api:    'aibot_dev',
  bot:    'aibot_dev',
  worker: 'aibot_worker',
  webapp: 'aibot_dev',
  admin:  'aibot_dev',
};

function getDockerLogs(container: string, tail: number, stdout: boolean, stderr: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const query = `stdout=${stdout ? 1 : 0}&stderr=${stderr ? 1 : 0}&tail=${tail}&timestamps=0`;
    const req = require('http').request(
      {
        socketPath: '/var/run/docker.sock',
        path: `/containers/${container}/logs?${query}`,
        method: 'GET',
      },
      (res: any) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          // Docker multiplexed log format: 8-byte header per frame
          // Header: byte[0] = stream type, bytes[4-7] = payload size (big-endian)
          const buf = Buffer.concat(chunks);
          const lines: string[] = [];
          let i = 0;
          while (i + 8 <= buf.length) {
            const size = buf.readUInt32BE(i + 4);
            if (i + 8 + size > buf.length) break;
            lines.push(buf.slice(i + 8, i + 8 + size).toString('utf8'));
            i += 8 + size;
          }
          resolve(lines.join(''));
        });
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.end();
  });
}

router.get('/logs/:service', async (req: Request, res: Response) => {
  try {
    const service = req.params.service as string;
    const lines = Math.min(500, parseInt(req.query.lines as string) || 100);
    const isStderr = (req.query.type as string) === 'stderr';

    if (!SERVICE_CONTAINERS[service]) {
      return res.status(400).json({ error: 'Invalid service name' });
    }

    const container = SERVICE_CONTAINERS[service];
    try {
      const output = await getDockerLogs(container, lines, !isStderr, isStderr);
      return res.json({ logs: output || `No logs found for ${service}`, service, type: isStderr ? 'stderr' : 'out' });
    } catch {
      return res.json({ logs: `No logs found for ${service}`, service, type: isStderr ? 'stderr' : 'out' });
    }
  } catch {
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/settings/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (newPassword.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters' });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminUser!.id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    await logAudit(admin.id, 'CHANGE_PASSWORD', { ipAddress: getClientIp(req) });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// ── Provider Stats ──────────────────────────────────────

router.get('/providers/stats', async (_req: Request, res: Response) => {
  try {
    const pm = getProviderManager();
    const stats = pm.getStats();
    const circuitBreakers = pm.getCircuitBreakerStatus();

    const totalProviders = stats.length;
    const totalRequests = stats.reduce((sum, s) => sum + s.requests, 0);
    const totalSuccesses = stats.reduce((sum, s) => sum + s.successes, 0);
    const estimatedTotalSpend = stats.reduce((sum, s) => sum + s.totalCost, 0);
    const activeProviders = stats.filter(
      (s) => s.enabled && !circuitBreakers[s.provider]?.isOpen
    ).length;

    const costByProvider: Record<string, number> = {};
    for (const s of stats) {
      costByProvider[s.provider] = (costByProvider[s.provider] || 0) + s.totalCost;
    }
    const costBreakdown = Object.entries(costByProvider)
      .map(([provider, totalCost]) => ({ provider, totalCost }))
      .filter((e) => e.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    return res.json({
      stats,
      circuitBreakers,
      aggregates: {
        totalProviders,
        totalRequests,
        totalSuccesses,
        totalFailures: totalRequests - totalSuccesses,
        estimatedTotalSpend,
        activeProviders,
        overallSuccessRate: totalRequests > 0
          ? Math.round((totalSuccesses / totalRequests) * 1000) / 10
          : 100,
      },
      costBreakdown,
    });
  } catch (err: any) {
    logger.error('Provider stats error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch provider stats' });
  }
});

router.get('/providers/balances', async (_req: Request, res: Response) => {
  try {
    const balances: Array<{
      provider: string;
      status: 'ok' | 'error';
      error?: string;
      data?: Record<string, unknown>;
    }> = [];

    const results = await Promise.allSettled([
      config.ai.openrouter.apiKey
        ? axios.get('https://openrouter.ai/api/v1/credits', {
            headers: { Authorization: `Bearer ${config.ai.openrouter.apiKey}` },
            timeout: 10_000,
          })
        : Promise.reject(new Error('No API key')),

      config.ai.elevenlabs.apiKey
        ? axios.get('https://api.elevenlabs.io/v1/user/subscription', {
            headers: { 'xi-api-key': config.ai.elevenlabs.apiKey },
            timeout: 10_000,
          })
        : Promise.reject(new Error('No API key')),
    ]);

    // OpenRouter
    if (results[0].status === 'fulfilled') {
      const d = results[0].value.data?.data || results[0].value.data;
      balances.push({
        provider: 'openrouter',
        status: 'ok',
        data: {
          totalCredits: d.total_credits ?? 0,
          totalUsage: d.total_usage ?? 0,
          remaining: (d.total_credits ?? 0) - (d.total_usage ?? 0),
        },
      });
    } else {
      balances.push({
        provider: 'openrouter',
        status: 'error',
        error: results[0].reason?.message || 'Failed to fetch',
      });
    }

    // ElevenLabs
    if (results[1].status === 'fulfilled') {
      const d = results[1].value.data;
      balances.push({
        provider: 'elevenlabs',
        status: 'ok',
        data: {
          characterCount: d.character_count ?? 0,
          characterLimit: d.character_limit ?? 0,
          remaining: (d.character_limit ?? 0) - (d.character_count ?? 0),
          tier: d.tier ?? 'unknown',
        },
      });
    } else {
      balances.push({
        provider: 'elevenlabs',
        status: 'error',
        error: results[1].reason?.message || 'Failed to fetch',
      });
    }

    return res.json({ balances });
  } catch (err: any) {
    logger.error('Provider balances error', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch provider balances' });
  }
});

// ── Helpers ─────────────────────────────────────────────

function buildBroadcastTargetWhere(
  targetType: string,
  targetPlans?: string[],
  targetStatuses?: string[],
  targetUserIds?: string[]
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { isBlocked: false, telegramId: { not: null } };

  switch (targetType) {
    case 'BY_PLAN':
      if (targetPlans?.length) {
        where.subscription = { tier: { in: targetPlans as any[] } };
      }
      break;
    case 'BY_STATUS':
      if (targetStatuses?.length) {
        where.subscription = { status: { in: targetStatuses as any[] } };
      }
      break;
    case 'SELECTED_USERS':
      if (targetUserIds?.length) {
        where.id = { in: targetUserIds };
      }
      break;
  }

  return where;
}

async function sendBroadcastAsync(
  broadcastId: string,
  message: string,
  parseMode: string,
  userWhere: Prisma.UserWhereInput
): Promise<void> {
  let sentCount = 0;
  let failedCount = 0;
  const BATCH_SIZE = 50;
  const DELAY_MS = 40; // ~25 msgs/sec

  try {
    const users = await prisma.user.findMany({
      where: userWhere,
      select: { telegramId: true },
    });

    for (let i = 0; i < users.length; i++) {
      // Check cancellation
      if (i % BATCH_SIZE === 0 && i > 0) {
        const cancelled = await isBroadcastCancelled(broadcastId);
        if (cancelled) break;

        // Update progress
        await prisma.broadcast.update({
          where: { id: broadcastId },
          data: { sentCount, failedCount },
        });
      }

      const user = users[i];
      if (!user.telegramId) continue;

      try {
        await axios.post(
          `https://api.telegram.org/bot${config.bot.token}/sendMessage`,
          {
            chat_id: user.telegramId.toString(),
            text: message,
            parse_mode: parseMode,
          }
        );
        sentCount++;
      } catch (err: any) {
        if (err.response?.status === 429) {
          const retryAfter = err.response?.data?.parameters?.retry_after || 5;
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          // Retry once
          try {
            await axios.post(
              `https://api.telegram.org/bot${config.bot.token}/sendMessage`,
              { chat_id: user.telegramId.toString(), text: message, parse_mode: parseMode }
            );
            sentCount++;
          } catch {
            failedCount++;
          }
        } else {
          failedCount++;
        }
      }

      if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    // Final status
    const cancelled = await isBroadcastCancelled(broadcastId);
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: cancelled ? 'CANCELLED' : 'COMPLETED',
        sentCount,
        failedCount,
        completedAt: new Date(),
      },
    });
  } catch (err: any) {
    logger.error('Broadcast sending failed', { broadcastId, error: err.message });
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'FAILED', sentCount, failedCount, completedAt: new Date() },
    });
  }
}

export default router;
