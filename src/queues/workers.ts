import { Job } from 'bull';
import { Telegram } from 'telegraf';
import { WalletCategory } from '@prisma/client';
import { config } from '../config';
import { GenerationJobData, GenerationJobResult } from './types';
import { textQueue, imageQueue, videoQueue, audioQueue } from './index';
import { TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult, GenerationResult } from '../providers/BaseProvider';
import { getProviderManager } from '../config/providerFactory';
import { modelService, requestService, walletService } from '../services';
import { prisma } from '../config/database';
import { getRedis } from '../config/redis';
import { markdownToTelegramHtml, truncateText, sanitizeErrorForUser } from '../utils/helpers';
import { logger } from '../utils/logger';
import { t } from '../locales';
import type { Language } from '../locales';

// Create Telegram API instance per job using the originating bot's token.
// This ensures responses go to the correct bot (dev vs prod) when
// multiple bot instances share the same Redis queues.
function getTelegram(job: Job<GenerationJobData>): Telegram {
  const jobToken = job.data.botToken;
  const fallbackToken = config.bot.token;
  const usedToken = jobToken || fallbackToken;
  logger.info('getTelegram: resolving bot token', {
    jobId: job.id,
    hasJobToken: !!jobToken,
    jobTokenPrefix: jobToken ? jobToken.slice(0, 10) + '...' : 'NONE',
    fallbackTokenPrefix: fallbackToken ? fallbackToken.slice(0, 10) + '...' : 'NONE',
    usedTokenPrefix: usedToken ? usedToken.slice(0, 10) + '...' : 'NONE',
  });
  return new Telegram(usedToken);
}

/**
 * Build a reply_markup with the main keyboard buttons for the user's language.
 * Workers don't have bot context, so we construct the keyboard manually.
 */
function getMainKeyboardMarkup(lang: Language) {
  const buttons = lang === 'ru'
    ? [
        [{ text: '🤖 Текст AI' }, { text: '🖼 Изображения AI' }],
        [{ text: '🎬 Видео AI' }, { text: '🎵 Аудио AI' }],
        [{ text: '👤 Профиль' }, { text: '❓ Помощь' }],
      ]
    : [
        [{ text: '🤖 Text AI' }, { text: '🖼 Image AI' }],
        [{ text: '🎬 Video AI' }, { text: '🎵 Audio AI' }],
        [{ text: '👤 Profile' }, { text: '❓ Help' }],
      ];

  return {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
    },
  };
}

/**
 * Build model-active keyboard for result messages.
 * Shows Settings (webapp) + Back + Main menu so user can tweak settings
 * and send another prompt without navigating back through menus.
 */
function getModelActiveKeyboardMarkup(opts: {
  lang: Language;
  modelCategory: string;
  modelSlug: string;
  telegramId?: number;
}) {
  const { lang, modelCategory, modelSlug, telegramId } = opts;
  const webappUrl = config.webapp?.url;
  const back = lang === 'ru' ? '⬅️ Назад' : '⬅️ Back';
  const mainMenu = lang === 'ru' ? '🏠 Главное меню' : '🏠 Main menu';

  const rows: any[][] = [];

  if (webappUrl && telegramId) {
    let settingsUrl: string | null = null;
    let settingsLabel: string | null = null;

    if (modelCategory === 'IMAGE') {
      settingsUrl = `${webappUrl}/image/settings?model=${encodeURIComponent(modelSlug)}&tgid=${telegramId}`;
      settingsLabel = lang === 'ru' ? '🎛️ Настройки изображения' : '🎛️ Image Settings';
    } else if (modelCategory === 'VIDEO') {
      settingsUrl = `${webappUrl}/video/settings?model=${encodeURIComponent(modelSlug)}&tgid=${telegramId}`;
      settingsLabel = lang === 'ru' ? '🎛️ Настройки видео' : '🎛️ Video Settings';
    } else if (modelCategory === 'AUDIO') {
      // Derive audio settings page from model slug
      const audioSettingsMap: Record<string, string> = {
        'elevenlabs-voice': 'elevenlabs-voice',
        'suno': 'suno',
        'sound-generator': 'sound-generator',
      };
      const audioPage = audioSettingsMap[modelSlug];
      if (audioPage) {
        settingsUrl = `${webappUrl}/audio/${audioPage}?tgid=${telegramId}`;
        const audioLabels: Record<string, Record<string, string>> = {
          'elevenlabs-voice': { en: '🎛️ Voice Settings', ru: '🎛️ Настройки голоса' },
          'suno': { en: '🎛️ SUNO Settings', ru: '🎛️ Настройки SUNO' },
          'sound-generator': { en: '🎛️ Sound Settings', ru: '🎛️ Настройки звука' },
        };
        settingsLabel = audioLabels[audioPage]?.[lang] || audioLabels[audioPage]?.en || null;
      }
    }

    if (settingsUrl && settingsLabel) {
      rows.push([{ text: settingsLabel, web_app: { url: settingsUrl } }]);
    }
  }

  rows.push([{ text: back }, { text: mainMenu }]);

  return {
    reply_markup: {
      keyboard: rows,
      resize_keyboard: true,
    },
  };
}

