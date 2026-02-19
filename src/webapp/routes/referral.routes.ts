import { Router } from 'express';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '../../config/subscriptions';

const router = Router();

/**
 * GET /api/webapp/referral/links
 * Returns the current user's single referral link and stats.
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
          select: { id: true, totalSpent: true },
        },
        subscription: {
          select: { tier: true },
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

    // Sum actual earned credits from wallet BONUS transactions with referral description
    const bonusTransactions = await prisma.walletTransaction.aggregate({
      where: {
        userId: user.id,
        transactionType: 'BONUS',
        description: { startsWith: 'Referral bonus' },
      },
      _sum: { amount: true },
    });

    const totalEarned = Math.round(bonusTransactions._sum.amount || 0);

    const referralUrl = botUsername
      ? `https://t.me/${botUsername}?start=${user.referralCode}`
      : '';

    return res.json({
      referralCode: user.referralCode,
      referralUrl,
      stats: {
        totalInvited: user.referrals.length,
        totalEarned,
        currentTierBonus,
      },
    });
  } catch (error) {
    logger.error('Failed to get referral links', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/referral/benefits
 * Returns referral program tier benefits derived from subscription plans.
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

export default router;
