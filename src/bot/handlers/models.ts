import { Markup } from 'telegraf';
import { WalletCategory } from '@prisma/client';
import { BotContext } from '../types';
import { getCancelKeyboard, getMainKeyboard } from '../keyboards/mainKeyboard';
import { getModelActiveKeyboardMarkup } from '../keyboards/modelKeyboards';
import { modelService, requestService, walletService, modelAccessService, subscriptionService } from '../../services';
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
import { getStatusType, STATUS_MESSAGES } from '../../utils/statusMessages';
import { getRedis } from '../../config/redis';
import { getPlanByTier } from '../../config/subscriptions';
import { convertOgaToMp3 } from '../../utils/audioConvert';
import { downloadTelegramFile } from '../../utils/telegramFileDownload';
import axios from 'axios';

/**
 * Per-user image upload debounce.
 * Accumulates image URLs in memory (not session) to avoid race conditions
 * when multiple photos arrive concurrently (albums / rapid sends).
 * After debounce fires, reads fresh session from Redis, appends all URLs atomically.
 */
interface PendingImageUpload {
  timer: ReturnType<typeof setTimeout>;
  urls: string[];
  ctx: BotContext;
  caption?: string;
  isImageModelWithInput: boolean;
}
const pendingImageUploads = new Map<number, PendingImageUpload>(); // keyed by ctx.from.id
const IMAGE_UPLOAD_DEBOUNCE_MS = 800;

/** Image models that accept a reference image for editing (not just text prompt) */
const IMAGE_MODELS_WITH_IMAGE_INPUT = ['flux-kontext', 'nano-banana', 'nano-banana-pro', 'nano-banana-2', 'midjourney', 'seedream', 'seedream-4.5'];

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
  'kling': 4, 'kling-pro': 4, 'kling-3.0': 2,
  'kling-motion': 1, 'kling-avatar-pro': 1, 'kling-avatar': 1, 'topaz': 0, 'topaz-direct': 0, 'wavespeed': 0, 'wavespeed-pro': 0,
  'sora': 4, 'sora-pro': 4,
  'veo': 3, 'veo-fast': 3,
  'seedance': 2, 'seedance-lite': 2, 'seedance-1-pro': 2, 'seedance-fast': 2,
  'luma': 2, 'wan': 2,
  'runway': 1, 'runway-gen4': 1,
  // Image editing models
  'nano-banana': 4, 'nano-banana-pro': 4, 'nano-banana-2': 14,
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

const SESSION_PREFIX = 'sess:';
const SESSION_TTL = 86400;

/**
 * Add an image URL to the per-user debounce buffer.
 * After IMAGE_UPLOAD_DEBOUNCE_MS of no new photos, flushes all URLs to Redis session atomically.
 */
function enqueueImageUrl(
  ctx: BotContext,
  imageUrl: string,
  caption: string | undefined,
  isImageModelWithInput: boolean,
): void {
  const userId = ctx.from!.id;
  const existing = pendingImageUploads.get(userId);

  if (existing) {
    clearTimeout(existing.timer);
    existing.urls.push(imageUrl);
    existing.ctx = ctx;
    if (caption) existing.caption = caption;
  } else {
    pendingImageUploads.set(userId, {
      urls: [imageUrl],
      ctx,
      caption,
      isImageModelWithInput,
      timer: undefined as any,
    });
  }

  const entry = pendingImageUploads.get(userId)!;
  entry.timer = setTimeout(() => {
    pendingImageUploads.delete(userId);
    flushImageUploads(entry)
      .catch((err: any) => logger.error('Image upload flush failed', { err }));
  }, IMAGE_UPLOAD_DEBOUNCE_MS);
}

/**
 * Flush buffered image URLs to Redis session atomically.
 * Reads fresh session from Redis (avoiding stale reads), appends URLs, saves back.
 * Called from debounce timer (outside Telegraf middleware lifecycle).
 */
