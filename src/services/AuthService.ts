import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { config } from '../config';
import { generateReferralCode } from '../utils/helpers';
import { walletService } from './WalletService';
import { subscriptionService } from './SubscriptionService';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email?: string;
  telegramId?: string; // stored as string for JSON compat
}

interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class AuthService {
  private googleClient: OAuth2Client | null = null;

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(config.google.clientId);
    }
    return this.googleClient;
  }

  // ── Email/Password Registration ─────────────────────────

  async register(email: string, password: string, name?: string, language?: string): Promise<AuthTokens> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [firstName, ...lastParts] = (name || '').split(' ');
    const lastName = lastParts.join(' ') || undefined;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: firstName || undefined,
        lastName,
        language: language || 'en',
        referralCode: generateReferralCode(),
        authProvider: 'EMAIL',
        tokenBalance: config.tokens.freeOnRegistration,
      },
    });

    // Create wallet, grant signup bonus, and init subscription
    await this.initNewUserWallet(user.id);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, firstName).catch(() => {});

    return this.generateTokens(user.id);
  }

  // ── Email/Password Login ────────────────────────────────

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    return this.generateTokens(user.id);
  }

  // ── Google OAuth ────────────────────────────────────────

  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const client = this.getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Try to find user by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Link google account if found by email but missing googleId
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: picture || user.avatarUrl },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          firstName: given_name,
          lastName: family_name,
          avatarUrl: picture,
          referralCode: generateReferralCode(),
          authProvider: 'GOOGLE',
          emailVerified: true,
          tokenBalance: config.tokens.freeOnRegistration,
        },
      });

      await this.initNewUserWallet(user.id);
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    return this.generateTokens(user.id);
  }

  // ── Telegram Login Widget ───────────────────────────────

  async loginWithTelegram(data: TelegramLoginData): Promise<AuthTokens> {
    // Verify Telegram Login Widget hash
    this.verifyTelegramLogin(data);

    const telegramId = BigInt(data.id);

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // Create new user from Telegram login
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.username,
          avatarUrl: data.photo_url,
          referralCode: generateReferralCode(),
          authProvider: 'TELEGRAM',
          tokenBalance: config.tokens.freeOnRegistration,
        },
      });

      await this.initNewUserWallet(user.id);
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    return this.generateTokens(user.id);
  }

  // ── Account Linking ─────────────────────────────────────

  async linkTelegram(userId: string, telegramData: TelegramLoginData): Promise<void> {
    this.verifyTelegramLogin(telegramData);

    const telegramId = BigInt(telegramData.id);

    // Check if this telegram is already linked to another account
    const existing = await prisma.user.findUnique({ where: { telegramId } });
    if (existing && existing.id !== userId) {
      throw new Error('This Telegram account is already linked to another user');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        username: telegramData.username,
        avatarUrl: telegramData.photo_url,
      },
    });
  }

  // ── Password Reset ──────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // Generate a temporary reset token — store as a refresh token with short expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    await emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.refreshToken.delete({ where: { id: record.id } }),
      // Invalidate all refresh tokens for security
      prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  // ── Token Management ────────────────────────────────────

  async generateTokens(userId: string): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || undefined,
      telegramId: user.telegramId ? user.telegramId.toString() : undefined,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as string,
    } as jwt.SignOptions);

    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenStr,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenStr };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { id: record.id } });

    return this.generateTokens(record.userId);
  }

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  }

  // ── New User Wallet Init ───────────────────────────────

  private async initNewUserWallet(userId: string): Promise<void> {
    await walletService.getOrCreateWallet(userId);
    await walletService.grantSignupBonus(userId, {
      text: config.tokens.freeOnRegistration,
      image: config.tokens.freeOnRegistration,
      video: config.tokens.freeOnRegistration,
      audio: config.tokens.freeOnRegistration,
    });
    await subscriptionService.getUserSubscription(userId);
  }

  // ── Telegram Login Widget Verification ──────────────────

  private verifyTelegramLogin(data: TelegramLoginData): void {
    const { hash, ...rest } = data;

    // Check auth_date is not too old (allow 1 day)
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > 86400) {
      throw new Error('Telegram auth data expired');
    }

    // Create data check string
    const entries = Object.entries(rest)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);
    const dataCheckString = entries.join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(config.bot.token)
      .digest();

    // Compute HMAC
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hmac !== hash) {
      throw new Error('Invalid Telegram login hash');
    }
  }

  // ── Cleanup ─────────────────────────────────────────────

  async cleanupExpiredTokens(): Promise<void> {
    const deleted = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (deleted.count > 0) {
      logger.info(`Cleaned up ${deleted.count} expired refresh tokens`);
    }
  }
}

export const authService = new AuthService();
