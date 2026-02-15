import { BotContext, VideoFamily, VideoFunction } from '../types';
import {
  getVideoFamiliesKeyboard,
  getKlingModelsKeyboard,
  getVeoModelsKeyboard,
  getVideoModelMenuKeyboard,
} from '../keyboards/videoKeyboards';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService, modelAccessService, videoSettingsService } from '../../services';
import { Language, getLocale } from '../../locales';
import { sendTrackedMessage } from '../utils';
import { logger } from '../../utils/logger';
import { WalletCategory } from '@prisma/client';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  return `${amount} credits`;
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
    getKeyboard: () => null,
    singleModel: 'sora',
  },
  runway: {
    descriptionKey: 'videoRunwayFamilyDesc',
    getKeyboard: () => null,
    singleModel: 'runway',
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
  'runway': {
    modelSlug: 'runway',
    descriptionKey: 'videoRunwayDesc',
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
};

const FUNCTION_NAMES: Record<VideoFunction, { en: string; ru: string }> = {
  'kling': { en: 'Kling', ru: 'Kling' },
  'kling-pro': { en: 'Kling Pro', ru: 'Kling Pro' },
  'veo-fast': { en: 'Veo Fast', ru: 'Veo Fast' },
  'veo': { en: 'Veo Quality', ru: 'Veo Quality' },
  'sora': { en: 'Sora', ru: 'Sora' },
  'runway': { en: 'Runway', ru: 'Runway' },
  'luma': { en: 'Luma', ru: 'Luma' },
  'wan': { en: 'WAN', ru: 'WAN' },
};

// ── Handlers ────────────────────────────────────────────

/**
 * Show video family selection menu
 */
export async function handleVideoFamilyMenu(ctx: BotContext): Promise<void> {
  const lang = getLang(ctx);
  const l = getLocale(lang);

  if (ctx.session) {
    // Clear other category state
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
    ctx.session.inVideoMenu = true;
  }

  await sendTrackedMessage(ctx, (l.messages as any).videoFamilySelect, {
    parse_mode: 'HTML',
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
    const hint = (l.messages as any).videoUpgradeHint || 'Upgrade your subscription to access this feature.';
    await sendTrackedMessage(ctx, `🔒 "${funcName}" ${denied}\n\n${hint}`, { parse_mode: 'HTML' });
    return;
  }

  // Check balance (unless unlimited)
  if (!access.unlimited) {
    const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, 'VIDEO' as WalletCategory, model.tokenCost);
    if (!hasBalance) {
      const currentBalance = await walletService.getBalance(ctx.user.id, 'VIDEO' as WalletCategory);
      const message = `Insufficient balance. You need ${formatCredits(model.tokenCost)} but have ${formatCredits(currentBalance)}.`;
      await sendTrackedMessage(ctx, message);
      return;
    }
  }

  // Set session state
  ctx.session.videoFunction = functionId as VideoFunction;
  ctx.session.videoFamily = func.family;
  ctx.session.selectedModel = func.modelSlug;
  ctx.session.awaitingInput = true;

  // Send function description + reply keyboard
  const description = (l.messages as any)[func.descriptionKey] || '';
  await sendTrackedMessage(ctx, description, {
    parse_mode: 'HTML',
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