async function flushImageUploads(entry: PendingImageUpload): Promise<void> {
  const { urls, ctx, caption, isImageModelWithInput } = entry;
  const userId = ctx.from!.id;
  const redis = getRedis();
  const sessionKey = `${SESSION_PREFIX}${userId}`;

  // Read fresh session from Redis (avoids race condition with concurrent handlers)
  const raw = await redis.get(sessionKey);
  const session = raw ? JSON.parse(raw) : {};

  // Enforce per-model image limits
  const activeModel = session.imageFunction || session.videoFunction;
  const maxImages = getMaxImages(activeModel);

  if (!session.uploadedImageUrls) {
    session.uploadedImageUrls = [];
  }

  const remaining = maxImages - session.uploadedImageUrls.length;
  const urlsToAdd = urls.slice(0, Math.max(0, remaining));

  if (urlsToAdd.length === 0) return;

  session.uploadedImageUrls.push(...urlsToAdd);

  // Sync in-memory ctx.session so sendImageAcknowledgment sees correct count
  if (ctx.session) {
    ctx.session.uploadedImageUrls = session.uploadedImageUrls;
    ctx.session.imageUploadMsgIds = session.imageUploadMsgIds;
  }

  // Clean up old ack messages + send new acknowledgment
  await cleanUpImageUploadMessages(ctx);
  await sendImageAcknowledgment(ctx, isImageModelWithInput, caption);

  // Persist session (including new imageUploadMsgIds from ack) back to Redis
  session.imageUploadMsgIds = ctx.session?.imageUploadMsgIds;
  await redis.set(sessionKey, JSON.stringify(session), 'EX', SESSION_TTL);

  // Update ctx.session so the Telegraf middleware doesn't overwrite with stale data
  if (ctx.session) {
    Object.assign(ctx.session, session);
  }
}

/**
 * Force-flush any pending image uploads for a user.
 * Call before generation or navigation to ensure all buffered URLs are committed.
 */
async function forceFlushPendingUploads(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;
  const pending = pendingImageUploads.get(ctx.from.id);
  if (!pending) return;

  clearTimeout(pending.timer);
  pendingImageUploads.delete(ctx.from.id);
  await flushImageUploads(pending);

  // Re-read session since flushImageUploads wrote to Redis directly
  const redis = getRedis();
  const raw = await redis.get(`${SESSION_PREFIX}${ctx.from.id}`);
  if (raw) ctx.session = JSON.parse(raw);
}

/** Clear any pending image upload buffer for a user (no flush) */
function clearPendingUploads(userId: number): void {
  const pending = pendingImageUploads.get(userId);
  if (pending) {
    clearTimeout(pending.timer);
    pendingImageUploads.delete(userId);
  }
}

function formatCredits(amount: number): string {
  const formatted = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
  return `${formatted} token${amount === 1 ? '' : 's'}`;
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
          Markup.button.webApp(upgradeText, `${config.webapp.url}?v=2`),
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

  // Get the largest photo (last element in the array)
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  try {
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const imageUrl = fileLink.href;
    const caption = ctx.message.caption;

    // Accumulate URL in per-user in-memory buffer (NOT session — avoids race condition)
    enqueueImageUrl(ctx, imageUrl, caption, isImageModelWithInput);
  } catch (error) {
    logger.error('Failed to get file link for photo:', error);
    const msg = lang === 'ru'
      ? 'Не удалось загрузить изображение. Попробуйте снова.'
      : 'Failed to upload image. Please try again.';
    await ctx.reply(msg);
  }
}

/**
 * Send a single acknowledgment after one or more images have been added to the session.
 * Used by both single-photo and media-group flows.
 */
