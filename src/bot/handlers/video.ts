import { Markup } from 'telegraf';
import { BotContext, VideoFamily, VideoFunction } from '../types';
import {
  getVideoFamiliesKeyboard,
  getKlingModelsKeyboard,
  getVeoModelsKeyboard,
  getSoraModelsKeyboard,
  getRunwayModelsKeyboard,
  getSeedanceModelsKeyboard,
  getVideoModelMenuKeyboard,
} from '../keyboards/videoKeyboards';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService, modelAccessService, videoSettingsService } from '../../services';
import { Language, getLocale } from '../../locales';
import { sendTrackedMessage } from '../utils';
import { logger } from '../../utils/logger';
import { WalletCategory } from '@prisma/client';
import { config } from '../../config';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  const formatted = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
  return `${formatted} token${amount === 1 ? '' : 's'}`;
}

// ── Family configs ──────────────────────────────────────

interface VideoFamilyConfig {
  descriptionKey: string;
  getKeyboard: (lang: Language) => any;
  singleModel?: VideoFunction;
}

const VIDEO_FAMILIES: Record<VideoFamily, VideoFamilyConfig> = {
  kling: {
    descriptionKey: 'videoKlingFamilyDesc',
    getKeyboard: getKlingModelsKeyboard,
  },
  veo: {
    descriptionKey: 'videoVeoFamilyDesc',
    getKeyboard: getVeoModelsKeyboard,
  },
  sora: {
    descriptionKey: 'videoSoraFamilyDesc',
    getKeyboard: getSoraModelsKeyboard,
  },
  runway: {
    descriptionKey: 'videoRunwayFamilyDesc',
    getKeyboard: getRunwayModelsKeyboard,
  },
  luma: {
    descriptionKey: 'videoLumaFamilyDesc',
    getKeyboard: () => null,
    singleModel: 'luma',
  },
  wan: {
    descriptionKey: 'videoWanFamilyDesc',
    getKeyboard: () => null,
    singleModel: 'wan',
  },
  seedance: {
    descriptionKey: 'videoSeedanceFamilyDesc',
    getKeyboard: getSeedanceModelsKeyboard,
  },
  enhancement: {
    descriptionKey: 'videoEnhancementFamilyDesc',
    getKeyboard: () => null,
    singleModel: 'topaz',
  },
};

// ── Model configs ───────────────────────────────────────

interface VideoFunctionConfig {
  modelSlug: string;
  descriptionKey: string;
  family: VideoFamily;
  hasSettings: boolean;
}

