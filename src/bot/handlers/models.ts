import { Markup } from 'telegraf';
import { WalletCategory } from '@prisma/client';
import { BotContext } from '../types';
import { getCancelKeyboard, getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, requestService, walletService, modelAccessService } from '../../services';
import { getAudioOptionsForFunction } from './audio';
import { getImageOptionsForFunction } from './image';
import { getVideoOptionsForFunction } from './video';
import { logger } from '../../utils/logger';
import { sendTrackedMessage, deleteMessage } from '../utils';
import { Language, t, getLocale } from '../../locales';
import { enqueueGeneration } from '../../queues/producer';
import { config } from '../../config';
import { resizeImageForAspectRatio } from '../../utils/imageResize';
import { calculateDynamicCost } from '../../utils/videoPricing';

/** Image models that accept a reference image for editing (not just text prompt) */
const IMAGE_MODELS_WITH_IMAGE_INPUT = ['flux-kontext', 'nano-banana', 'nano-banana-pro', 'midjourney', 'seedream', 'seedream-4.5'];

/**
 * Per-model maximum image upload limits.
 * Based on provider API capabilities:
 * - KieAI market endpoint (kling/sora): image_urls array → up to 4
 * - KieAI runway: imageUrl single string → 1
 * - KieAI veo: frames (2) / ingredients (3) → 3
 * - FAL (seedance/wan/luma): image_url + end_image_url → 2
 * - Image editing (nano-banana/seedream): array → 4
 * - Image editing (flux-kontext/midjourney): single → 1
 */
const MODEL_MAX_IMAGES: Record<string, number> = {
  // Video models
  'kling': 4, 'kling-pro': 4,
  'sora': 4, 'sora-pro': 4,
  'veo': 3, 'veo-fast': 3,
  'seedance': 2, 'seedance-lite': 2, 'seedance-1-pro': 2, 'seedance-fast': 2,
  'luma': 2, 'wan': 2,
  'runway': 1, 'runway-gen4': 1,
  // Image editing models
  'nano-banana': 4, 'nano-banana-pro': 4,
  'seedream': 4, 'seedream-4.5': 4,
  'flux-kontext': 1, 'midjourney': 1,
};
const DEFAULT_MAX_IMAGES = 1;

/** Get the max image upload count for a model */
function getMaxImages(modelId: string | undefined): number {
  if (!modelId) return DEFAULT_MAX_IMAGES;
  return MODEL_MAX_IMAGES[modelId] ?? DEFAULT_MAX_IMAGES;
}

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

