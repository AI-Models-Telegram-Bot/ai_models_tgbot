import { Router } from 'express';
import { prisma } from '../../config/database';
import { trendService, modelService, requestService } from '../../services';
import { enqueueGeneration } from '../../queues/producer';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import multer from 'multer';

const router = Router();

// Photo upload for trend generation
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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
 * GET /api/webapp/trends
 * List active trends with optional category filter
 */
router.get('/trends', async (req, res) => {
  const { category, limit, offset } = req.query;

  try {
    const [{ trends, total }, categories] = await Promise.all([
      trendService.getActiveTrends({
        categorySlug: category as string,
        limit: Math.min(50, parseInt(limit as string) || 20),
        offset: parseInt(offset as string) || 0,
      }),
      trendService.getCategories(),
    ]);

    return res.json({ trends, categories, total });
  } catch (error: any) {
    logger.error('Failed to fetch trends', { error: error?.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/trends/generations/:id/status
 * Check generation status (MUST be before /trends/:id to avoid conflict)
 */
router.get('/trends/generations/:id/status', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  if (!telegramId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const generation = await trendService.getGenerationStatus(req.params.id, user.id);

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found' });
    }

    return res.json({
      status: generation.status,
      resultVideoUrl: generation.resultVideoUrl,
      error: generation.errorMessage,
    });
  } catch (error: any) {
    logger.error('Failed to check generation status', { error: error?.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/webapp/trends/upload-photo
 * Upload user photo for trend generation (MUST be before /trends/:id)
 */
router.post('/trends/upload-photo', photoUpload.single('photo'), async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  if (!telegramId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No photo uploaded' });
  }

  try {
    // Upload photo to Telegram to get a persistent URL
    const { Telegram } = await import('telegraf');
    const telegram = new Telegram(config.bot.token);

    // Send photo to the user (hidden via delete) to get file_id
    const msg = await telegram.sendPhoto(telegramId, { source: file.buffer }, { disable_notification: true } as any);
    await telegram.deleteMessage(telegramId, msg.message_id).catch(() => {});

    // Get file URL from Telegram
    const photoSizes = msg.photo!;
    const largestPhoto = photoSizes[photoSizes.length - 1];
    const fileLink = await telegram.getFileLink(largestPhoto.file_id);

    return res.json({
      success: true,
      url: fileLink.href,
      fileId: largestPhoto.file_id,
    });
  } catch (error: any) {
    logger.error('Failed to upload trend photo', { error: error?.message });
    return res.status(500).json({ message: 'Failed to upload photo' });
  }
});

/**
 * GET /api/webapp/trends/:id
 * Get single trend detail
 */
router.get('/trends/:id', async (req, res) => {
  try {
    const trend = await trendService.getTrendById(req.params.id);

    if (!trend || !trend.isActive) {
      return res.status(404).json({ message: 'Trend not found' });
    }

    return res.json(trend);
  } catch (error: any) {
    logger.error('Failed to fetch trend', { error: error?.message, id: req.params.id });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/webapp/trends/:id/generate
 * Start trend video generation
 * Body: { photoUrl: string }
 */
router.post('/trends/:id/generate', async (req, res) => {
  const telegramId = getEffectiveTelegramId(req);
  if (!telegramId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { photoUrl } = req.body;
  if (!photoUrl) {
    return res.status(400).json({ message: 'photoUrl is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true, language: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create generation record + deduct tokens
    const { generation, trend } = await trendService.createGeneration(
      user.id,
      req.params.id,
      photoUrl,
    );

    // Update status to PROCESSING
    await trendService.updateGenerationStatus(generation.id, 'PROCESSING');

    // Create a Request record for the queue system
    const model = await modelService.getBySlug(trend.model);
    if (!model) {
      await trendService.updateGenerationStatus(generation.id, 'FAILED', {
        errorMessage: `Model ${trend.model} not found`,
      });
      await trendService.refundGeneration(generation.id);
      return res.status(400).json({ message: `Model ${trend.model} not available` });
    }

    const request = await requestService.create({
      userId: user.id,
      modelId: model.id,
      inputText: trend.promptTemplate,
      tokensCost: trend.tokenCost,
    });

    // Update generation with requestId
    await trendService.updateGenerationStatus(generation.id, 'PROCESSING', {
      requestId: request.id,
    });

    // Send a placeholder processing message to Telegram
    const { Telegram } = await import('telegraf');
    const telegram = new Telegram(config.bot.token);

    const processingText = user.language === 'ru'
      ? '⏳ Создаём видео по тренду...'
      : '⏳ Creating trend video...';

    let processingMsgId = 0;
    try {
      const msg = await telegram.sendMessage(telegramId, processingText);
      processingMsgId = msg.message_id;
    } catch {
      // User may have blocked the bot — continue anyway
    }

    // Build video options from trend settings
    const videoOptions: Record<string, unknown> = {
      aspectRatio: trend.aspectRatio,
      duration: trend.duration,
    };

    // Resolve reference video URL (fall back to trend's own video)
    const rawVideoUrl = trend.referenceVideoUrl || trend.videoUrl;
    const referenceVideoUrl = rawVideoUrl?.startsWith('/')
      ? `${config.webapp.url}${rawVideoUrl}`
      : rawVideoUrl;

    // Enqueue generation job
    await enqueueGeneration({
      requestId: request.id,
      userId: user.id,
      chatId: telegramId,
      modelSlug: trend.model,
      modelCategory: 'VIDEO',
      provider: model.provider,
      input: trend.promptTemplate,
      processingMsgId,
      language: user.language || 'en',
      creditsCost: trend.tokenCost,
      priceItemCode: model.priceItemCode || `trend_${trend.id}`,
      walletCategory: 'VIDEO',
      botToken: config.bot.token,
      modelName: model.name,
      telegramId,
      videoOptions,
      inputImageUrls: [photoUrl],
      ...(referenceVideoUrl && { inputVideoUrl: referenceVideoUrl }),
      settingsApplied: videoOptions,
      source: 'telegram',
      trendGenerationId: generation.id,
    });

    logger.info('Trend generation enqueued', {
      generationId: generation.id,
      trendId: trend.id,
      userId: user.id,
    });

    return res.json({
      success: true,
      generationId: generation.id,
      message: 'Generation started',
    });
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_TOKENS') {
      return res.status(402).json({
        error: 'insufficient_tokens',
        required: error.required,
        balance: error.balance,
      });
    }

    logger.error('Failed to start trend generation', {
      error: error?.message,
      trendId: req.params.id,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
