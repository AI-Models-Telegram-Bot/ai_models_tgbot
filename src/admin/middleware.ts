import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyAdminToken } from './auth';
import { AdminRole } from '@prisma/client';

export interface AdminAuthUser {
  id: string;
  username: string;
  role: AdminRole;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminAuthUser;
    }
  }
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  prisma.adminSession
    .findUnique({
      where: { id: payload.sessionId },
      include: { admin: { select: { id: true, username: true, role: true, isActive: true } } },
    })
    .then((session) => {
      if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
        res.status(401).json({ error: 'Session expired or invalid' });
        return;
      }

      // Update lastUsedAt in background
      prisma.adminSession.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      req.adminUser = {
        id: session.admin.id,
        username: session.admin.username,
        role: session.admin.role,
        sessionId: session.id,
      };
      next();
    })
    .catch(() => {
      res.status(500).json({ error: 'Authentication check failed' });
    });
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.adminUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}