/** Delete tracked "image added" inline-button messages to keep chat clean */
async function cleanUpImageUploadMessages(ctx: BotContext): Promise<void> {
  const msgIds = ctx.session?.imageUploadMsgIds;
  if (!msgIds?.length || !ctx.chat) return;
  for (const msgId of msgIds) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, msgId);
    } catch { /* message may already be deleted */ }
  }
  ctx.session!.imageUploadMsgIds = undefined;
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
    const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, creditsCost);
    if (!hasBalance) {
      const currentBalance = await walletService.getBalance(ctx.user.id);
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
  logger.info('handlePhotoInput called', {
    hasUser: !!ctx.user,
    hasSession: !!ctx.session,
    awaitingInput: ctx.session?.awaitingInput,
    selectedModel: ctx.session?.selectedModel,
    videoFunction: ctx.session?.videoFunction,
    imageFunction: ctx.session?.imageFunction,
  });
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) {
    // User uploaded a photo but no model is selected — give feedback instead of silently ignoring
    if (ctx.session?.videoFamily || ctx.session?.imageFamily) {
      const lang = getLang(ctx);
      const msg = lang === 'ru'
        ? '⚠️ Сначала выберите модель, затем загрузите изображение.'
        : '⚠️ Please select a model first, then upload an image.';
      await ctx.reply(msg);
    }
    return;
  }
  if (!ctx.message || !('photo' in ctx.message) || !ctx.message.photo) return;

  // Clean up previous bot navigation message (moved from middleware to here so we don't
  // lose the menu if session guards fail)
  if (ctx.session.lastBotMessageId) {
    await deleteMessage(ctx, ctx.session.lastBotMessageId);
    ctx.session.lastBotMessageId = undefined;
  }

  const lang = getLang(ctx);

  // Text-only video models — no image-to-video support
  const TEXT_ONLY_VIDEO_MODELS: string[] = [];

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

  // Enforce per-model image limits (both image editing and video models)
  const activeModel = ctx.session.imageFunction || ctx.session.videoFunction;
  const maxImages = getMaxImages(activeModel);
  if (ctx.session.uploadedImageUrls?.length && ctx.session.uploadedImageUrls.length >= maxImages) {
    const msg = maxImages === 1
      ? (lang === 'ru'
          ? '⚠️ Эта модель поддерживает только 1 изображение. Отправьте ✍️ текстовый запрос.'
          : '⚠️ This model supports only 1 image. Send ✍️ a text prompt.')
      : (lang === 'ru'
          ? `⚠️ Максимум ${maxImages} изображений. Отправьте ✍️ текстовый запрос.`
          : `⚠️ Maximum ${maxImages} images. Send ✍️ a text prompt.`);
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
      // Clean up any previous image-upload messages before generation
      await cleanUpImageUploadMessages(ctx);
      return processGeneration(ctx, ctx.message.caption);
    }

    // Clean up previous image-upload message (if user uploads another image)
    await cleanUpImageUploadMessages(ctx);

    // Otherwise acknowledge and wait for text prompt
    const remaining = maxImages - count;
    let msg: string;
    if (remaining > 0 && maxImages > 1) {
      msg = lang === 'ru'
        ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'} (макс. ${maxImages}).\nМожно загрузить ещё ${remaining} или отправить ✍️ текстовый запрос 👇`
        : `✅ ${count} ${count === 1 ? 'image' : 'images'} added (max ${maxImages}).\nUpload ${remaining} more or send ✍️ a text prompt 👇`;
    } else {
      msg = lang === 'ru'
        ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'}.\nОтправьте ✍️ текстовый запрос 👇`
        : `✅ ${count} ${count === 1 ? 'image' : 'images'} added.\nSend ✍️ a text prompt 👇`;
    }

    // Build inline keyboard: [Delete] [Configure]
    const buttons: any[][] = [];
    buttons.push([
      Markup.button.callback(lang === 'ru' ? '🗑 Удалить' : '🗑 Delete', `delete_image:${count - 1}`),
    ]);

    // Configure button — opens webapp settings for the current model
    const webappUrl = config.webapp?.url;
    const modelSlug = ctx.session.videoFunction || ctx.session.imageFunction;
    if (webappUrl && ctx.from && modelSlug) {
      const settingsPath = isImageModelWithInput ? 'image' : 'video';
      const configureUrl = `${webappUrl}/${settingsPath}/settings?model=${encodeURIComponent(modelSlug)}&tgid=${ctx.from.id}`;
      buttons.push([
        Markup.button.webApp(lang === 'ru' ? '⚙️ Настроить' : '⚙️ Configure', configureUrl),
      ]);
    }

    logger.info('handlePhotoInput: sending image-added reply', { count, modelSlug: ctx.session.videoFunction || ctx.session.imageFunction });
    const sentMsg = await ctx.reply(msg, {
      reply_parameters: { message_id: ctx.message.message_id },
      ...Markup.inlineKeyboard(buttons),
    });

    // Track this message for cleanup when user sends a prompt
    if (!ctx.session.imageUploadMsgIds) ctx.session.imageUploadMsgIds = [];
    ctx.session.imageUploadMsgIds.push(sentMsg.message_id);
  } catch (error) {
    logger.error('Failed to get file link for photo:', error);
    const msg = lang === 'ru'
      ? 'Не удалось загрузить изображение. Попробуйте снова.'
      : 'Failed to upload image. Please try again.';
    await ctx.reply(msg);
  }
}

