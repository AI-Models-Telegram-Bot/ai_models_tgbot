import { Router } from 'express';
import { prisma } from '../../config/database';
import { walletService } from '../../services';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/user/:telegramId
 * Returns user profile with wallet balances.
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
      currentPlan: null, // TODO: subscription tracking
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
