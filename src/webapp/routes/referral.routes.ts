import { Router } from 'express';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import {
  SUBSCRIPTION_PLANS,
  REFERRAL_COMMISSION,
  REFERRAL_INVITEE_BONUS,
  WITHDRAWAL_THRESHOLDS,
  SubscriptionTier,
} from '../../config/subscriptions';
import { referralCommissionService } from '../../services/ReferralCommissionService';

const router = Router();

/**
 * GET /api/webapp/referral/links
 * Returns the current user's referral link, stats, commission mode, and earnings.
 */
router.get('/referral/links', async (req, res) => {
  const telegramUser = (req as any).telegramUser;
  if (!telegramUser?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
      include: {
        referrals: {
          select: { id: true },
        },
        subscription: {
          select: { tier: true },
        },
        wallet: {
          select: { moneyBalance: true, currency: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const botUsername = config.bot.username;
    const userTier = (user.subscription?.tier || 'FREE') as SubscriptionTier;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === userTier);
    const currentTierBonus = plan?.referralBonus ?? 3;

    // Sum signup bonus transactions (legacy)
    const bonusTransactions = await prisma.walletTransaction.aggregate({
      where: {
        userId: user.id,
        transactionType: 'BONUS',
        description: { startsWith: 'Referral bonus' },
      },
      _sum: { amount: true },
    });
    const totalEarned = Math.round(bonusTransactions._sum.amount || 0);

    // Get commission earnings breakdown
    const earnings = await referralCommissionService.getEarnings(user.id);

    const referralUrl = botUsername
      ? `https://t.me/${botUsername}?start=${user.referralCode}`
      : '';

    return res.json({
      referralCode: user.referralCode,
      referralUrl,
      referralMode: user.referralMode,
      commissionRates: REFERRAL_COMMISSION,
      inviteeBonus: REFERRAL_INVITEE_BONUS,
      withdrawalThresholds: WITHDRAWAL_THRESHOLDS,
      walletCurrency: user.wallet?.currency || 'RUB',
      moneyBalance: user.wallet?.moneyBalance || 0,
      stats: {
        totalInvited: user.referrals.length,
        totalEarned,
        currentTierBonus,
        ...earnings,
      },
    });
  } catch (error) {
    logger.error('Failed to get referral links', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/referral/benefits
 * Returns referral program tier benefits.
 */
router.get('/referral/benefits', (_req, res) => {
  const benefits = SUBSCRIPTION_PLANS
    .filter((p) => p.referralBonus > 0)
    .map((p) => ({
      tier: p.tier,
      name: p.name,
      percentage: p.referralBonus,
    }));

  return res.json({ benefits });
});

/**
 * PUT /api/webapp/referral/mode
 * Switch referral commission mode (TOKENS / CASH).
 */
router.put('/referral/mode', async (req, res) => {
  const telegramUser = (req as any).telegramUser;
  if (!telegramUser?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { mode } = req.body;
  if (!['TOKENS', 'CASH'].includes(mode)) {
    return res.status(400).json({ message: 'Invalid mode. Must be TOKENS or CASH' });
  }

  try {
    await prisma.user.update({
      where: { telegramId: BigInt(telegramUser.id) },
      data: { referralMode: mode },
    });
    return res.json({ referralMode: mode });
  } catch (error) {
    logger.error('Failed to update referral mode', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/webapp/referral/withdraw
 * Request a cash withdrawal.
 */
router.post('/referral/withdraw', async (req, res) => {
  const telegramUser = (req as any).telegramUser;
  if (!telegramUser?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { amount, currency } = req.body;
  if (!amount || !currency) {
    return res.status(400).json({ message: 'amount and currency are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const request = await referralCommissionService.requestWithdrawal(user.id, amount, currency);
    return res.json({ withdrawal: request });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

/**
 * GET /api/webapp/referral/withdrawals
 * Get withdrawal history.
 */
router.get('/referral/withdrawals', async (req, res) => {
  const telegramUser = (req as any).telegramUser;
  if (!telegramUser?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const withdrawals = await referralCommissionService.getWithdrawals(user.id);
    return res.json({ withdrawals });
  } catch (error) {
    logger.error('Failed to get withdrawals', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
