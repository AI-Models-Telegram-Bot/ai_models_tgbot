import { Markup } from 'telegraf';
import { BotContext, ImageFamily, ImageFunction } from '../types';
import {
  getImageFamiliesKeyboard,
  getFluxModelsKeyboard,
  getDalleModelsKeyboard,
  getGoogleAIModelsKeyboard,
  getSeedreamModelsKeyboard,
  getImageModelMenuKeyboard,
} from '../keyboards/imageKeyboards';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService, modelAccessService, imageSettingsService } from '../../services';
import { Language, getLocale } from '../../locales';
import { sendTrackedMessage } from '../utils';
import { logger } from '../../utils/logger';
import { WalletCategory } from '@prisma/client';
import { config } from '../../config';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  return `${amount} credits`;
}

// ── Family configs ──────────────────────────────────────

interface ImageFamilyConfig {
  descriptionKey: string;
  getKeyboard: (lang: Language) => any;
  singleModel?: ImageFunction;
}

const IMAGE_FAMILIES: Record<ImageFamily, ImageFamilyConfig> = {
  flux: {
    descriptionKey: 'imageFluxFamilyDesc',
    getKeyboard: getFluxModelsKeyboard,
  },
  'dall-e': {
    descriptionKey: 'imageDalleFamilyDesc',
    getKeyboard: getDalleModelsKeyboard,
  },
  midjourney: {
    descriptionKey: 'imageMidjourneyFamilyDesc',
    getKeyboard: () => null,
    singleModel: 'midjourney',
  },
  'google-ai': {
    descriptionKey: 'imageGoogleAIFamilyDesc',
    getKeyboard: getGoogleAIModelsKeyboard,
  },
  seedream: {
    descriptionKey: 'imageSeedreamFamilyDesc',
    getKeyboard: getSeedreamModelsKeyboard,
  },
};

// ── Model configs ───────────────────────────────────────

interface ImageFunctionConfig {
  modelSlug: string;
  descriptionKey: string;
  family: ImageFamily;
}

const IMAGE_FUNCTIONS: Record<ImageFunction, ImageFunctionConfig> = {
  'flux-schnell': {
    modelSlug: 'flux-schnell',
    descriptionKey: 'imageFluxSchnellDesc',
    family: 'flux',
  },
  'flux-kontext': {
    modelSlug: 'flux-kontext',
    descriptionKey: 'imageFluxKontextDesc',
    family: 'flux',
  },
  'flux-dev': {
    modelSlug: 'flux-dev',
    descriptionKey: 'imageFluxDevDesc',
    family: 'flux',
  },
  'flux-pro': {
    modelSlug: 'flux-pro',
    descriptionKey: 'imageFluxProDesc',
    family: 'flux',
  },
  'dall-e-2': {
    modelSlug: 'dall-e-2',
    descriptionKey: 'imageDallE2Desc',
    family: 'dall-e',
  },
  'dall-e-3': {
    modelSlug: 'dall-e-3',
    descriptionKey: 'imageDallE3Desc',
    family: 'dall-e',
  },
  'midjourney': {
    modelSlug: 'midjourney',
    descriptionKey: 'imageMidjourneyDesc',
    family: 'midjourney',
  },
  'nano-banana': {
    modelSlug: 'nano-banana',
    descriptionKey: 'imageNanoBananaDesc',
    family: 'google-ai',
  },
  'nano-banana-pro': {
    modelSlug: 'nano-banana-pro',
    descriptionKey: 'imageNanoBananaProDesc',
    family: 'google-ai',
  },
  'seedream': {
    modelSlug: 'seedream',
    descriptionKey: 'imageSeedreamDesc',
    family: 'seedream',
  },
  'seedream-4.5': {
    modelSlug: 'seedream-4.5',
    descriptionKey: 'imageSeedream45Desc',
    family: 'seedream',
  },
};

const FUNCTION_NAMES: Record<ImageFunction, { en: string; ru: string }> = {
  'flux-schnell': { en: 'Flux Schnell', ru: 'Flux Schnell' },
  'flux-kontext': { en: 'Flux Kontext', ru: 'Flux Kontext' },
  'flux-dev': { en: 'Flux Dev', ru: 'Flux Dev' },
  'flux-pro': { en: 'Flux Pro', ru: 'Flux Pro' },
  'dall-e-2': { en: 'DALL-E 2', ru: 'DALL-E 2' },
  'dall-e-3': { en: 'DALL-E 3', ru: 'DALL-E 3' },
  'midjourney': { en: 'Midjourney', ru: 'Midjourney' },
  'nano-banana': { en: 'Nano Banana', ru: 'Nano Banana' },
  'nano-banana-pro': { en: 'Nano Banana Pro', ru: 'Nano Banana Pro' },
  'seedream': { en: 'Seedream 4.0', ru: 'Seedream 4.0' },
  'seedream-4.5': { en: 'Seedream 4.5', ru: 'Seedream 4.5' },
};

// ── Handlers ────────────────────────────────────────────

/**
 * Show image family selection menu
 */
