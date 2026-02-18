import { Telegraf } from 'telegraf';
import { config } from '../config';
import { BotContext } from './types';
import { authMiddleware } from './middlewares/auth';
import { sessionMiddleware } from './middlewares/session';
import {
  handleStart,
  handleHelp,
  handleProfile,
  handleMainMenu,
  handleInstructions,
  handleSupport,
  handleCommunity,
  handlePrivacy,
  handleLanguageMenu,
  handleLanguageChange,
  handleTextCategory,
  handleImageCategory,
  handleVideoCategory,
  handleAudioCategory,
  handleAudioFunctionSelection,
  handleImageFamilyMenu,
  handleImageFamilySelection,
  handleImageFunctionSelection,
  handleUserInput,
  handlePhotoInput,
  handleCallbackQuery,
  handleWebAppData,
  handlePreCheckoutQuery,
  handleSuccessfulPayment,
  isSingleModelFamily,
  handleVideoFamilyMenu,
  handleVideoFamilySelection,
  handleVideoFunctionSelection,
  isSingleVideoFamily,
} from './handlers';
import { deleteMessage } from './utils';
import { logger } from '../utils/logger';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

// All known reply-keyboard button texts (EN + RU) for identifying navigation presses
const allButtonTexts = new Set([
  ...Object.values(en.buttons),
  ...Object.values(ru.buttons),
]);

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.bot.token);

  // Middlewares
  bot.use(sessionMiddleware);
  bot.use(authMiddleware);

  // Clean chat middleware:
  // 1) Delete user button presses and commands (but keep prompts)
  // 2) Delete previous bot navigation message when user takes a new action
  bot.use(async (ctx, next) => {
    if (ctx.message && 'text' in ctx.message) {
      const text = ctx.message.text;
      const isButtonOrCommand = text.startsWith('/') || allButtonTexts.has(text);
      if (isButtonOrCommand) {
        ctx.deleteMessage().catch(() => {});
      }

      // Delete previous bot navigation message
      if (ctx.session?.lastBotMessageId) {
        await deleteMessage(ctx, ctx.session.lastBotMessageId);
        ctx.session.lastBotMessageId = undefined;
      }
    }

    // Also delete previous nav message when photo is received (image-to-video flow)
    if (ctx.message && 'photo' in ctx.message) {
      if (ctx.session?.lastBotMessageId) {
        await deleteMessage(ctx, ctx.session.lastBotMessageId);
        ctx.session.lastBotMessageId = undefined;
      }
    }

    return next();
  });

  // Commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('profile', handleProfile);

  // Main Menu buttons (EN & RU)
  bot.hears([en.buttons.textAi, ru.buttons.textAi], handleTextCategory);
  bot.hears([en.buttons.imageAi, ru.buttons.imageAi], handleImageCategory);
  bot.hears([en.buttons.videoAi, ru.buttons.videoAi], handleVideoCategory);
  bot.hears([en.buttons.audioAi, ru.buttons.audioAi], handleAudioCategory);

  // Audio function buttons (EN & RU)
  bot.hears([en.buttons.audioElevenLabs, ru.buttons.audioElevenLabs], (ctx) => handleAudioFunctionSelection(ctx, 'elevenlabs_voice'));
  bot.hears([en.buttons.audioVoiceCloning, ru.buttons.audioVoiceCloning], (ctx) => handleAudioFunctionSelection(ctx, 'voice_cloning'));
  bot.hears([en.buttons.audioSuno, ru.buttons.audioSuno], (ctx) => handleAudioFunctionSelection(ctx, 'suno'));
  bot.hears([en.buttons.audioSoundGen, ru.buttons.audioSoundGen], (ctx) => handleAudioFunctionSelection(ctx, 'sound_generator'));

  // Image family buttons (EN & RU)
  bot.hears([en.buttons.imageFluxFamily, ru.buttons.imageFluxFamily], (ctx) => handleImageFamilySelection(ctx, 'flux'));
  bot.hears([en.buttons.imageDalleFamily, ru.buttons.imageDalleFamily], (ctx) => handleImageFamilySelection(ctx, 'dall-e'));
  bot.hears([en.buttons.imageMidjourneyFamily, ru.buttons.imageMidjourneyFamily], (ctx) => handleImageFamilySelection(ctx, 'midjourney'));
  bot.hears([en.buttons.imageGoogleAIFamily, ru.buttons.imageGoogleAIFamily], (ctx) => handleImageFamilySelection(ctx, 'google-ai'));

  // Image model buttons (EN & RU)
  bot.hears([en.buttons.imageFluxSchnell, ru.buttons.imageFluxSchnell], (ctx) => handleImageFunctionSelection(ctx, 'flux-schnell'));
  bot.hears([en.buttons.imageFluxKontext, ru.buttons.imageFluxKontext], (ctx) => handleImageFunctionSelection(ctx, 'flux-kontext'));
  bot.hears([en.buttons.imageFluxDev, ru.buttons.imageFluxDev], (ctx) => handleImageFunctionSelection(ctx, 'flux-dev'));
  bot.hears([en.buttons.imageFluxPro, ru.buttons.imageFluxPro], (ctx) => handleImageFunctionSelection(ctx, 'flux-pro'));
  bot.hears([en.buttons.imageDallE2, ru.buttons.imageDallE2], (ctx) => handleImageFunctionSelection(ctx, 'dall-e-2'));
  bot.hears([en.buttons.imageDallE3, ru.buttons.imageDallE3], (ctx) => handleImageFunctionSelection(ctx, 'dall-e-3'));

  // Video family buttons (EN & RU)
  bot.hears([en.buttons.videoKlingFamily, ru.buttons.videoKlingFamily], (ctx) => handleVideoFamilySelection(ctx, 'kling'));
  bot.hears([en.buttons.videoVeoFamily, ru.buttons.videoVeoFamily], (ctx) => handleVideoFamilySelection(ctx, 'veo'));
  bot.hears([en.buttons.videoSoraFamily, ru.buttons.videoSoraFamily], (ctx) => handleVideoFamilySelection(ctx, 'sora'));
  bot.hears([en.buttons.videoRunwayFamily, ru.buttons.videoRunwayFamily], (ctx) => handleVideoFamilySelection(ctx, 'runway'));
  bot.hears([en.buttons.videoLumaFamily, ru.buttons.videoLumaFamily], (ctx) => handleVideoFamilySelection(ctx, 'luma'));
  bot.hears([en.buttons.videoWanFamily, ru.buttons.videoWanFamily], (ctx) => handleVideoFamilySelection(ctx, 'wan'));
  bot.hears([en.buttons.videoSeedanceFamily, ru.buttons.videoSeedanceFamily], (ctx) => handleVideoFamilySelection(ctx, 'seedance'));

  // Video model buttons (EN & RU)
  bot.hears([en.buttons.videoKling, ru.buttons.videoKling], (ctx) => handleVideoFunctionSelection(ctx, 'kling'));
  bot.hears([en.buttons.videoKlingPro, ru.buttons.videoKlingPro], (ctx) => handleVideoFunctionSelection(ctx, 'kling-pro'));
  bot.hears([en.buttons.videoVeoFast, ru.buttons.videoVeoFast], (ctx) => handleVideoFunctionSelection(ctx, 'veo-fast'));
  bot.hears([en.buttons.videoVeoQuality, ru.buttons.videoVeoQuality], (ctx) => handleVideoFunctionSelection(ctx, 'veo'));

  bot.hears([en.buttons.profile, ru.buttons.profile], handleProfile);
  bot.hears([en.buttons.help, ru.buttons.help], handleHelp);

  // Help Menu buttons (EN & RU)
  bot.hears([en.buttons.instructions, ru.buttons.instructions], handleInstructions);
  bot.hears([en.buttons.support, ru.buttons.support], handleSupport);
  bot.hears([en.buttons.community, ru.buttons.community], handleCommunity);
  bot.hears([en.buttons.privacy, ru.buttons.privacy], handlePrivacy);
  bot.hears([en.buttons.language, ru.buttons.language], handleLanguageMenu);
  bot.hears([en.buttons.mainMenu, ru.buttons.mainMenu], handleMainMenu);

  // Profile Menu buttons (EN & RU)
  // TODO: Implement topUp, referrals, history handlers

  // Language selection (EN & RU)
  bot.hears([en.buttons.langEnglish, ru.buttons.langEnglish], (ctx) => handleLanguageChange(ctx, 'en'));
  bot.hears([en.buttons.langRussian, ru.buttons.langRussian], (ctx) => handleLanguageChange(ctx, 'ru'));

  // Back button - context-aware navigation
  bot.hears([en.buttons.back, ru.buttons.back], async (ctx) => {
    // Audio: function → audio menu
    if (ctx.session?.audioFunction) {
      ctx.session.audioFunction = undefined;
      ctx.session.awaitingInput = false;
      ctx.session.selectedModel = undefined;
      return handleAudioCategory(ctx);
    }
    // Image: model selected → back to family models list (or families menu for single-model families)
    if (ctx.session?.imageFunction) {
      const family = ctx.session.imageFamily;
      ctx.session.imageFunction = undefined;
      ctx.session.awaitingInput = false;
      ctx.session.selectedModel = undefined;
      if (family && isSingleModelFamily(family)) {
        ctx.session.imageFamily = undefined;
        return handleImageFamilyMenu(ctx);
      }
      if (family) {
        return handleImageFamilySelection(ctx, family);
      }
      return handleImageFamilyMenu(ctx);
    }
    // Image: family selected → back to families menu
    if (ctx.session?.imageFamily) {
      ctx.session.imageFamily = undefined;
      return handleImageFamilyMenu(ctx);
    }
    // Image: families menu → main menu
    if (ctx.session?.inImageMenu) {
      ctx.session.inImageMenu = false;
      return handleMainMenu(ctx);
    }
    // Video: model selected → back to family models list (or families menu for single-model families)
    if (ctx.session?.videoFunction) {
      const family = ctx.session.videoFamily;
      ctx.session.videoFunction = undefined;
      ctx.session.awaitingInput = false;
      ctx.session.selectedModel = undefined;
      ctx.session.uploadedImageUrls = undefined;
      if (family && isSingleVideoFamily(family)) {
        ctx.session.videoFamily = undefined;
        return handleVideoFamilyMenu(ctx);
      }
      if (family) {
        return handleVideoFamilySelection(ctx, family);
      }
      return handleVideoFamilyMenu(ctx);
    }
    // Video: family selected → back to families menu
    if (ctx.session?.videoFamily) {
      ctx.session.videoFamily = undefined;
      return handleVideoFamilyMenu(ctx);
    }
    // Video: families menu → main menu
    if (ctx.session?.inVideoMenu) {
      ctx.session.inVideoMenu = false;
      return handleMainMenu(ctx);
    }
    return handleMainMenu(ctx);
  });

  // Callback queries (inline keyboard)
  bot.on('callback_query', handleCallbackQuery);

  // Payment handlers (Telegram Stars)
  bot.on('pre_checkout_query', handlePreCheckoutQuery);
  bot.on('message', (ctx, next) => {
    if (ctx.message && 'successful_payment' in ctx.message) {
      return handleSuccessfulPayment(ctx);
    }
    return next();
  });

  // WebApp data handler (must be before generic text handler)
  bot.on('message', (ctx, next) => {
    if (ctx.message && 'web_app_data' in ctx.message) {
      return handleWebAppData(ctx);
    }
    return next();
  });

  // Photo messages (image upload for video models)
  bot.on('photo', handlePhotoInput);

  // Text messages (user input for models)
  bot.on('text', handleUserInput);

  // Error handling
  bot.catch((err, ctx) => {
    logger.error('Bot error:', err);
    ctx.reply('An error occurred. Please try again.').catch(() => {});
  });

  // Set bot menu button to open WebApp
  if (config.webapp.url) {
    bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: 'Profile',
        web_app: { url: config.webapp.url },
      },
    }).catch((err) => logger.warn('Failed to set menu button', err));
  }

  return bot;
}
