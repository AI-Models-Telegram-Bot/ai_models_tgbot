import { BotContext, AudioFunction } from '../types';
import {
  getAudioFunctionsKeyboard,
  getElevenLabsMenuKeyboard,
  getVoiceCloningMenuKeyboard,
  getSunoMenuKeyboard,
  getSoundGenMenuKeyboard,
} from '../keyboards/audioKeyboards';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService, requestService, modelAccessService, audioSettingsService } from '../../services';
import { Language, t, getLocale } from '../../locales';
import { sendTrackedMessage, deleteMessage } from '../utils';
import { enqueueGeneration } from '../../queues/producer';
import { logger } from '../../utils/logger';
import { WalletCategory } from '@prisma/client';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  return `${amount} credits`;
}

interface AudioFunctionConfig {
  modelSlug: string;
  descriptionKey: string;
  getKeyboard: (lang: Language) => any;
}

const AUDIO_FUNCTIONS: Record<AudioFunction, AudioFunctionConfig> = {
  elevenlabs_voice: {
    modelSlug: 'elevenlabs-tts',
    descriptionKey: 'audioElevenLabsDesc',
    getKeyboard: getElevenLabsMenuKeyboard,
  },
  voice_cloning: {
    modelSlug: 'xtts-v2',
    descriptionKey: 'audioVoiceCloningDesc',
    getKeyboard: getVoiceCloningMenuKeyboard,
  },
  suno: {
    modelSlug: 'suno',
    descriptionKey: 'audioSunoDesc',
    getKeyboard: getSunoMenuKeyboard,
  },
  sound_generator: {
    modelSlug: 'bark',
    descriptionKey: 'audioSoundGenDesc',
    getKeyboard: getSoundGenMenuKeyboard,
  },
};

/**
 * Show audio function selection menu (replaces old model list)
 */
export async function handleAudioFunctionMenu(ctx: BotContext): Promise<void> {
  const lang = getLang(ctx);
  const l = getLocale(lang);

  // Clear any active audio state
  if (ctx.session) {
    ctx.session.audioFunction = undefined;
    ctx.session.awaitingInput = false;
    ctx.session.selectedModel = undefined;
  }

  await ctx.reply(l.messages.audioFunctionSelect, {
    parse_mode: 'HTML',
    ...getAudioFunctionsKeyboard(lang),
  });
}

/**
 * Handle selection of an audio function (from inline callback)
 */
export async function handleAudioFunctionSelection(ctx: BotContext, functionId: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const func = AUDIO_FUNCTIONS[functionId as AudioFunction];

  if (!func) {
    logger.warn(`Unknown audio function: ${functionId}`);
    return;
  }

  // Check if model exists
  const model = await modelService.getBySlug(func.modelSlug);
  if (!model) {
    await ctx.reply(l.messages.errorModelNotFound, getMainKeyboard(lang));
    return;
  }

  // Check subscription access
  const access = await modelAccessService.canUseModel(ctx.user.id, model.slug, 'AUDIO' as WalletCategory);
  if (!access.allowed) {
    await ctx.reply(
      `🔒 ${access.reason}\n\nUpgrade your subscription to access this feature.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Check balance (unless unlimited)
  if (!access.unlimited) {
    const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, 'AUDIO' as WalletCategory, model.tokenCost);
    if (!hasBalance) {
      const currentBalance = await walletService.getBalance(ctx.user.id, 'AUDIO' as WalletCategory);
      const message = t(lang, 'messages.errorInsufficientBalance', {
        required: formatCredits(model.tokenCost),
        current: formatCredits(currentBalance),
      });
      await ctx.reply(message);
      return;
    }
  }

  // Set session state
  ctx.session.audioFunction = functionId as AudioFunction;
  ctx.session.selectedModel = func.modelSlug;
  ctx.session.awaitingInput = true;

  // Send function description + reply keyboard
  const description = (l.messages as any)[func.descriptionKey] || '';
  await ctx.reply(description, {
    parse_mode: 'HTML',
    ...func.getKeyboard(lang),
  });
}

/**
 * Build audio options from user's saved settings for the current function
 */
export async function getAudioOptionsForFunction(
  userId: string,
  telegramId: bigint,
  audioFunction: AudioFunction,
): Promise<Record<string, unknown>> {
  try {
    const settings = await audioSettingsService.getByTelegramId(telegramId);
    const defaults = audioSettingsService.getDefaults();

    switch (audioFunction) {
      case 'elevenlabs_voice': {
        const s = (settings.elevenLabsSettings as any) || defaults.elevenLabsSettings;
        return {
          voiceId: s.voiceId,
          modelId: s.modelId,
          stability: s.stability,
          similarityBoost: s.similarityBoost,
        };
      }
      case 'voice_cloning': {
        // Voice cloning uses reference audio - no special options from settings
        return {};
      }
      case 'suno': {
        const s = (settings.sunoSettings as any) || defaults.sunoSettings;
        return {
          sunoMode: s.mode,
          sunoStyle: s.style,
        };
      }
      case 'sound_generator': {
        const s = (settings.soundGenSettings as any) || defaults.soundGenSettings;
        return {
          textTemp: s.textTemp,
          waveformTemp: s.waveformTemp,
        };
      }
      default:
        return {};
    }
  } catch (error) {
    logger.warn('Failed to load audio settings, using defaults', { error });
    return {};
  }
}
