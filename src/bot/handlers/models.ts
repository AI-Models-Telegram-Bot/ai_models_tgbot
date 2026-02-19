import { Markup } from 'telegraf';
import { WalletCategory } from '@prisma/client';
import { BotContext } from '../types';
import { getCancelKeyboard, getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, requestService, walletService, modelAccessService } from '../../services';
import { getAudioOptionsForFunction } from './audio';
import { getImageOptionsForFunction } from './image';
import { getVideoOptionsForFunction } from './video';
import { logger } from '../../utils/logger';
import { sendTrackedMessage } from '../utils';
import { Language, t, getLocale } from '../../locales';
import { enqueueGeneration } from '../../queues/producer';
import { config } from '../../config';
import { resizeImageForAspectRatio } from '../../utils/imageResize';
import { calculateDynamicCost } from '../../utils/videoPricing';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  return `${amount} credits`;
}

/** Map ModelCategory to WalletCategory */
function toWalletCategory(category: string): WalletCategory {
  const map: Record<string, WalletCategory> = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
  };
  return map[category] || 'TEXT';
}

export async function handleModelSelection(ctx: BotContext, modelSlug: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);

  const model = await modelService.getBySlug(modelSlug);
  if (!model) {
    await sendTrackedMessage(ctx, l.messages.errorModelNotFound);
    return;
  }

  const walletCat = toWalletCategory(model.category);
  const creditsCost = model.tokenCost;

  // Check subscription-based model access
  const access = await modelAccessService.canUseModel(ctx.user.id, model.slug, walletCat);
  if (!access.allowed) {
    await sendTrackedMessage(ctx,
      `🔒 ${access.reason}`,
      { parse_mode: 'HTML', ...getMainKeyboard(lang) }
    );
    if (config.webapp.url) {
      const upgradeText = lang === 'ru' ? '⬆️ Улучшить тариф' : '⬆️ Upgrade Plan';
      await ctx.reply(lang === 'ru' ? 'Обновите подписку для доступа к этой модели.' : 'Upgrade your subscription to access this model.', {
        ...Markup.inlineKeyboard([
          Markup.button.webApp(upgradeText, config.webapp.url),
        ]),
      });
    }
    return;
  }

  // Skip balance check if user has unlimited access to this model
  if (!access.unlimited) {
    const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, walletCat, creditsCost);
    if (!hasBalance) {
      const currentBalance = await walletService.getBalance(ctx.user.id, walletCat);
      const message = t(lang, 'messages.errorInsufficientBalance', {
        required: formatCredits(creditsCost),
        current: formatCredits(currentBalance),
      });
      await sendTrackedMessage(ctx, message, getMainKeyboard(lang));
      return;
    }
  }

  ctx.session.selectedModel = modelSlug;
  ctx.session.awaitingInput = true;

  const example = l.promptExamples[model.category as keyof typeof l.promptExamples] || '';

  const message = t(lang, 'messages.modelSelected', {
    modelName: model.name,
    tokenCost: formatCredits(creditsCost),
    example,
  });

  await sendTrackedMessage(ctx, message, { parse_mode: 'HTML', ...getCancelKeyboard(lang) });
}

/**
 * Handle photo uploads for image-to-video generation.
 * Stores the image URL in session and either enqueues immediately (if caption provided)
 * or waits for a text prompt.
 */