const VIDEO_FUNCTIONS: Record<VideoFunction, VideoFunctionConfig> = {
  'kling': {
    modelSlug: 'kling',
    descriptionKey: 'videoKlingDesc',
    family: 'kling',
    hasSettings: true,
  },
  'kling-pro': {
    modelSlug: 'kling-pro',
    descriptionKey: 'videoKlingProDesc',
    family: 'kling',
    hasSettings: true,
  },
  'kling-3.0': {
    modelSlug: 'kling-3.0',
    descriptionKey: 'videoKling30Desc',
    family: 'kling',
    hasSettings: true,
  },
  'kling-motion': {
    modelSlug: 'kling-motion',
    descriptionKey: 'videoKlingMotionDesc',
    family: 'kling',
    hasSettings: true,
  },
  'kling-avatar-pro': {
    modelSlug: 'kling-avatar-pro',
    descriptionKey: 'videoKlingAvatarProDesc',
    family: 'kling',
    hasSettings: false,
  },
  'kling-avatar': {
    modelSlug: 'kling-avatar',
    descriptionKey: 'videoKlingAvatarDesc',
    family: 'kling',
    hasSettings: false,
  },
  'veo-fast': {
    modelSlug: 'veo-fast',
    descriptionKey: 'videoVeoFastDesc',
    family: 'veo',
    hasSettings: true,
  },
  'veo': {
    modelSlug: 'veo',
    descriptionKey: 'videoVeoDesc',
    family: 'veo',
    hasSettings: true,
  },
  'sora': {
    modelSlug: 'sora',
    descriptionKey: 'videoSoraDesc',
    family: 'sora',
    hasSettings: true,
  },
  'sora-pro': {
    modelSlug: 'sora-pro',
    descriptionKey: 'videoSoraProDesc',
    family: 'sora',
    hasSettings: true,
  },
  'runway': {
    modelSlug: 'runway',
    descriptionKey: 'videoRunwayDesc',
    family: 'runway',
    hasSettings: true,
  },
  'runway-gen4': {
    modelSlug: 'runway-gen4',
    descriptionKey: 'videoRunwayGen4Desc',
    family: 'runway',
    hasSettings: true,
  },
  'luma': {
    modelSlug: 'luma',
    descriptionKey: 'videoLumaDesc',
    family: 'luma',
    hasSettings: false,
  },
  'wan': {
    modelSlug: 'wan',
    descriptionKey: 'videoWanDesc',
    family: 'wan',
    hasSettings: false,
  },
  'seedance-lite': {
    modelSlug: 'seedance-lite',
    descriptionKey: 'videoSeedanceLiteDesc',
    family: 'seedance',
    hasSettings: true,
  },
  'seedance-1-pro': {
    modelSlug: 'seedance-1-pro',
    descriptionKey: 'videoSeedanceProDesc',
    family: 'seedance',
    hasSettings: true,
  },
  'seedance-fast': {
    modelSlug: 'seedance-fast',
    descriptionKey: 'videoSeedanceFastDesc',
    family: 'seedance',
    hasSettings: true,
  },
  'seedance': {
    modelSlug: 'seedance',
    descriptionKey: 'videoSeedanceDesc',
    family: 'seedance',
    hasSettings: true,
  },
  'topaz': {
    modelSlug: 'topaz',
    descriptionKey: 'videoTopazDesc',
    family: 'enhancement',
    hasSettings: true,
  },
};

const FUNCTION_NAMES: Record<VideoFunction, { en: string; ru: string }> = {
  'kling': { en: 'Kling', ru: 'Kling' },
  'kling-pro': { en: 'Kling Pro', ru: 'Kling Pro' },
  'kling-3.0': { en: 'Kling 3.0', ru: 'Kling 3.0' },
  'kling-motion': { en: 'Kling Motion Control', ru: 'Kling Motion Control' },
  'kling-avatar-pro': { en: 'Kling Avatar Pro', ru: 'Kling Avatar Pro' },
  'kling-avatar': { en: 'Kling Avatar', ru: 'Kling Avatar' },
  'veo-fast': { en: 'Veo Fast', ru: 'Veo Fast' },
  'veo': { en: 'Veo Quality', ru: 'Veo Quality' },
  'sora': { en: 'Sora 2', ru: 'Sora 2' },
  'sora-pro': { en: 'Sora 2 Pro', ru: 'Sora 2 Pro' },
  'runway': { en: 'Runway Gen-4 Turbo', ru: 'Runway Gen-4 Turbo' },
  'runway-gen4': { en: 'Runway Gen-4', ru: 'Runway Gen-4' },
  'luma': { en: 'Luma', ru: 'Luma' },
  'wan': { en: 'WAN', ru: 'WAN' },
  'seedance-lite': { en: 'Seedance 1.0 Lite', ru: 'Seedance 1.0 Lite' },
  'seedance-1-pro': { en: 'Seedance 1.0 Pro', ru: 'Seedance 1.0 Pro' },
  'seedance-fast': { en: 'Seedance 1.0 Fast', ru: 'Seedance 1.0 Fast' },
  'seedance': { en: 'Seedance 1.5 Pro', ru: 'Seedance 1.5 Pro' },
  'topaz': { en: 'Topaz AI', ru: 'Topaz AI' },
};

