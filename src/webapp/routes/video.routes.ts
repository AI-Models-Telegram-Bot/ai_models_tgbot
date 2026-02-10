import { Router } from 'express';
import { prisma } from '../../config/database';
import { videoSettingsService } from '../../services';
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
 * GET /api/webapp/video-settings/me
 * Returns all video model settings for the authenticated user.
 */
router.get('/video-settings/me', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);

  logger.info('GET /video-settings/me', { telegramId });

  if (!telegramId) {
    return res.json({ settings: videoSettingsService.getAllDefaults() });
  }

  try {
    const settings = await videoSettingsService.getAllSettingsByTelegramId(BigInt(telegramId));
    return res.json({ settings });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return res.json({ settings: {} });
    }
    logger.error('Failed to get video settings', { error: error?.message || error, telegramId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/video-settings/me/:modelSlug
 * Returns video settings for a specific model.
 */
router.get('/video-settings/me/:modelSlug', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  const { modelSlug } = req.params;

  logger.info('GET /video-settings/me/:modelSlug', { telegramId, modelSlug });

  if (!telegramId) {
    return res.json({ settings: videoSettingsService.getDefaults(modelSlug) });
  }

  try {
    const settings = await videoSettingsService.getModelSettingsByTelegramId(BigInt(telegramId), modelSlug);
    return res.json({ settings });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return res.json({ settings: videoSettingsService.getDefaults(modelSlug) });
    }
    logger.error('Failed to get video model settings', { error: error?.message || error, telegramId, modelSlug });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/webapp/video-settings/me
 * Updates video settings for a specific model.
 * Body: { modelSlug: string, settings: { aspectRatio?, duration?, resolution?, generateAudio? } }
 */
router.put('/video-settings/me', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  const { modelSlug, settings } = req.body;

  logger.info('PUT /video-settings/me', { telegramId, modelSlug });

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

    const updated = await videoSettingsService.updateModelSettings(user.id, modelSlug, settings);
    return res.json({ success: true, settings: updated });
  } catch (error) {
    logger.error('Failed to update video settings', { error, telegramId, modelSlug });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