export async function handlePhotoInput(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) return;
  if (!ctx.message || !('photo' in ctx.message) || !ctx.message.photo) return;

  const lang = getLang(ctx);

  // Image models that support reference image input
  const IMAGE_MODELS_WITH_IMAGE_INPUT = ['flux-kontext', 'nano-banana-pro', 'midjourney', 'seedream'];
  // Text-only video models — no image-to-video support
  const TEXT_ONLY_VIDEO_MODELS = ['veo', 'veo-fast'];

  const isVideoModel = !!ctx.session.videoFunction;
  const isImageModelWithInput = !!ctx.session.imageFunction &&
    IMAGE_MODELS_WITH_IMAGE_INPUT.includes(ctx.session.imageFunction);

  // Reject photo uploads for non-video, non-image-editing models
  if (!isVideoModel && !isImageModelWithInput) {
    if (ctx.session.imageFunction) {
      // Image model that doesn't support reference images
      const msg = lang === 'ru'
        ? '⚠️ Эта модель поддерживает только текстовые запросы — референсные изображения не поддерживаются. Отправьте ✍️ текстовый запрос.'
        : '⚠️ This model is text-only — reference images are not supported. Please send ✍️ a text prompt.';
      await ctx.reply(msg);
    } else {
      const msg = lang === 'ru'
        ? 'Загрузка изображений поддерживается только для видео и некоторых моделей изображений. Отправьте текстовый запрос.'
        : 'Image uploads are only supported for video and select image models. Please send a text prompt.';
      await ctx.reply(msg);
    }
    return;
  }

  // Text-only video models
  if (isVideoModel && TEXT_ONLY_VIDEO_MODELS.includes(ctx.session.videoFunction!)) {
    const modelName = ctx.session.videoFunction === 'veo' ? 'Veo Quality' : 'Veo Fast';
    const msg = lang === 'ru'
      ? `⚠️ ${modelName} поддерживает только текстовые запросы — референсные изображения не применяются. Отправьте ✍️ текстовый запрос.`
      : `⚠️ ${modelName} is text-only — reference images are not supported. Please send ✍️ a text prompt.`;
    await ctx.reply(msg);
    return;
  }

  // For image editing models, limit to 1 reference image
  if (isImageModelWithInput && ctx.session.uploadedImageUrls?.length) {
    const msg = lang === 'ru'
      ? '⚠️ Для редактирования поддерживается только 1 изображение. Отправьте ✍️ текстовый запрос для редактирования загруженного изображения.'
      : '⚠️ Only 1 reference image is supported for editing. Send ✍️ a text prompt to edit the uploaded image.';
    await ctx.reply(msg);
    return;
  }

  // Get the largest photo (last element in the array)
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  try {
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const imageUrl = fileLink.href;

    if (!ctx.session.uploadedImageUrls) {
      ctx.session.uploadedImageUrls = [];
    }
    ctx.session.uploadedImageUrls.push(imageUrl);

    const count = ctx.session.uploadedImageUrls.length;

    // If caption is provided, treat it as the prompt and enqueue immediately
    if (ctx.message.caption) {
      return processGeneration(ctx, ctx.message.caption);
    }

    // Otherwise acknowledge and wait for text prompt
    let msg: string;
    if (isImageModelWithInput) {
      msg = lang === 'ru'
        ? `✅ Изображение загружено. Отправьте ✍️ текстовый запрос для редактирования.`
        : `✅ Image uploaded. Send ✍️ a text prompt describing the edit.`;
    } else {
      msg = lang === 'ru'
        ? `✅ Изображение загружено (${count}). Отправьте ✍️ текстовый запрос для генерации или 🌄 ещё одно изображение.`
        : `✅ Image uploaded (${count}). Send ✍️ a text prompt to generate or 🌄 another image.`;
    }
    await ctx.reply(msg);
  } catch (error) {
    logger.error('Failed to get file link for photo:', error);
    const msg = lang === 'ru'
      ? 'Не удалось загрузить изображение. Попробуйте снова.'
      : 'Failed to upload image. Please try again.';
    await ctx.reply(msg);
  }
}

export async function handleUserInput(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) return;
  if (!('text' in ctx.message!) || !ctx.message.text) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const input = ctx.message.text;

  // Check for cancel commands in both languages
  const cancelButtons = [
    '❌ Cancel', '❌ Отмена',
    '⬅️ Back', '⬅️ Назад',
    '🏠 Main menu', '🏠 Главное меню',
  ];

  if (cancelButtons.some(btn => input === btn)) {
    ctx.session.awaitingInput = false;
    ctx.session.selectedModel = undefined;
    ctx.session.uploadedImageUrls = undefined;
    await sendTrackedMessage(ctx, l.messages.cancelled, getMainKeyboard(lang));
    return;
  }

  return processGeneration(ctx, input);
}

/**
 * Shared generation logic used by both text and photo (with caption) handlers.
 * Validates balance, creates request, deducts credits, enqueues job.
 */
