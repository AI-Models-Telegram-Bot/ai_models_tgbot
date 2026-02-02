import { Router } from 'express';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/referral/links
 * Returns the current user's referral link(s) and stats.
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
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const botUsername = config.bot.token ? '' : 'your_bot'; // Will get actual username from bot info
    const link = {
      id: user.id,
      url: `https://t.me/${botUsername}?start=${user.referralCode}`,
      code: user.referralCode,
      invitedCount: user.referrals.length,
      creditsPurchased: user.referrals.reduce((sum, r) => sum + r.totalSpent, 0),
      createdAt: user.createdAt.toISOString(),
    };

    return res.json({
      links: [link],
      stats: {
        totalInvited: user.referrals.length,
        totalEarned: user.referrals.length * config.tokens.referralBonus,
        currentTierBonus: 10,
      },
      maxLinks: 10,
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
  return res.json({
    benefits: [
      { tier: 'Free', percentage: 5, requirements: 'Default tier', description: '5% bonus from referral purchases' },
      { tier: 'Middle', percentage: 10, requirements: 'Middle subscription', description: '10% bonus from referral purchases' },
      { tier: 'Pro', percentage: 20, requirements: 'Pro subscription', description: '20% bonus from referral purchases' },
      { tier: 'Ultra Pro', percentage: 30, requirements: 'Ultra Pro subscription', description: '30% bonus from referral purchases' },
    ],
  });
});

export default router;