/** Aspect ratio → video pixel dimensions (720p base) for Telegram previews */
const VIDEO_DIMS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1':  { width: 720, height: 720 },
  '4:3':  { width: 960, height: 720 },
  '3:4':  { width: 720, height: 960 },
  '3:2':  { width: 1080, height: 720 },
  '2:3':  { width: 720, height: 1080 },
};

/** Settings label translations */
const SETTINGS_LABELS: Record<string, Record<string, string>> = {
  en: {
    aspectRatio: 'Aspect Ratio', duration: 'Duration', resolution: 'Resolution',
    quality: 'Quality', style: 'Style', version: 'Version', generateAudio: 'Audio',
    stylize: 'Stylize', voiceId: 'Voice', cfgScale: 'Creativity', enableAudio: 'Audio',
    speed: 'Speed', weirdness: 'Weirdness', mode: 'Mode', cameraFixed: 'Camera Lock',
  },
  ru: {
    aspectRatio: 'Формат', duration: 'Длительность', resolution: 'Разрешение',
    quality: 'Качество', style: 'Стиль', version: 'Версия', generateAudio: 'Аудио',
    stylize: 'Стилизация', voiceId: 'Голос', cfgScale: 'Творчество', enableAudio: 'Аудио',
    speed: 'Скорость', weirdness: 'Необычность', mode: 'Режим', cameraFixed: 'Камера',
  },
};

/** Internal settings keys that should NOT be shown to users */
const HIDDEN_SETTINGS = new Set(['model', 'width', 'height', 'dalleSize', 'negativePrompt']);

/** Escape HTML special chars for Telegram */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Format a rich HTML caption for generation results */
function formatResultCaption(opts: {
  input: string;
  modelName: string;
  category: string;
  settingsApplied?: Record<string, unknown>;
  creditsCost: number;
  remainingBalance: number;
  lang: Language;
}): string {
  const { input, modelName, category, settingsApplied, creditsCost, remainingBalance, lang } = opts;
  const labels = SETTINGS_LABELS[lang] || SETTINGS_LABELS.en;
  const lines: string[] = [];

  // Prompt — italic
  lines.push(`🎯 <i>${escapeHtml(truncateText(input, 200))}</i>`);
  lines.push('');

  // Model name — bold
  lines.push(`<b>${escapeHtml(modelName)}</b>`);

  // Settings — each on its own line
  if (settingsApplied && Object.keys(settingsApplied).length > 0) {
    const settingParts: string[] = [];
    for (const [key, value] of Object.entries(settingsApplied)) {
      if (value === undefined || value === null || HIDDEN_SETTINGS.has(key)) continue;

      // Hide enableAudio when false (only show when audio is ON)
      if (key === 'enableAudio' && !value) continue;
      // Hide weirdness when 0 (default — not interesting to show)
      if (key === 'weirdness' && (value === 0 || value === '0')) continue;

      const label = labels[key] || key;
      let displayVal = String(value);
      if (key === 'duration') displayVal = `${value}${lang === 'ru' ? 'с' : 's'}`;
      if (key === 'generateAudio' || key === 'enableAudio') {
        displayVal = value ? (lang === 'ru' ? 'Да' : 'Yes') : (lang === 'ru' ? 'Нет' : 'No');
      }
      if (key === 'version') displayVal = `v${value}`;
      settingParts.push(`⚙️ ${label}: <b>${escapeHtml(displayVal)}</b>`);
    }
    if (settingParts.length > 0) {
      lines.push(settingParts.join('\n'));
    }
  }

  // Balance line
  lines.push('');
  const balanceLabel = lang === 'ru' ? 'Баланс' : 'Balance';
  lines.push(`💰 -${creditsCost} ⚡ · ${balanceLabel}: <b>${remainingBalance} ⚡</b>`);

  // Continue hint — let user know they can send another prompt
  const hint = t(lang, 'messages.continueHint', { modelName: escapeHtml(modelName) });
  lines.push('');
  lines.push(hint);

  return lines.join('\n');
}