// ── Handlers ────────────────────────────────────────────

/**
 * Show video family selection menu
 */
export async function handleVideoFamilyMenu(ctx: BotContext): Promise<void> {
  const lang = getLang(ctx);
  const l = getLocale(lang);

  if (ctx.session) {
    // Clear other category state (including chat)
    ctx.session.activeConversationId = undefined;
    ctx.session.chatModelPicker = false;
    ctx.session.inImageMenu = false;
    ctx.session.imageFamily = undefined;
    ctx.session.imageFunction = undefined;
    ctx.session.inAudioMenu = false;
    ctx.session.audioFunction = undefined;
    // Set video state
    ctx.session.videoFunction = undefined;
    ctx.session.videoFamily = undefined;
    ctx.session.awaitingInput = false;
    ctx.session.selectedModel = undefined;
    ctx.session.uploadedImageUrls = undefined;
    ctx.session.imageUploadMsgIds = undefined;
    ctx.session.uploadedVideoUrl = undefined;
    ctx.session.uploadedAudioUrl = undefined;
    ctx.session.inVideoMenu = true;
  }

  await sendTrackedMessage(ctx, (l.messages as any).videoFamilySelect, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...getVideoFamiliesKeyboard(lang),
  });
}

/**
 * Handle selection of a video family
 */
export async function handleVideoFamilySelection(ctx: BotContext, familyId: string): Promise<void> {
  if (!ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const family = VIDEO_FAMILIES[familyId as VideoFamily];

  if (!family) {
    logger.warn(`Unknown video family: ${familyId}`);
    return;
  }

  ctx.session.videoFamily = familyId as VideoFamily;
  ctx.session.videoFunction = undefined;
  ctx.session.awaitingInput = false;
  ctx.session.selectedModel = undefined;

  // Single-model families skip the model list
  if (family.singleModel) {
    return handleVideoFunctionSelection(ctx, family.singleModel);
  }

  const description = (l.messages as any)[family.descriptionKey] || '';
  await sendTrackedMessage(ctx, description, {
    parse_mode: 'HTML',
    ...family.getKeyboard(lang),
  });
}

/**
 * Handle selection of a specific video model
 */
export async function handleVideoFunctionSelection(ctx: BotContext, functionId: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const func = VIDEO_FUNCTIONS[functionId as VideoFunction];

  if (!func) {
    logger.warn(`Unknown video function: ${functionId}`);
    return;
  }

  // Check if model exists in DB
  const model = await modelService.getBySlug(func.modelSlug);
  if (!model) {
    await sendTrackedMessage(ctx, l.messages.errorModelNotFound, getMainKeyboard(lang));
    return;
  }

  // Check subscription access
  const access = await modelAccessService.canUseModel(ctx.user.id, model.slug, 'VIDEO' as WalletCategory);
  if (!access.allowed) {
    const funcName = FUNCTION_NAMES[functionId as VideoFunction]?.[lang] || functionId;
    const denied = (l.messages as any).videoAccessDenied || 'is not available on your current plan.';
    await sendTrackedMessage(ctx, `🔒 "${funcName}" ${denied}`, {
      parse_mode: 'HTML',
      ...getMainKeyboard(lang),
    });
    // Send upgrade button as separate inline message
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

  // Check balance (unless unlimited)
  if (!access.unlimited) {
    const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, model.tokenCost);
    if (!hasBalance) {
      const currentBalance = await walletService.getBalance(ctx.user.id);
      const message = `Insufficient balance. You need ${formatCredits(model.tokenCost)} but have ${formatCredits(currentBalance)}.`;
      await sendTrackedMessage(ctx, message, getMainKeyboard(lang));
      return;
    }
  }

  // Set session state — clear any leftover images/video/audio from previous model
  ctx.session.videoFunction = functionId as VideoFunction;
  ctx.session.videoFamily = func.family;
  ctx.session.selectedModel = func.modelSlug;
  ctx.session.awaitingInput = true;
  ctx.session.uploadedImageUrls = undefined;
  ctx.session.imageUploadMsgIds = undefined;
  ctx.session.uploadedVideoUrl = undefined;
  ctx.session.uploadedAudioUrl = undefined;

  // Send function description + reply keyboard
  const description = (l.messages as any)[func.descriptionKey] || '';
  const ideasLink = lang === 'ru'
    ? '\n\n💡 <a href="https://t.me/VseOnix_1">Идеи для видео</a>'
    : '\n\n💡 <a href="https://t.me/VseOnix_1">Video ideas</a>';
  await sendTrackedMessage(ctx, description + ideasLink, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...getVideoModelMenuKeyboard(lang, func.modelSlug, func.hasSettings, ctx.from?.id),
  });
}

