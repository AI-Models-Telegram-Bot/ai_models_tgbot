import { Job } from 'bull';
import { Telegram } from 'telegraf';
import { WalletCategory } from '@prisma/client';
import { config } from '../config';
import { GenerationJobData, GenerationJobResult } from './types';
import { textQueue, imageQueue, videoQueue, audioQueue } from './index';
import { TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult, GenerationResult } from '../providers/BaseProvider';
import { getProviderManager } from '../config/providerFactory';
import { modelService, requestService, walletService } from '../services';
import { markdownToTelegramHtml, truncateText } from '../utils/helpers';
import { logger } from '../utils/logger';
import { t, getLocale } from '../locales';
import type { Language } from '../locales';

// Create Telegram API instance per job using the originating bot's token.
// This ensures responses go to the correct bot (dev vs prod) when
// multiple bot instances share the same Redis queues.
function getTelegram(job: Job<GenerationJobData>): Telegram {
  return new Telegram(job.data.botToken || config.bot.token);
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
      case 'IMAGE':
        generationResponse = await manager.generateWithModel('IMAGE', 'generateImage', modelSlug, input, job.data.imageOptions);
        break;
      case 'VIDEO':
        generationResponse = await manager.generateWithModel('VIDEO', 'generateVideo', modelSlug, input);
        break;
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

    // Delete processing message
    try {
      await telegram.deleteMessage(chatId, processingMsgId);
    } catch {
      // Message may already be deleted
    }

    // Send result to user
    if ('text' in result) {
      const textResult = result as TextGenerationResult;
      await requestService.markCompleted(requestId, { text: textResult.text, actualProvider });

      const formattedText = markdownToTelegramHtml(textResult.text);
      const maxLength = 4000;

      if (formattedText.length > maxLength) {
        const parts = splitMessage(formattedText, maxLength);
        for (const part of parts) {
          await telegram.sendMessage(chatId, part, { parse_mode: 'HTML' });
        }
      } else {
        await telegram.sendMessage(chatId, formattedText, { parse_mode: 'HTML' });
      }
    } else if ('imageUrl' in result) {
      const imageResult = result as ImageGenerationResult;
      await requestService.markCompleted(requestId, { fileUrl: imageResult.imageUrl, actualProvider });
      await telegram.sendPhoto(chatId, { url: imageResult.imageUrl }, { caption: truncateText(input, 200) });
    } else if ('videoUrl' in result) {
      const videoResult = result as VideoGenerationResult;
      await requestService.markCompleted(requestId, { fileUrl: videoResult.videoUrl, actualProvider });
      await telegram.sendVideo(chatId, { url: videoResult.videoUrl }, { caption: truncateText(input, 200) });
    } else if ('audioBuffer' in result && result.audioBuffer) {
      const audioResult = result as AudioGenerationResult;
      await requestService.markCompleted(requestId, { actualProvider });
      await telegram.sendVoice(chatId, { source: audioResult.audioBuffer! });
    } else if ('audioUrl' in result && result.audioUrl) {
      const audioResult = result as AudioGenerationResult;
      await requestService.markCompleted(requestId, { fileUrl: audioResult.audioUrl, actualProvider });
      await telegram.sendAudio(chatId, { url: audioResult.audioUrl! });
    }

    // Send "done" message with main keyboard so user can navigate
    const l = getLocale(lang);
    await telegram.sendMessage(chatId, l.messages.done, getMainKeyboardMarkup(lang));

    await job.progress(100);
    return { requestId, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Generation job failed', {
      jobId: job.id, requestId, error: errorMsg,
    });

    // Delete processing message on error too
    try {
      await telegram.deleteMessage(chatId, processingMsgId);
    } catch {
      // Ignore
    }

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
        description: `Refund: generation failed`,
      });
    } catch (refundError) {
      logger.error('Failed to refund credits', { refundError });
    }

    // Notify user with error message + main keyboard
    const errorMessage = t(lang, 'messages.errorRefunded', {
      error: errorMsg,
    });
    await telegram.sendMessage(chatId, errorMessage, getMainKeyboardMarkup(lang)).catch(() => {});

    // DO NOT re-throw: we already refunded and notified the user.
    // Re-throwing would cause Bull to retry, sending duplicate error messages.
    return { requestId, success: false, error: errorMsg };
  }
}

/** Start processing on all queues */
export function startWorkers(): void {
  const textConcurrency = parseInt(process.env.TEXT_WORKERS || '5', 10);
  const imageConcurrency = parseInt(process.env.IMAGE_WORKERS || '3', 10);
  const videoConcurrency = parseInt(process.env.VIDEO_WORKERS || '2', 10);
  const audioConcurrency = parseInt(process.env.AUDIO_WORKERS || '3', 10);

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
