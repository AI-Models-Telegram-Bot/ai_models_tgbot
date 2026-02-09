import { Router } from 'express';
import { prisma } from '../../config/database';
import { audioSettingsService } from '../../services';
import { elevenLabsProvider } from '../../providers/ElevenLabsProvider';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/webapp/audio-settings/:telegramId
 * Returns all audio settings for user (creates defaults if needed).
 */
router.get('/audio-settings/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const settings = await audioSettingsService.getByTelegramId(BigInt(telegramId));

    return res.json({
      elevenLabsSettings: settings.elevenLabsSettings || audioSettingsService.getDefaults().elevenLabsSettings,
      sunoSettings: settings.sunoSettings || audioSettingsService.getDefaults().sunoSettings,
      soundGenSettings: settings.soundGenSettings || audioSettingsService.getDefaults().soundGenSettings,
      voiceCloningSettings: settings.voiceCloningSettings || audioSettingsService.getDefaults().voiceCloningSettings,
    });
  } catch (error: any) {
    // If user not found, return defaults instead of 500
    if (error?.message?.includes('not found')) {
      return res.json(audioSettingsService.getDefaults());
    }
    logger.error('Failed to get audio settings', { error: error?.message || error, telegramId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/webapp/audio-settings/:telegramId
 * Body: { function: 'elevenlabs' | 'suno' | 'soundGen', settings: {...} }
 */
router.put('/audio-settings/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  const { function: func, settings } = req.body;

  if (!func || !settings) {
    return res.status(400).json({ message: 'Missing function or settings in body' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updated;
    switch (func) {
      case 'elevenlabs':
        updated = await audioSettingsService.updateElevenLabs(user.id, settings);
        break;
      case 'suno':
        updated = await audioSettingsService.updateSuno(user.id, settings);
        break;
      case 'soundGen':
        updated = await audioSettingsService.updateSoundGen(user.id, settings);
        break;
      default:
        return res.status(400).json({ message: `Unknown function: ${func}` });
    }

    return res.json({ success: true, settings: updated });
  } catch (error) {
    logger.error('Failed to update audio settings', { error, telegramId, func });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/audio/voices
 * Proxy ElevenLabs voice library.
 * Query: ?search=&category=premade|cloned|all
 */
router.get('/audio/voices', async (req, res) => {
  const { search, category } = req.query;

  try {
    logger.info('Fetching ElevenLabs voices', { search, category });
    const voices = await elevenLabsProvider.listVoices({
      search: search as string | undefined,
      category: category as string | undefined,
    });

    logger.info(`Returning ${voices.length} voices`);
    return res.json({ voices, total: voices.length });
  } catch (error) {
    logger.error('Failed to list voices', { error });
    return res.status(500).json({ message: 'Failed to fetch voices' });
  }
});

export default router;