async function sendImageAcknowledgment(
  ctx: BotContext,
  isImageModelWithInput: boolean,
  caption?: string,
): Promise<void> {
  if (!ctx.session) return;
  const lang = getLang(ctx);

  const count = ctx.session.uploadedImageUrls?.length || 0;

  // If caption is provided, treat it as the prompt and enqueue immediately
  if (caption) {
    await cleanUpImageUploadMessages(ctx);
    return processGeneration(ctx, caption);
  }

  // Clean up previous image-upload messages
  await cleanUpImageUploadMessages(ctx);

  const activeModel = ctx.session.imageFunction || ctx.session.videoFunction;
  const maxImages = getMaxImages(activeModel);
  const remaining = maxImages - count;

  // Context-aware next-step guidance
  const videoFunc = ctx.session.videoFunction;
  let nextStep: string;
  let showGenerateButton = false;
  if (videoFunc === 'kling-motion') {
    // Motion Control needs photo + video
    const hasVideo = !!ctx.session.uploadedVideoUrl;
    if (hasVideo) {
      showGenerateButton = true;
      nextStep = lang === 'ru'
        ? 'Фото и видео готовы. Отправьте ✍️ текст или нажмите кнопку ниже 👇'
        : 'Photo and video ready. Send ✍️ a text prompt or tap the button below 👇';
    } else {
      nextStep = lang === 'ru'
        ? 'Теперь загрузите 🎥 1 видео с движением для анимации.'
        : 'Now upload 🎥 1 video with the motion to animate.';
    }
  } else if (videoFunc === 'kling-avatar-pro' || videoFunc === 'kling-avatar') {
    // Avatar needs photo + audio
    const hasAudio = !!ctx.session.uploadedAudioUrl;
    if (hasAudio) {
      showGenerateButton = true;
      nextStep = lang === 'ru'
        ? 'Фото и аудио готовы. Отправьте ✍️ текст или нажмите кнопку ниже 👇'
        : 'Photo and audio ready. Send ✍️ a text prompt or tap the button below 👇';
    } else {
      nextStep = lang === 'ru'
        ? 'Теперь загрузите 🎵 1 аудиофайл (mp3, wav, m4a).'
        : 'Now upload 🎵 1 audio file (mp3, wav, m4a).';
    }
  } else if (remaining > 0 && maxImages > 1) {
    nextStep = lang === 'ru'
      ? `Можно загрузить ещё ${remaining} или отправить ✍️ текстовый запрос 👇`
      : `Upload ${remaining} more or send ✍️ a text prompt 👇`;
  } else {
    nextStep = lang === 'ru'
      ? 'Отправьте ✍️ текстовый запрос 👇'
      : 'Send ✍️ a text prompt 👇';
  }

  let msg: string;
  if (remaining > 0 && maxImages > 1 && videoFunc !== 'kling-motion' && videoFunc !== 'kling-avatar-pro' && videoFunc !== 'kling-avatar') {
    msg = lang === 'ru'
      ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'} (макс. ${maxImages}).\n${nextStep}`
      : `✅ ${count} ${count === 1 ? 'image' : 'images'} added (max ${maxImages}).\n${nextStep}`;
  } else {
    msg = lang === 'ru'
      ? `✅ ${count} ${count === 1 ? 'изображение добавлено' : 'изображений добавлено'}.\n${nextStep}`
      : `✅ ${count} ${count === 1 ? 'image' : 'images'} added.\n${nextStep}`;
  }

  // Build inline keyboard
  const buttons: any[][] = [];

  // Show Generate button when all required inputs are ready (Motion Control / Avatar)
  if (showGenerateButton) {
    buttons.push([
      Markup.button.callback(lang === 'ru' ? '▶️ Сгенерировать' : '▶️ Generate', 'generate_now'),
    ]);
  }

  buttons.push([
    Markup.button.callback(lang === 'ru' ? '🗑 Удалить' : '🗑 Delete', 'delete_all_images'),
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

  logger.info('sendImageAcknowledgment', { count, modelSlug });
  const sentMsg = await ctx.reply(msg, Markup.inlineKeyboard(buttons));

  // Track this message for cleanup when user sends a prompt
  if (!ctx.session.imageUploadMsgIds) ctx.session.imageUploadMsgIds = [];
  ctx.session.imageUploadMsgIds.push(sentMsg.message_id);
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

  // Route audio documents (mp3, wav, etc.) to audio handler
  if (mime.startsWith('audio/')) {
    return handleAudioUpload(ctx);
  }

  // Route video documents (mp4, mov, etc.) to video handler
  if (mime.startsWith('video/')) {
    return handleVideoUpload(ctx);
  }

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

  try {
    let imageUrl: string;
    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      imageUrl = fileLink.href;
    } catch {
      // Fallback for large files (>20MB) — download to our server
      logger.info('getFileLink failed for document, falling back to direct download');
      const ext = doc.file_name ? '.' + (doc.file_name.split('.').pop() || 'jpg') : '.jpg';
      const { scheduleFileCleanup } = await import('../../utils/telegramFileDownload');
      imageUrl = await downloadTelegramFile(doc.file_id, config.bot.token, ext);
      scheduleFileCleanup(imageUrl);
    }
    const caption = ctx.message.caption;

    // Accumulate URL in per-user in-memory buffer (NOT session — avoids race condition)
    enqueueImageUrl(ctx, imageUrl, caption, isImageModelWithInput);
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
    if (ctx.from) clearPendingUploads(ctx.from.id);
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

  const lang = getLang(ctx);
  const l = getLocale(lang);

  // ── Concurrent generation limit ──
  const concurrentKey = `gen:active:${ctx.user.id}`;
  try {
    const redis = getRedis();
    const activeCount = parseInt(await redis.get(concurrentKey) || '0', 10);
    const sub = await subscriptionService.getUserSubscription(ctx.user.id);
    const plan = getPlanByTier(sub.tier as any);
    const maxConcurrent = plan?.maxConcurrentGenerations ?? 2;
    if (activeCount >= maxConcurrent) {
      const msg = lang === 'ru'
        ? `⏳ У вас уже ${activeCount} активных генераций (макс. ${maxConcurrent}). Дождитесь завершения.`
        : `⏳ You have ${activeCount} active generations (max ${maxConcurrent}). Please wait for one to finish.`;
      await ctx.reply(msg);
      return;
    }
  } catch (err) {
    logger.warn('Concurrent generation check failed, proceeding', { err });
  }

  // Force-flush any pending image uploads before starting generation
  await forceFlushPendingUploads(ctx);

  // Clean up "image added" messages — no longer needed once generation starts
  await cleanUpImageUploadMessages(ctx);

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

  // Send initial processing message with dynamic status text
  const statusType = getStatusType(model.slug);
  const statusMsgs = STATUS_MESSAGES[statusType] || STATUS_MESSAGES.default;
  const initialStageVariants = statusMsgs.stages[0];
  const initialStatusText = initialStageVariants[Math.floor(Math.random() * initialStageVariants.length)];
  const processingMessage = `🚀 <b>${model.name}</b>\n\n${initialStatusText}`;
  const activeKb = getModelActiveKeyboardMarkup({
    lang, modelCategory: model.category, modelSlug: model.slug, telegramId: ctx.from?.id,
  });
  const processingMsg = await ctx.reply(processingMessage, { parse_mode: 'HTML', ...activeKb });

  // Collect uploaded image URLs for image-to-video or image editing.
  // If user set an aspect ratio, resize/crop images to match before sending to provider
  // (most image-to-video APIs ignore the aspect_ratio param and use the source image dims).
  let inputImageUrls: string[] | undefined;
  if (ctx.session.uploadedImageUrls?.length) {
    const targetAR = (videoOptions?.aspectRatio || imageOptions?.aspectRatio) as string | undefined;
    // Skip resize for image-editing models and models whose API handles aspect_ratio natively
    const isImageEdit = IMAGE_MODELS_WITH_IMAGE_INPUT.includes(ctx.session.imageFunction || '');
    const SKIP_RESIZE_MODELS = ['kling-3.0', 'kling-motion', 'kling-avatar-pro', 'kling-avatar', 'kling', 'kling-pro', 'sora', 'sora-pro'];
    const skipResize = isImageEdit || SKIP_RESIZE_MODELS.includes(ctx.session.videoFunction || '');
    if (targetAR && ctx.chat && !skipResize) {
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
      ...(ctx.session.uploadedVideoUrl && { inputVideoUrl: ctx.session.uploadedVideoUrl }),
      ...(ctx.session.uploadedAudioUrl && { inputAudioUrl: ctx.session.uploadedAudioUrl }),
      ...(ctx.session.videoMeta && { videoMeta: ctx.session.videoMeta }),
      ...(audioOptions && { audioOptions }),
      ...(imageOptions && { imageOptions }),
      ...(videoOptions && { videoOptions }),
    });

    logger.info('Job enqueued', { requestId: request.id, model: model.slug, creditsCost, hasImages: !!inputImageUrls });

    // Increment concurrent generation counter (TTL 10min as safety net)
    try {
      const redis = getRedis();
      const concurrentKey = `gen:active:${ctx.user!.id}`;
      await redis.incr(concurrentKey);
      await redis.expire(concurrentKey, 600);
    } catch { /* non-critical */ }
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
  // Only clear uploaded images/video/audio and their tracked messages — they were consumed by this generation.
  ctx.session.uploadedImageUrls = undefined;
  ctx.session.imageUploadMsgIds = undefined;
  ctx.session.uploadedVideoUrl = undefined;
  ctx.session.uploadedAudioUrl = undefined;
}

/** Models that accept video uploads (Kling Motion Control, Enhancement) */
const VIDEO_UPLOAD_MODELS = ['kling-motion', 'topaz', 'topaz-direct', 'wavespeed', 'wavespeed-pro'];

/** Models that accept audio uploads (Kling AI Avatar) */
const AUDIO_UPLOAD_MODELS = ['kling-avatar-pro', 'kling-avatar'];

/**
 * Handle video uploads for Kling Motion Control.
 * Stores the video URL in session. Accepts both native video messages and video documents.
 */
export async function handleVideoUpload(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) return;
  if (!ctx.message) return;

  // Extract file_id and dimensions from native video or video document
  let fileId: string | undefined;
  let videoWidth: number | undefined;
  let videoHeight: number | undefined;
  if ('video' in ctx.message && ctx.message.video) {
    fileId = ctx.message.video.file_id;
    videoWidth = ctx.message.video.width;
    videoHeight = ctx.message.video.height;
  } else if ('document' in ctx.message && ctx.message.document?.mime_type?.startsWith('video/')) {
    fileId = ctx.message.document.file_id;
  }
  if (!fileId) return;

  const lang = getLang(ctx);

  // Validate minimum video resolution (KieAI requires at least 340x340)
  const MIN_VIDEO_RES = 340;
  if (videoWidth && videoHeight && (videoWidth < MIN_VIDEO_RES || videoHeight < MIN_VIDEO_RES)) {
    const msg = lang === 'ru'
      ? `⚠️ Видео слишком маленькое (${videoWidth}x${videoHeight}). Минимальное разрешение: ${MIN_VIDEO_RES}x${MIN_VIDEO_RES}. Загрузите видео в более высоком качестве.`
      : `⚠️ Video resolution too low (${videoWidth}x${videoHeight}). Minimum required: ${MIN_VIDEO_RES}x${MIN_VIDEO_RES}. Please upload a higher quality video.`;
    await ctx.reply(msg);
    return;
  }

  if (!VIDEO_UPLOAD_MODELS.includes(ctx.session.videoFunction || '')) {
    const msg = lang === 'ru'
      ? '⚠️ Загрузка видео поддерживается только для моделей Motion Control и Enhancement. Отправьте текстовый запрос.'
      : '⚠️ Video upload is only supported for Motion Control and Enhancement models. Please send a text prompt.';
    await ctx.reply(msg);
    return;
  }

  try {
    // Try getFileLink first (fast, works for files <20MB)
    let videoUrl: string;
    try {
      const fileLink = await ctx.telegram.getFileLink(fileId);
      videoUrl = fileLink.href;
    } catch (fileLinkErr: any) {
      // getFileLink fails for files >20MB — fall back to downloading to our server
      const errMsg = fileLinkErr?.message || String(fileLinkErr);
      logger.info('getFileLink failed for video, falling back to direct download', {
        error: errMsg, fileId: fileId.slice(0, 20),
      });

      const statusMsg = await ctx.reply(lang === 'ru'
        ? '⏳ Загрузка видео (большой файл)...'
        : '⏳ Downloading video (large file)...');

      try {
        const { scheduleFileCleanup } = await import('../../utils/telegramFileDownload');
        videoUrl = await downloadTelegramFile(fileId, config.bot.token);
        scheduleFileCleanup(videoUrl);
      } catch (downloadErr) {
        logger.error('Direct video download also failed', { downloadErr });
        throw downloadErr;
      } finally {
        try { await ctx.telegram.deleteMessage(ctx.chat!.id, statusMsg.message_id); } catch { /* ignore */ }
      }
    }

    ctx.session.uploadedVideoUrl = videoUrl;

    // Capture video metadata for enhancement providers (Topaz Direct needs source dims)
    if ('video' in ctx.message! && (ctx.message as any).video) {
      const v = (ctx.message as any).video;
      ctx.session.videoMeta = {
        width: v.width,
        height: v.height,
        duration: v.duration,
        fileSize: v.file_size,
        mimeType: v.mime_type,
      };
    } else if ('document' in ctx.message! && (ctx.message as any).document) {
      // Capture metadata from document video too
      const d = (ctx.message as any).document;
      ctx.session.videoMeta = {
        width: undefined,
        height: undefined,
        duration: undefined,
        fileSize: d.file_size,
        mimeType: d.mime_type,
      };
    }

    // Enhancement models: video-only, no photo needed — show Generate button immediately
    const ENHANCEMENT_MODELS = ['topaz', 'topaz-direct', 'wavespeed', 'wavespeed-pro'];
    if (ENHANCEMENT_MODELS.includes(ctx.session.videoFunction || '')) {
      const msg = lang === 'ru'
        ? '✅ Видео загружено. Нажмите кнопку ниже для улучшения 👇'
        : '✅ Video uploaded. Tap the button below to enhance 👇';
      await ctx.reply(msg, Markup.inlineKeyboard([
        [Markup.button.callback(lang === 'ru' ? '💠 Улучшить видео' : '💠 Enhance Video', 'generate_now')],
      ]));
      return;
    }

    const hasImage = !!ctx.session.uploadedImageUrls?.length;
    if (hasImage) {
      const msg = lang === 'ru'
        ? '✅ Видео загружено. Фото и видео готовы.\nОтправьте ✍️ текст или нажмите кнопку ниже 👇'
        : '✅ Video uploaded. Photo and video ready.\nSend ✍️ a text prompt or tap the button below 👇';
      await ctx.reply(msg, Markup.inlineKeyboard([
        [Markup.button.callback(lang === 'ru' ? '▶️ Сгенерировать' : '▶️ Generate', 'generate_now')],
      ]));
    } else {
      const msg = lang === 'ru'
        ? '✅ Видео загружено. Теперь загрузите 📸 1 фото для анимации.'
        : '✅ Video uploaded. Now upload 📸 1 photo to animate.';
      await ctx.reply(msg);
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    logger.error('Failed to upload video', { error: errMsg, fileId: fileId?.slice(0, 20) });

    const isTooBig = errMsg.includes('too big') || errMsg.includes('file is too big');
    const msg = lang === 'ru'
      ? isTooBig
        ? '⚠️ Видео слишком большое для загрузки. Попробуйте отправить видео меньшего размера или сжать его перед отправкой.'
        : `⚠️ Не удалось загрузить видео. Попробуйте снова.\n<i>${errMsg.slice(0, 100)}</i>`
      : isTooBig
        ? '⚠️ Video file is too large. Please send a smaller or compressed video.'
        : `⚠️ Failed to upload video. Please try again.\n<i>${errMsg.slice(0, 100)}</i>`;
    await ctx.reply(msg, { parse_mode: 'HTML' });
  }
}

/**
 * Handle audio uploads for Kling AI Avatar.
 * Stores the audio URL in session.
 */
export async function handleAudioUpload(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) return;

  const lang = getLang(ctx);

  if (!AUDIO_UPLOAD_MODELS.includes(ctx.session.videoFunction || '')) {
    const msg = lang === 'ru'
      ? '⚠️ Загрузка аудио поддерживается только для моделей AI Avatar. Отправьте текстовый запрос.'
      : '⚠️ Audio upload is only supported for AI Avatar models. Please send a text prompt.';
    await ctx.reply(msg);
    return;
  }

  // Accept audio files, voice messages, and documents with audio MIME
  let fileId: string | undefined;
  let isVoiceMessage = false;
  if (ctx.message && 'audio' in ctx.message && ctx.message.audio) {
    fileId = ctx.message.audio.file_id;
  } else if (ctx.message && 'voice' in ctx.message && ctx.message.voice) {
    fileId = ctx.message.voice.file_id;
    isVoiceMessage = true;
  } else if (ctx.message && 'document' in ctx.message && ctx.message.document) {
    const mime = ctx.message.document.mime_type || '';
    if (mime.startsWith('audio/')) {
      fileId = ctx.message.document.file_id;
    }
  }

  if (!fileId) return;

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);
    let audioUrl = fileLink.href;

    // Voice messages are OGA (Opus/OGG) — convert to MP3 for API compatibility
    if (isVoiceMessage) {
      const convertingMsg = lang === 'ru'
        ? '🔄 Конвертация голосового сообщения...'
        : '🔄 Converting voice message...';
      const statusMsg = await ctx.reply(convertingMsg);
      try {
        // Download the OGA file
        const response = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const ogaBuffer = Buffer.from(response.data);

        // Convert to MP3
        const mp3Buffer = convertOgaToMp3(ogaBuffer);

        // Upload the MP3 back to Telegram (as audio to get a file URL)
        const sentAudio = await ctx.telegram.sendAudio(
          ctx.chat!.id,
          { source: mp3Buffer, filename: 'voice.mp3' },
          { disable_notification: true } as any,
        );
        await ctx.telegram.deleteMessage(ctx.chat!.id, sentAudio.message_id).catch(() => {});
        const audioFileLink = await ctx.telegram.getFileLink(sentAudio.audio.file_id);
        audioUrl = audioFileLink.href;
        logger.info('Voice message converted to MP3 and re-uploaded');
      } catch (convErr) {
        logger.error('Voice conversion failed:', convErr);
        const msg = lang === 'ru'
          ? '⚠️ Не удалось конвертировать голосовое. Попробуйте отправить аудиофайл (mp3, wav).'
          : '⚠️ Failed to convert voice message. Try sending an audio file (mp3, wav).';
        await ctx.reply(msg);
        return;
      } finally {
        await ctx.telegram.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      }
    }

    ctx.session.uploadedAudioUrl = audioUrl;

    const hasImage = !!ctx.session.uploadedImageUrls?.length;
    if (hasImage) {
      const msg = lang === 'ru'
        ? '✅ Аудио загружено. Фото и аудио готовы.\nОтправьте ✍️ текст или нажмите кнопку ниже 👇'
        : '✅ Audio uploaded. Photo and audio ready.\nSend ✍️ a text prompt or tap the button below 👇';
      await ctx.reply(msg, Markup.inlineKeyboard([
        [Markup.button.callback(lang === 'ru' ? '▶️ Сгенерировать' : '▶️ Generate', 'generate_now')],
      ]));
    } else {
      const msg = lang === 'ru'
        ? '✅ Аудио загружено. Теперь загрузите 📸 1 фото.'
        : '✅ Audio uploaded. Now upload 📸 1 photo.';
      await ctx.reply(msg);
    }
  } catch (error) {
    logger.error('Failed to get file link for audio:', error);
    const msg = lang === 'ru'
      ? 'Не удалось загрузить аудио. Попробуйте снова.'
      : 'Failed to upload audio. Please try again.';
    await ctx.reply(msg);
  }
}

/**
 * Handle the "Generate" inline button callback.
 * Triggers generation without requiring a text prompt.
 */
export async function handleGenerateCallback(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  if (!ctx.session.awaitingInput || !ctx.session.selectedModel) return;

  // Delete the message with the Generate button
  try {
    const msgId = ctx.callbackQuery && 'message' in ctx.callbackQuery ? ctx.callbackQuery.message?.message_id : undefined;
    if (msgId && ctx.chat) {
      await ctx.telegram.deleteMessage(ctx.chat.id, msgId).catch(() => {});
    }
  } catch { /* ignore */ }

  return processGeneration(ctx, '');
}

// Export helpers for use in other handlers (video.ts back navigation, etc.)
export { forceFlushPendingUploads, clearPendingUploads };
