import { Router } from 'express';
import { prisma } from '../../config/database';
import { walletService } from '../../services';
import { subscriptionService } from '../../services/SubscriptionService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/user/:telegramId
 * Returns user profile with wallet balances and subscription.
 */
router.get('/user/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        referrals: { select: { id: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const wallet = await walletService.getOrCreateWallet(user.id);
    const subscription = await subscriptionService.getUserSubscription(user.id);
    const planConfig = subscriptionService.getPlanConfig(subscription.tier);

    const requestCount = await prisma.request.count({
      where: { userId: user.id },
    });

    return res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
      },
      wallet: {
        textBalance: wallet.textBalance,
        imageBalance: wallet.imageBalance,
        videoBalance: wallet.videoBalance,
        audioBalance: wallet.audioBalance,
        moneyBalance: wallet.moneyBalance,
        currency: wallet.currency,
      },
      currentPlan: {
        tier: subscription.tier,
        name: planConfig?.name || subscription.tier,
        status: subscription.status,
        expiresAt: subscription.currentPeriodEnd?.toISOString() || null,
        credits: planConfig?.credits ?? { text: 0, image: 0, video: 0, audio: 0 },
        referralBonus: planConfig?.referralBonus ?? 0,
      },
      stats: {
        totalSpent: user.totalSpent,
        totalRequests: requestCount,
      },
    });
  } catch (error) {
    logger.error('Failed to get user profile', { error, telegramId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
