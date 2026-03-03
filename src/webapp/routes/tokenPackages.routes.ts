import { Router } from 'express';
import { tokenPackageService } from '../../services/TokenPackageService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/token-packages
 * Returns all active token packages ordered by sortOrder.
 */
router.get('/token-packages', async (_req, res) => {
  try {
    const packages = await tokenPackageService.getActivePackages();

    return res.json({
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        tokens: pkg.tokens,
        priceRUB: pkg.priceRUB,
        priceStars: pkg.priceStars,
        discountPercent: pkg.discountPercent,
        isPopular: pkg.isPopular,
        sortOrder: pkg.sortOrder,
        description: pkg.description,
      })),
    });
  } catch (error) {
    logger.error('Failed to get token packages', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
