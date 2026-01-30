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
  handleUserInput,
  handleCallbackQuery,
} from './handlers';
import { logger } from '../utils/logger';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.bot.token);

  // Middlewares
  bot.use(sessionMiddleware);
  bot.use(authMiddleware);

  // Commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('profile', handleProfile);

  // Main Menu buttons (EN & RU)
  bot.hears([en.buttons.textAi, ru.buttons.textAi], handleTextCategory);
  bot.hears([en.buttons.imageAi, ru.buttons.imageAi], handleImageCategory);
  bot.hears([en.buttons.videoAi, ru.buttons.videoAi], handleVideoCategory);
  bot.hears([en.buttons.audioAi, ru.buttons.audioAi], handleAudioCategory);
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

  // Back button - goes to help menu
  bot.hears([en.buttons.back, ru.buttons.back], handleHelp);

  // Callback queries (inline keyboard)
  bot.on('callback_query', handleCallbackQuery);

  // Text messages (user input for models)
  bot.on('text', handleUserInput);

  // Error handling
  bot.catch((err, ctx) => {
    logger.error('Bot error:', err);
    ctx.reply('An error occurred. Please try again.').catch(() => {});
  });

  return bot;
}