/** Process a generation job */
async function processGenerationJob(job: Job<GenerationJobData>): Promise<GenerationJobResult> {
  const {
    requestId, userId, chatId, modelSlug, input,
    processingMsgId, language, creditsCost, priceItemCode, walletCategory,
  } = job.data;
  const lang = language as Language;
  const telegram = getTelegram(job);

  logger.info(`Processing ${job.data.modelCategory} job`, {
    jobId: job.id, requestId, modelSlug, userId,
  });

  try {
    const model = await modelService.getBySlug(modelSlug);
    if (!model) throw new Error(`Model not found: ${modelSlug}`);

    await requestService.markProcessing(requestId);
    await job.progress(10);

    // Use ProviderManager for automatic fallback across multiple providers
    const manager = getProviderManager();
    let generationResponse: { result: GenerationResult; provider: string };

    switch (model.category) {
      case 'TEXT':
        generationResponse = await manager.generateWithModel('TEXT', 'generateText', modelSlug, input);
        break;
      case 'IMAGE': {
        const imgOpts = { ...job.data.imageOptions };
        if (job.data.inputImageUrls?.length) {
          imgOpts.inputImageUrls = job.data.inputImageUrls;
        }
        generationResponse = await manager.generateWithModel('IMAGE', 'generateImage', modelSlug, input, imgOpts);
        break;
      }
      case 'VIDEO': {
        const videoOpts = { ...job.data.videoOptions };
        if (job.data.inputImageUrls?.length) {
          videoOpts.inputImageUrls = job.data.inputImageUrls;
        }
        generationResponse = await manager.generateWithModel('VIDEO', 'generateVideo', modelSlug, input, videoOpts);
        break;
      }
      case 'AUDIO':
        generationResponse = await manager.generateWithModel('AUDIO', 'generateAudio', modelSlug, input, job.data.audioOptions);
        break;
      default:
        throw new Error(`Unsupported model category: ${model.category}`);
    }

    const result = generationResponse.result;
    const actualProvider = generationResponse.provider;

    logger.info(`Request ${requestId} served by provider: ${actualProvider}`);
    await job.progress(80);

    const isWeb = job.data.source === 'web';

    if (isWeb) {
      // ── Web delivery: update ChatMessage + publish via Redis pub/sub ──
      const webMessageId = job.data.webMessageId;
      let contentValue: string | null = null;
      let fileUrlValue: string | null = null;

      if ('text' in result) {
        const textResult = result as TextGenerationResult;
        contentValue = textResult.text;
        await requestService.markCompleted(requestId, { text: textResult.text, actualProvider });
      } else if ('imageUrl' in result) {
        const imageResult = result as ImageGenerationResult;
        fileUrlValue = imageResult.imageUrl;
        await requestService.markCompleted(requestId, { fileUrl: imageResult.imageUrl, actualProvider });
      } else if ('videoUrl' in result) {
        const videoResult = result as VideoGenerationResult;
        fileUrlValue = videoResult.videoUrl;
        await requestService.markCompleted(requestId, { fileUrl: videoResult.videoUrl, actualProvider });
      } else if ('audioBuffer' in result && result.audioBuffer) {
        // audioBuffer has no URL; mark completed without fileUrl
        await requestService.markCompleted(requestId, { actualProvider });
        contentValue = '[Audio generated - buffer only]';
      } else if ('audioUrl' in result && result.audioUrl) {
        const audioResult = result as AudioGenerationResult;
        fileUrlValue = audioResult.audioUrl!;
        await requestService.markCompleted(requestId, { fileUrl: audioResult.audioUrl!, actualProvider });
      }

      // Update ChatMessage record
      if (webMessageId) {
        await prisma.chatMessage.update({
          where: { id: webMessageId },
          data: {
            content: contentValue,
            fileUrl: fileUrlValue,
            status: 'COMPLETED',
          },
        });
      }

      // Publish result to Redis pub/sub for SSE clients
      try {
        const redis = getRedis();
        await redis.publish('chat:updates', JSON.stringify({
          messageId: webMessageId,
          requestId,
          content: contentValue,
          fileUrl: fileUrlValue,
          status: 'COMPLETED',
        }));
      } catch (pubErr) {
        logger.error('Failed to publish web chat update to Redis', { pubErr });
      }
    } else {
      // ── Telegram delivery: existing flow ──
      // Delete processing message
      try {
        await telegram.deleteMessage(chatId, processingMsgId);
      } catch {
        // Message may already be deleted
      }

      // Send result with model-active keyboard (Settings + Back + Main menu)
      const kb = getModelActiveKeyboardMarkup({
        lang, modelCategory: job.data.modelCategory, modelSlug, telegramId: job.data.telegramId,
      });

      // Fetch remaining balance for the result message
      let remainingBalance = 0;
      try {
        remainingBalance = await walletService.getBalance(userId);
      } catch {
        // Non-critical; balance will show as 0
      }

      const displayName = job.data.modelName || model.name;
      const caption = formatResultCaption({
        input,
        modelName: displayName,
        category: job.data.modelCategory,
        settingsApplied: job.data.settingsApplied,
        creditsCost,
        remainingBalance,
        lang,
      });

      if ('text' in result) {
        const textResult = result as TextGenerationResult;
        await requestService.markCompleted(requestId, { text: textResult.text, actualProvider });

        const formattedText = markdownToTelegramHtml(textResult.text);
        const continueHint = t(lang, 'messages.continueHint', { modelName: escapeHtml(displayName) });
        const footer = `\n\n📊 <i>${displayName}</i>\n💰 <i>${lang === 'ru' ? 'Списано' : 'Deducted'}: ⚡-${creditsCost}. ${lang === 'ru' ? 'Баланс' : 'Balance'}: ⚡${remainingBalance}</i>\n\n${continueHint}`;
        const maxLength = 4000 - footer.length;

        if (formattedText.length > maxLength) {
          const parts = splitMessage(formattedText, maxLength);
          for (let i = 0; i < parts.length; i++) {
            const isLast = i === parts.length - 1;
            const partText = isLast ? `${parts[i]}${footer}` : parts[i];
            await telegram.sendMessage(chatId, partText, {
              parse_mode: 'HTML',
              ...(isLast ? kb : {}),
            });
          }
        } else {
          await telegram.sendMessage(chatId, `${formattedText}${footer}`, { parse_mode: 'HTML', ...kb });
        }
      } else if ('imageUrl' in result) {
        const imageResult = result as ImageGenerationResult;
        await requestService.markCompleted(requestId, { fileUrl: imageResult.imageUrl, actualProvider });
        try {
          await telegram.sendPhoto(chatId, { url: imageResult.imageUrl }, { caption, parse_mode: 'HTML', ...kb });
        } catch (sendErr: any) {
          const errMsg = sendErr?.message || String(sendErr);
          if (errMsg.includes('too big for a photo') || errMsg.includes('file is too big')) {
            // Image exceeds Telegram's 10 MB photo limit — compress and retry
            logger.info('Image too large for Telegram, compressing...', { url: imageResult.imageUrl.slice(0, 80) });
            const { compressImageForTelegram } = await import('../utils/imageResize');
            const compressed = await compressImageForTelegram(imageResult.imageUrl);
            await telegram.sendPhoto(chatId, { source: compressed }, { caption, parse_mode: 'HTML', ...kb });
          } else {
            throw sendErr;
          }
        }
      } else if ('videoUrl' in result) {
        const videoResult = result as VideoGenerationResult;
        await requestService.markCompleted(requestId, { fileUrl: videoResult.videoUrl, actualProvider });
        // Pass width/height so Telegram renders the preview in the correct aspect ratio
        const arStr = (job.data.settingsApplied?.aspectRatio as string) || '';
        const dims = VIDEO_DIMS[arStr];
        await telegram.sendVideo(chatId, { url: videoResult.videoUrl }, {
          caption,
          parse_mode: 'HTML',
          ...kb,
          supports_streaming: true,
          ...(dims && { width: dims.width, height: dims.height }),
        });
      } else if ('audioBuffer' in result && result.audioBuffer) {
        const audioResult = result as AudioGenerationResult;
        await requestService.markCompleted(requestId, { actualProvider });
        await telegram.sendVoice(chatId, { source: audioResult.audioBuffer! }, { caption, parse_mode: 'HTML', ...kb });
      } else if ('audioUrl' in result && result.audioUrl) {
        const audioResult = result as AudioGenerationResult;
        await requestService.markCompleted(requestId, { fileUrl: audioResult.audioUrl, actualProvider });
        await telegram.sendAudio(chatId, { url: audioResult.audioUrl! }, { caption, parse_mode: 'HTML', ...kb });
      }
    }

    await job.progress(100);
    return { requestId, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const maxAttempts = job.opts.attempts ?? 1;
    const isFinalAttempt = job.attemptsMade >= maxAttempts - 1;

    logger.error('Generation job failed', {
      jobId: job.id, requestId, error: errorMsg,
      attempt: job.attemptsMade + 1, maxAttempts, isFinalAttempt,
    });

    // If NOT the final attempt, re-throw so Bull retries with backoff.
    // Don't refund or notify user yet — the next attempt may succeed.
    if (!isFinalAttempt) {
      logger.info(`Retrying job ${job.id} (attempt ${job.attemptsMade + 1}/${maxAttempts})`, {
        requestId, modelSlug,
      });
      throw error;
    }

    // ── Final attempt failed: refund credits and notify user ──
    const isWeb = job.data.source === 'web';

    // Mark request as failed
    try {
      await requestService.markFailed(requestId, errorMsg, false);
    } catch (e) {
      logger.error('Failed to mark request as failed', { e });
    }

    // Refund credits
    try {
      await walletService.refundCredits(userId, walletCategory as WalletCategory, creditsCost, {
        requestId,
        priceItemCode,
        description: `Refund: generation failed after ${maxAttempts} attempts`,
      });
    } catch (refundError) {
      logger.error('Failed to refund credits', { refundError });
    }

    if (isWeb) {
      // ── Web error delivery ──
      const webMessageId = job.data.webMessageId;

      // Sanitize error for web users too
      const webUserError = sanitizeErrorForUser(errorMsg, lang);

      // Update ChatMessage to FAILED
      if (webMessageId) {
        try {
          await prisma.chatMessage.update({
            where: { id: webMessageId },
            data: { content: webUserError, status: 'FAILED' },
          });
        } catch (dbErr) {
          logger.error('Failed to update web ChatMessage to FAILED', { dbErr });
        }
      }

      // Publish error to Redis pub/sub
      try {
        const redis = getRedis();
        await redis.publish('chat:updates', JSON.stringify({
          messageId: webMessageId,
          requestId,
          content: webUserError,
          fileUrl: null,
          status: 'FAILED',
        }));
      } catch (pubErr) {
        logger.error('Failed to publish web chat error to Redis', { pubErr });
      }
    } else {
      // ── Telegram error delivery ──
      // Delete processing message on error too
      try {
        await telegram.deleteMessage(chatId, processingMsgId);
      } catch {
        // Ignore
      }

      // Notify user with sanitized error message + model-active keyboard (so they can retry)
      const userFriendlyError = sanitizeErrorForUser(errorMsg, lang);
      const errorMessage = t(lang, 'messages.errorRefunded', {
        error: userFriendlyError,
      });
      await telegram.sendMessage(chatId, errorMessage, {
        parse_mode: 'HTML',
        ...getModelActiveKeyboardMarkup({
          lang, modelCategory: job.data.modelCategory, modelSlug, telegramId: job.data.telegramId,
        }),
      }).catch(() => {});
    }

    // On final attempt: return failure (don't re-throw) to prevent further retries.
    return { requestId, success: false, error: errorMsg };
  }
}

/** Start processing on all queues */
export function startWorkers(): void {
  const textConcurrency = parseInt(process.env.TEXT_WORKERS || '10', 10);
  const imageConcurrency = parseInt(process.env.IMAGE_WORKERS || '5', 10);
  const videoConcurrency = parseInt(process.env.VIDEO_WORKERS || '3', 10);
  const audioConcurrency = parseInt(process.env.AUDIO_WORKERS || '5', 10);

  textQueue.process(textConcurrency, processGenerationJob);
  imageQueue.process(imageConcurrency, processGenerationJob);
  videoQueue.process(videoConcurrency, processGenerationJob);
  audioQueue.process(audioConcurrency, processGenerationJob);

  logger.info('Queue workers started', {
    text: textConcurrency,
    image: imageConcurrency,
    video: videoConcurrency,
    audio: audioConcurrency,
  });
}

function splitMessage(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    let splitIndex = remaining.lastIndexOf('\n\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf('\n', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    parts.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return parts;
}
