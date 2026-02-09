import { Router } from 'express';
import { prisma } from '../../config/database';
import { imageSettingsService } from '../../services';
import { logger } from '../../utils/logger';

const router = Router();

function getEffectiveTelegramId(req: any): number | null {
  const authId = req.telegramUser?.id;
  if (authId && authId !== 0) return authId;

  const headerId = req.headers['x-telegram-id'] as string | undefined;
  if (headerId) {
    const parsed = parseInt(headerId, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}

/**
 * GET /api/webapp/image-settings/me
 * Returns all image model settings for the authenticated user.
 */
router.get('/image-settings/me', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);

  logger.info('GET /image-settings/me', { telegramId });

  if (!telegramId) {
    return res.json({ settings: imageSettingsService.getAllDefaults() });
  }

  try {
    const settings = await imageSettingsService.getAllSettingsByTelegramId(BigInt(telegramId));
    return res.json({ settings });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return res.json({ settings: {} });
    }
    logger.error('Failed to get image settings', { error: error?.message || error, telegramId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/image-settings/me/:modelSlug
 * Returns image settings for a specific model.
 */
router.get('/image-settings/me/:modelSlug', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  const { modelSlug } = req.params;

  logger.info('GET /image-settings/me/:modelSlug', { telegramId, modelSlug });

  if (!telegramId) {
    return res.json({ settings: imageSettingsService.getDefaults(modelSlug) });
  }

  try {
    const settings = await imageSettingsService.getModelSettingsByTelegramId(BigInt(telegramId), modelSlug);
    return res.json({ settings });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return res.json({ settings: imageSettingsService.getDefaults(modelSlug) });
    }
    logger.error('Failed to get image model settings', { error: error?.message || error, telegramId, modelSlug });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/webapp/image-settings/me
 * Updates image settings for a specific model.
 * Body: { modelSlug: string, settings: { aspectRatio?, quality?, style? } }
 */
router.put('/image-settings/me', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  const { modelSlug, settings } = req.body;

  logger.info('PUT /image-settings/me', { telegramId, modelSlug });

  if (!telegramId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!modelSlug || !settings) {
    return res.status(400).json({ message: 'Missing modelSlug or settings in body' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await imageSettingsService.updateModelSettings(user.id, modelSlug, settings);
    return res.json({ success: true, settings: updated });
  } catch (error) {
    logger.error('Failed to update image settings', { error, telegramId, modelSlug });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