export async function handleImageFamilyMenu(ctx: BotContext): Promise<void> {
  const lang = getLang(ctx);
  const l = getLocale(lang);

  if (ctx.session) {
    // Clear other category state
    ctx.session.inVideoMenu = false;
    ctx.session.videoFamily = undefined;
    ctx.session.videoFunction = undefined;
    ctx.session.inAudioMenu = false;
    ctx.session.audioFunction = undefined;
    // Set image state
    ctx.session.imageFunction = undefined;
    ctx.session.imageFamily = undefined;
    ctx.session.awaitingInput = false;
    ctx.session.selectedModel = undefined;
    ctx.session.inImageMenu = true;
  }

  await sendTrackedMessage(ctx, (l.messages as any).imageFamilySelect, {
    parse_mode: 'HTML',
    ...getImageFamiliesKeyboard(lang),
  });
}

/**
 * Handle selection of an image family
 */
export async function handleImageFamilySelection(ctx: BotContext, familyId: string): Promise<void> {
  if (!ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const family = IMAGE_FAMILIES[familyId as ImageFamily];

  if (!family) {
    logger.warn(`Unknown image family: ${familyId}`);
    return;
  }

  ctx.session.imageFamily = familyId as ImageFamily;
  ctx.session.imageFunction = undefined;
  ctx.session.awaitingInput = false;
  ctx.session.selectedModel = undefined;

  // Single-model families skip the model list
  if (family.singleModel) {
    return handleImageFunctionSelection(ctx, family.singleModel);
  }

  const description = (l.messages as any)[family.descriptionKey] || '';
  await sendTrackedMessage(ctx, description, {
    parse_mode: 'HTML',
    ...family.getKeyboard(lang),
  });
}

/**
 * Handle selection of a specific image model
 */
export async function handleImageFunctionSelection(ctx: BotContext, functionId: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);
  const func = IMAGE_FUNCTIONS[functionId as ImageFunction];

  if (!func) {
    logger.warn(`Unknown image function: ${functionId}`);
    return;
  }

  // Check if model exists in DB
  const model = await modelService.getBySlug(func.modelSlug);
  if (!model) {
    await sendTrackedMessage(ctx, l.messages.errorModelNotFound, getMainKeyboard(lang));
    return;
  }

  // Check subscription access
  const access = await modelAccessService.canUseModel(ctx.user.id, model.slug, 'IMAGE' as WalletCategory);
  if (!access.allowed) {
    const funcName = FUNCTION_NAMES[functionId as ImageFunction]?.[lang] || functionId;
    const denied = (l.messages as any).imageAccessDenied || 'is not available on your current plan.';
    await sendTrackedMessage(ctx, `🔒 "${funcName}" ${denied}`, {
      parse_mode: 'HTML',
      ...getMainKeyboard(lang),
    });
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

  // Set session state
  ctx.session.imageFunction = functionId as ImageFunction;
  ctx.session.imageFamily = func.family;
  ctx.session.selectedModel = func.modelSlug;
  ctx.session.awaitingInput = true;

  // Send function description + reply keyboard
  const description = (l.messages as any)[func.descriptionKey] || '';
  await sendTrackedMessage(ctx, description, {
    parse_mode: 'HTML',
    ...getImageModelMenuKeyboard(lang, func.modelSlug, ctx.from?.id),
  });
}

// ── Aspect ratio → provider option mapping ──────────────

const ASPECT_TO_PIAPI_DIMS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1184, height: 888 },
  '3:4': { width: 888, height: 1184 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
  '21:9': { width: 1536, height: 640 },
};

const ASPECT_TO_DALLE_SIZE: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
};

/**
 * Load image options from user settings and format for providers
 */
export async function getImageOptionsForFunction(
  userId: string,
  telegramId: bigint,
  imageFunction: ImageFunction,
): Promise<Record<string, unknown>> {
  try {
    const settings = await imageSettingsService.getModelSettingsByTelegramId(telegramId, imageFunction);
    const aspectRatio = settings.aspectRatio || '1:1';

    const options: Record<string, unknown> = {
      aspectRatio,
      // PiAPI format
      ...(ASPECT_TO_PIAPI_DIMS[aspectRatio] || { width: 1024, height: 1024 }),
      // DALL-E format
      dalleSize: ASPECT_TO_DALLE_SIZE[aspectRatio] || '1024x1024',
    };

    // DALL-E 3 specific options
    if (imageFunction === 'dall-e-3') {
      if (settings.quality) options.quality = settings.quality;
      if (settings.style) options.style = settings.style;
    }

    // Midjourney specific options
    if (imageFunction === 'midjourney') {
      if (settings.version) options.version = settings.version;
      if (settings.stylize !== undefined) options.stylize = settings.stylize;
      if (settings.speed) options.speed = settings.speed;
      if (settings.weirdness !== undefined) options.weirdness = settings.weirdness;
    }

    // Nano Banana Pro specific options
    if (imageFunction === 'nano-banana-pro') {
      if (settings.resolution) options.resolution = settings.resolution;
    }

    // Seedream 4.5 specific options
    if (imageFunction === 'seedream-4.5') {
      if (settings.resolution) options.resolution = settings.resolution;
    }

    return options;
  } catch (error) {
    logger.warn('Failed to load image settings, using defaults', { error });
    return {};
  }
}

/**
 * Check if a family has only one model (skips model list)
 */
export function isSingleModelFamily(familyId: string): boolean {
  return !!IMAGE_FAMILIES[familyId as ImageFamily]?.singleModel;
}