async function processGeneration(ctx: BotContext, input: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);

  const model = await modelService.getBySlug(ctx.session.selectedModel!);
  if (!model) {
    await sendTrackedMessage(ctx, l.messages.errorModelNotFound, getMainKeyboard(lang));
    ctx.session.awaitingInput = false;
    return;
  }

  const walletCat = toWalletCategory(model.category);
  const priceItemCode = modelService.getPriceItemCode(model.slug);

  // ── Load user settings BEFORE balance check (needed for dynamic pricing) ──

  let audioOptions: Record<string, unknown> | undefined;
  if (ctx.session.audioFunction && ctx.from) {
    try {
      audioOptions = await getAudioOptionsForFunction(
        ctx.user.id,
        BigInt(ctx.from.id),
        ctx.session.audioFunction,
      );
    } catch (err) {
      logger.warn('Failed to load audio options, using defaults', { err });
    }
  }

  let imageOptions: Record<string, unknown> | undefined;
  if (ctx.session.imageFunction && ctx.from) {
    try {
      imageOptions = await getImageOptionsForFunction(
        ctx.user.id,
        BigInt(ctx.from.id),
        ctx.session.imageFunction,
      );
    } catch (err) {
      logger.warn('Failed to load image options, using defaults', { err });
    }
  }

  let videoOptions: Record<string, unknown> | undefined;
  if (ctx.session.videoFunction && ctx.from) {
    try {
      videoOptions = await getVideoOptionsForFunction(
        ctx.user.id,
        BigInt(ctx.from.id),
        ctx.session.videoFunction,
      );
    } catch (err) {
      logger.warn('Failed to load video options, using defaults', { err });
    }
  }

  // ── Calculate dynamic cost (scales with duration/resolution for video models) ──

  const creditsCost = calculateDynamicCost(
    model.slug,
    model.tokenCost,
    videoOptions as { duration?: number; resolution?: string } | undefined,
  );

  // ── Balance check ──

  const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, walletCat, creditsCost);
  if (!hasBalance) {
    const currentBalance = await walletService.getBalance(ctx.user.id, walletCat);
    const message = t(lang, 'messages.errorInsufficientBalance', {
      required: formatCredits(creditsCost),
      current: formatCredits(currentBalance),
    });
    await sendTrackedMessage(ctx, message, getMainKeyboard(lang));
    ctx.session.awaitingInput = false;
    return;
  }

  // Create request record
  let request;
  try {
    request = await requestService.create({
      userId: ctx.user.id,
      modelId: model.id,
      inputText: input,
      tokensCost: creditsCost,
    });
  } catch (error) {
    logger.error('Failed to create request:', error);
    await sendTrackedMessage(ctx, l.messages.errorGeneric, getMainKeyboard(lang));
    return;
  }

  // Deduct credits from wallet
  try {
    await walletService.deductCredits(ctx.user.id, walletCat, creditsCost, {
      requestId: request.id,
      priceItemCode,
      description: `${model.name} generation`,
    });
  } catch (error) {
    logger.error('Failed to deduct credits:', error);
    await sendTrackedMessage(ctx, l.messages.errorGeneric, getMainKeyboard(lang));
    return;
  }

  // Send processing message
  const processingMessage = t(lang, 'messages.processing', { modelName: model.name });
  const processingMsg = await ctx.reply(processingMessage, getMainKeyboard(lang));

  // Collect uploaded image URLs for image-to-video or image editing.
  // If user set an aspect ratio, resize/crop images to match before sending to provider
  // (most image-to-video APIs ignore the aspect_ratio param and use the source image dims).
  let inputImageUrls: string[] | undefined;
  if (ctx.session.uploadedImageUrls?.length) {
    const targetAR = (videoOptions?.aspectRatio || imageOptions?.aspectRatio) as string | undefined;
    if (targetAR && ctx.chat) {
      const resized: string[] = [];
      for (const originalUrl of ctx.session.uploadedImageUrls) {
        try {
          const buffer = await resizeImageForAspectRatio(originalUrl, targetAR);
          const msg = await ctx.telegram.sendPhoto(
            ctx.chat.id,
            { source: buffer },
            { disable_notification: true } as any,
          );
          await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
          const fileId = msg.photo![msg.photo!.length - 1].file_id;
          const fileLink = await ctx.telegram.getFileLink(fileId);
          resized.push(fileLink.href);
          logger.info(`Image resized for aspect ratio ${targetAR}`, { originalUrl: originalUrl.slice(0, 60) });
        } catch (err) {
          logger.warn('Image resize failed, using original', { err });
          resized.push(originalUrl);
        }
      }
      inputImageUrls = resized;
    } else {
      inputImageUrls = [...ctx.session.uploadedImageUrls];
    }
  }

  // Enqueue the job - worker will handle execution and result delivery
  try {
    await enqueueGeneration({
      requestId: request.id,
      userId: ctx.user.id,
      chatId: ctx.chat!.id,
      modelSlug: model.slug,
      modelCategory: model.category,
      provider: model.provider,
      input,
      processingMsgId: processingMsg.message_id,
      language: lang,
      creditsCost,
      priceItemCode,
      walletCategory: walletCat,
      botToken: config.bot.token,
      modelName: model.name,
      telegramId: ctx.from?.id,
      settingsApplied: videoOptions || imageOptions || audioOptions || undefined,
      ...(inputImageUrls && { inputImageUrls }),
      ...(audioOptions && { audioOptions }),
      ...(imageOptions && { imageOptions }),
      ...(videoOptions && { videoOptions }),
    });

    logger.info('Job enqueued', { requestId: request.id, model: model.slug, creditsCost, hasImages: !!inputImageUrls });
  } catch (error) {
    logger.error('Failed to enqueue job:', error);

    // Refund credits if enqueue fails
    try {
      await walletService.refundCredits(ctx.user.id, walletCat, creditsCost, {
        requestId: request.id,
        priceItemCode,
        description: `Refund: queue error`,
      });
    } catch (refundError) {
      logger.error('Failed to refund credits:', refundError);
    }

    await sendTrackedMessage(ctx, l.messages.errorGeneric, getMainKeyboard(lang));
  }

  // Keep model context active so user can send consecutive prompts.
  // Only clear uploaded images — they were consumed by this generation.
  ctx.session.uploadedImageUrls = undefined;
}