// ── Load video options for generation ────────────────────

/**
 * Load video options from user settings and format for providers
 */
export async function getVideoOptionsForFunction(
  userId: string,
  telegramId: bigint,
  videoFunction: VideoFunction,
): Promise<Record<string, unknown>> {
  try {
    const settings = await videoSettingsService.getModelSettingsByTelegramId(telegramId, videoFunction);
    const options: Record<string, unknown> = {};

    if (settings.aspectRatio) {
      options.aspectRatio = settings.aspectRatio;
    }
    if (settings.duration !== undefined) {
      options.duration = settings.duration;
    }
    if (settings.resolution) {
      options.resolution = settings.resolution;
    }
    if (settings.generateAudio !== undefined) {
      options.generateAudio = settings.generateAudio;
    }
    // Kling-specific fields
    if (settings.version) {
      options.version = settings.version;
    }
    if (settings.negativePrompt) {
      options.negativePrompt = settings.negativePrompt;
    }
    if (settings.cfgScale !== undefined) {
      options.cfgScale = settings.cfgScale;
    }
    if (settings.enableAudio !== undefined) {
      options.enableAudio = settings.enableAudio;
    }
    // Veo-specific: image processing mode
    if (settings.mode) {
      options.mode = settings.mode;
    }
    // Seedance-specific: camera lock
    if (settings.cameraFixed !== undefined) {
      options.cameraFixed = settings.cameraFixed;
    }
    // Kling 3.0: quality mode + sound
    if (settings.qualityMode) {
      options.qualityMode = settings.qualityMode;
    }
    if (settings.sound !== undefined) {
      options.sound = settings.sound;
    }
    // Motion Control: character orientation
    if (settings.characterOrientation) {
      options.characterOrientation = settings.characterOrientation;
    }
    // Topaz AI: enhancement settings
    if (settings.upscale) options.upscale = settings.upscale;
    if (settings.fps !== undefined) options.fps = settings.fps;
    if (settings.topazModel) options.topazModel = settings.topazModel;
    if (settings.addNoise !== undefined) options.addNoise = settings.addNoise;
    if (settings.fixCompression !== undefined) options.fixCompression = settings.fixCompression;
    if (settings.improveDetail !== undefined) options.improveDetail = settings.improveDetail;
    if (settings.sharpen !== undefined) options.sharpen = settings.sharpen;
    if (settings.reduceNoise !== undefined) options.reduceNoise = settings.reduceNoise;
    if (settings.dehalo !== undefined) options.dehalo = settings.dehalo;
    if (settings.antiAlias !== undefined) options.antiAlias = settings.antiAlias;
    if (settings.focusFix) options.focusFix = settings.focusFix;
    if (settings.grain) options.grain = settings.grain;

    return options;
  } catch (error) {
    logger.warn('Failed to load video settings, using defaults', { error });
    return {};
  }
}

/**
 * Check if a family has only one model (skips model list)
 */
export function isSingleVideoFamily(familyId: string): boolean {
  return !!VIDEO_FAMILIES[familyId as VideoFamily]?.singleModel;
}
