import { Router } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/packages
 * Returns all active price items as packages.
 */
router.get('/packages', async (_req, res) => {
  try {
    const priceItems = await prisma.priceItem.findMany({
      where: { isActive: true },
      orderBy: { creditsPerUnit: 'asc' },
    });

    const packages = priceItems.map((item) => ({
      id: item.id,
      name: item.name,
      tier: 'MIDDLE' as const,
      credits: item.creditsPerUnit,
      priceUSD: (item.metadata as any)?.priceUSD ?? 0,
      priceRUB: (item.metadata as any)?.priceRUB ?? 0,
      priceStars: (item.metadata as any)?.priceStars ?? 0,
      features: item.description ? [item.description] : [],
      referralBonus: 10,
      isUnlimited: false,
      unlimitedModels: [],
    }));

    return res.json({ packages });
  } catch (error) {
    logger.error('Failed to get packages', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/packages/:packageId/models
 * Returns models grouped by category for a given package.
 */
router.get('/packages/:packageId/models', async (req, res) => {
  const { packageId } = req.params;

  try {
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const mapModel = (m: typeof models[number]) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      creditCost: m.tokenCost,
      description: m.description,
    });

    return res.json({
      packageId,
      packageName: '',
      models: {
        VIDEO: models.filter((m) => m.category === 'VIDEO').map(mapModel),
        IMAGE: models.filter((m) => m.category === 'IMAGE').map(mapModel),
        AUDIO: models.filter((m) => m.category === 'AUDIO').map(mapModel),
        TEXT: models.filter((m) => m.category === 'TEXT').map(mapModel),
      },
    });
  } catch (error) {
    logger.error('Failed to get package models', { error, packageId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