/**
 * Handle document uploads (files sent as .png, .jpg, .webp, etc.)
 * Delegates to handlePhotoInput after extracting the file as a photo-like object.
 */
export async function handleDocumentInput(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) {
    // Same feedback as handlePhotoInput — tell user to pick a model first
    if (ctx.message && 'document' in ctx.message && ctx.message.document?.mime_type?.startsWith('image/')) {
      if (ctx.session?.videoFamily || ctx.session?.imageFamily) {
        const lang = getLang(ctx);
        const msg = lang === 'ru'
          ? '⚠️ Сначала выберите модель, затем загрузите изображение.'
          : '⚠️ Please select a model first, then upload an image.';
        await ctx.reply(msg);
      }
    }
    return;
  }
  if (!ctx.message || !('document' in ctx.message) || !ctx.message.document) return;

  const doc = ctx.message.document;
  const mime = doc.mime_type || '';

  // Only handle image files
  if (!mime.startsWith('image/')) return;

  // Clean up previous bot navigation message
  if (ctx.session.lastBotMessageId) {
    await deleteMessage(ctx, ctx.session.lastBotMessageId);
    ctx.session.lastBotMessageId = undefined;
  }

  const lang = getLang(ctx);

  const TEXT_ONLY_VIDEO_MODELS: string[] = [];

  const isVideoModel = !!ctx.session.videoFunction;
  const isImageModelWithInput = !!ctx.session.imageFunction &&
    IMAGE_MODELS_WITH_IMAGE_INPUT.includes(ctx.session.imageFunction);

  if (!isVideoModel && !isImageModelWithInput) {
    if (ctx.session.imageFunction) {
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

  if (isVideoModel && TEXT_ONLY_VIDEO_MODELS.includes(ctx.session.videoFunction!)) {
    const msg = lang === 'ru'
      ? '⚠️ Эта модель поддерживает только текстовые запросы. Отправьте ✍️ текстовый запрос.'
      : '⚠️ This model is text-only. Please send ✍️ a text prompt.';
    await ctx.reply(msg);
    return;
  }

  // Enforce per-model image limits (both image editing and video models)
  const activeModel = ctx.session.imageFunction || ctx.session.videoFunction;
  const maxImages = getMaxImages(activeModel);
  if (ctx.session.uploadedImageUrls?.length && ctx.session.uploadedImageUrls.length >= maxImages) {
    const msg = maxImages === 1
      ? (lang === 'ru'
          ? '⚠️ Эта модель поддерживает только 1 изображение. Отправьте ✍️ текстовый запрос.'
          : '⚠️ This model supports only 1 image. Send ✍️ a text prompt.')
      : (lang === 'ru'
          ? `⚠️ Максимум ${maxImages} изображений. Отправьте ✍️ текстовый запрос.`
          : `⚠️ Maximum ${maxImages} images. Send ✍️ a text prompt.`);
    await ctx.reply(msg);
    return;
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(doc.file_id);
    const imageUrl = fileLink.href;

    if (!ctx.session.uploadedImageUrls) {
      ctx.session.uploadedImageUrls = [];
    }
    ctx.session.uploadedImageUrls.push(imageUrl);

    const count = ctx.session.uploadedImageUrls.length;

    // If caption is provided, treat it as the prompt and enqueue immediately
    if (ctx.message.caption) {
      await cleanUpImageUploadMessages(ctx);
      return processGeneration(ctx, ctx.message.caption);
    }

    await cleanUpImageUploadMessages(ctx);

    const remaining = maxImages - count;
    let msg: string;
    if (remaining > 0 && maxImages > 1) {
      msg = lang === 'ru'
        ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'} (макс. ${maxImages}).\nМожно загрузить ещё ${remaining} или отправить ✍️ текстовый запрос 👇`
        : `✅ ${count} ${count === 1 ? 'image' : 'images'} added (max ${maxImages}).\nUpload ${remaining} more or send ✍️ a text prompt 👇`;
    } else {
      msg = lang === 'ru'
        ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'}.\nОтправьте ✍️ текстовый запрос 👇`
        : `✅ ${count} ${count === 1 ? 'image' : 'images'} added.\nSend ✍️ a text prompt 👇`;
    }

    const buttons: any[][] = [];
    buttons.push([
      Markup.button.callback(lang === 'ru' ? '🗑 Удалить' : '🗑 Delete', `delete_image:${count - 1}`),
    ]);

    const webappUrl = config.webapp?.url;
    const modelSlug = ctx.session.videoFunction || ctx.session.imageFunction;
    if (webappUrl && ctx.from && modelSlug) {
      const settingsPath = isImageModelWithInput ? 'image' : 'video';
      const configureUrl = `${webappUrl}/${settingsPath}/settings?model=${encodeURIComponent(modelSlug)}&tgid=${ctx.from.id}`;
      buttons.push([
        Markup.button.webApp(lang === 'ru' ? '⚙️ Настроить' : '⚙️ Configure', configureUrl),
      ]);
    }

    const sentMsg = await ctx.reply(msg, {
      reply_parameters: { message_id: ctx.message.message_id },
      ...Markup.inlineKeyboard(buttons),
    });

    if (!ctx.session.imageUploadMsgIds) ctx.session.imageUploadMsgIds = [];
    ctx.session.imageUploadMsgIds.push(sentMsg.message_id);
  } catch (error) {
    logger.error('Failed to get file link for document:', error);
    const msg = lang === 'ru'
      ? 'Не удалось загрузить изображение. Попробуйте снова.'
      : 'Failed to upload image. Please try again.';
    await ctx.reply(msg);
  }
}

export async function handleUserInput(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  // Route to multi-turn chat handler if active conversation exists
  if (ctx.session.activeConversationId) {
    const { handleChatMessage } = await import('./chat');
    return handleChatMessage(ctx);
  }

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
    await cleanUpImageUploadMessages(ctx);
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

  // Clean up "image added" messages — no longer needed once generation starts
  await cleanUpImageUploadMessages(ctx);

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

  // ── Calculate dynamic cost (scales with duration/resolution for video, speed for Midjourney) ──

  const dynamicSettings = { ...(videoOptions || {}), ...(imageOptions || {}) } as {
    duration?: number; resolution?: string; version?: string; enableAudio?: boolean; speed?: string;
  };
  const creditsCost = calculateDynamicCost(model.slug, model.tokenCost, dynamicSettings);

  // ── Balance check ──

  const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, creditsCost);
  if (!hasBalance) {
    const currentBalance = await walletService.getBalance(ctx.user.id);
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

  // Send processing message (Stage 1: Starting)
  const processingMessage = t(lang, 'messages.processingStart', { modelName: model.name });
  const processingMsg = await ctx.reply(processingMessage, { parse_mode: 'HTML', ...getMainKeyboard(lang) });

  // Collect uploaded image URLs for image-to-video or image editing.
  // If user set an aspect ratio, resize/crop images to match before sending to provider
  // (most image-to-video APIs ignore the aspect_ratio param and use the source image dims).
  let inputImageUrls: string[] | undefined;
  if (ctx.session.uploadedImageUrls?.length) {
    const targetAR = (videoOptions?.aspectRatio || imageOptions?.aspectRatio) as string | undefined;
    // Skip resize for image-editing models — provider needs the full original image
    const isImageEdit = IMAGE_MODELS_WITH_IMAGE_INPUT.includes(ctx.session.imageFunction || '');
    if (targetAR && ctx.chat && !isImageEdit) {
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
  // Only clear uploaded images and their tracked messages — they were consumed by this generation.
  ctx.session.uploadedImageUrls = undefined;
  ctx.session.imageUploadMsgIds = undefined;
}
