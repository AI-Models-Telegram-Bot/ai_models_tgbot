import { Router, Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { unifiedAuth } from '../webapp/middleware/auth.middleware';
import { prisma } from '../config/database';
import { walletService } from '../services';
import { subscriptionService } from '../services/SubscriptionService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/register
 * Register with email/password.
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, language } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const tokens = await authService.register(email.toLowerCase().trim(), password, name, language);
    return res.status(201).json(tokens);
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ message: error.message });
    }
    logger.error('Registration failed', { error: error.message });
    return res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const tokens = await authService.login(email.toLowerCase().trim(), password);
    return res.json(tokens);
  } catch (error: any) {
    if (error.message === 'Invalid email or password' || error.message === 'Account is blocked') {
      return res.status(401).json({ message: error.message });
    }
    logger.error('Login failed', { error: error.message });
    return res.status(500).json({ message: 'Login failed' });
  }
});

/**
 * POST /api/auth/google
 * Login/register with Google ID token.
 */
router.post('/google', async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Google ID token is required' });
  }

  try {
    const tokens = await authService.loginWithGoogle(idToken);
    return res.json(tokens);
  } catch (error: any) {
    logger.error('Google auth failed', { error: error.message });
    return res.status(401).json({ message: 'Google authentication failed' });
  }
});

/**
 * POST /api/auth/telegram
 * Login/register with Telegram Login Widget data.
 */
router.post('/telegram', async (req: Request, res: Response) => {
  const telegramData = req.body;

  if (!telegramData?.id || !telegramData?.hash) {
    return res.status(400).json({ message: 'Invalid Telegram login data' });
  }

  try {
    const tokens = await authService.loginWithTelegram(telegramData);
    return res.json(tokens);
  } catch (error: any) {
    logger.error('Telegram auth failed', { error: error.message });
    return res.status(401).json({ message: 'Telegram authentication failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const tokens = await authService.refreshToken(refreshToken);
    return res.json(tokens);
  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate refresh token.
 */
router.post('/logout', unifiedAuth, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  return res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * Get current user profile.
 */
router.get('/me', unifiedAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        language: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      ...user,
      telegramId: user.telegramId?.toString(),
    });
  } catch (error: any) {
    logger.error('Failed to get user profile', { error: error.message });
    return res.status(500).json({ message: 'Failed to get profile' });
  }
});

/**
 * GET /api/auth/profile
 * Full profile with wallet, subscription, stats (same shape as /api/webapp/user/:telegramId).
 */
router.get('/profile', unifiedAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const wallet = await walletService.getOrCreateWallet(user.id);

    const requestCount = await prisma.request.count({
      where: { userId: user.id },
    });

    let currentPlan = null;
    try {
      const subscription = await subscriptionService.getUserSubscription(user.id);
      const planConfig = subscriptionService.getPlanConfig(subscription.tier);
      currentPlan = {
        tier: subscription.tier,
        name: planConfig?.name || subscription.tier,
        status: subscription.status,
        expiresAt: subscription.currentPeriodEnd?.toISOString() || null,
        tokens: planConfig?.tokens ?? 0,
        referralBonus: planConfig?.referralBonus ?? 0,
      };
    } catch (subError) {
      logger.warn('Failed to load subscription data', { error: subError });
    }

    return res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId?.toString() ?? '',
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      wallet: {
        tokenBalance: wallet.tokenBalance,
        moneyBalance: wallet.moneyBalance,
        currency: wallet.currency,
      },
      currentPlan,
      stats: {
        totalSpent: user.totalSpent,
        totalRequests: requestCount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get profile', { error: error.message });
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

/**
 * POST /api/auth/link-telegram
 * Link a Telegram account to the current web user.
 */
router.post('/link-telegram', unifiedAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const telegramData = req.body;

  if (!telegramData?.id || !telegramData?.hash) {
    return res.status(400).json({ message: 'Invalid Telegram login data' });
  }

  try {
    await authService.linkTelegram(req.user.id, telegramData);
    return res.json({ message: 'Telegram account linked successfully' });
  } catch (error: any) {
    logger.error('Link Telegram failed', { error: error.message });
    return res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/auth/telegram-qr/create
 * Create a web auth token for QR code login.
 */
router.post('/telegram-qr/create', async (_req: Request, res: Response) => {
  try {
    const result = await authService.createWebAuthToken();
    return res.json(result);
  } catch (error: any) {
    logger.error('Create web auth token failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to create auth token' });
  }
});

/**
 * GET /api/auth/telegram-qr/check
 * Check web auth token status (polled by frontend).
 */
router.get('/telegram-qr/check', async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const result = await authService.checkWebAuthToken(token);
    return res.json(result);
  } catch (error: any) {
    logger.error('Check web auth token failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to check auth token' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email.
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    await authService.forgotPassword(email.toLowerCase().trim());
    // Always return success to not reveal if email exists
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error: any) {
    logger.error('Forgot password failed', { error: error.message });
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token.
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    await authService.resetPassword(token, password);
    return res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Invalid or expired reset token' });
  }
});

export default router;
