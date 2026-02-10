import { Markup } from 'telegraf';
import { BotContext } from '../types';
import { getMainKeyboard, getHelpKeyboard, getProfileKeyboard, getLanguageKeyboard } from '../keyboards/mainKeyboard';
import { formatTokens } from '../../utils/helpers';
import { userService, walletService } from '../../services';
import { Language, t, getLocale } from '../../locales';
import { config } from '../../config';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

export async function handleStart(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.welcome, getMainKeyboard(lang));
}

export async function handleHelp(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.help, { parse_mode: 'HTML', ...getHelpKeyboard(lang) });
}

export async function handleInstructions(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);

  const message = t(lang, 'messages.instructions', {
    referralBonus: config.tokens.referralBonus,
  });

  await ctx.reply(message, { parse_mode: 'HTML', ...getHelpKeyboard(lang) });
}

export async function handleSupport(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.support, { parse_mode: 'HTML', ...getHelpKeyboard(lang) });
}

export async function handleCommunity(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.community, { parse_mode: 'HTML', ...getHelpKeyboard(lang) });
}

export async function handlePrivacy(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.privacy, { parse_mode: 'HTML', ...getHelpKeyboard(lang) });
}

export async function handleLanguageMenu(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  await ctx.reply(l.messages.selectLanguage, { parse_mode: 'HTML', ...getLanguageKeyboard(lang) });
}

export async function handleLanguageChange(ctx: BotContext, newLang: Language): Promise<void> {
  if (!ctx.user) return;

  // Update user language in database
  ctx.user = await userService.updateLanguage(ctx.user.id, newLang);

  const l = getLocale(newLang);
  await ctx.reply(l.messages.languageChanged, { ...getHelpKeyboard(newLang) });
}

export async function handleProfile(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);

  const stats = await userService.getReferralStats(ctx.user.id);
  const botInfo = await ctx.telegram.getMe();
  const balances = await walletService.getAllBalances(ctx.user.id);

  const message = t(lang, 'messages.profile', {
    username: ctx.user.username || 'not set',
    textBalance: balances.text,
    imageBalance: balances.image,
    videoBalance: balances.video,
    audioBalance: balances.audio,
    totalSpent: ctx.user.totalSpent.toFixed(2),
    referralCode: ctx.user.referralCode,
    referralCount: stats.count,
    referralBonus: formatTokens(stats.totalBonus),
    botUsername: botInfo.username || '',
  });

  if (config.webapp.url) {
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.webApp('Open Full Profile', config.webapp.url),
      ]),
    });
  } else {
    await ctx.reply(message, { parse_mode: 'HTML', ...getProfileKeyboard(lang) });
  }
}

export async function handleMainMenu(ctx: BotContext): Promise<void> {
  if (!ctx.user) return;
  const lang = getLang(ctx);
  const l = getLocale(lang);

  // Clear all category menu state
  if (ctx.session) {
    ctx.session.inAudioMenu = false;
    ctx.session.audioFunction = undefined;
    ctx.session.inImageMenu = false;
    ctx.session.imageFamily = undefined;
    ctx.session.imageFunction = undefined;
    ctx.session.inVideoMenu = false;
    ctx.session.videoFamily = undefined;
    ctx.session.videoFunction = undefined;
    ctx.session.awaitingInput = false;
    ctx.session.selectedModel = undefined;
  }

  await ctx.reply(l.messages.chooseOption, getMainKeyboard(lang));
}

export async function handleBack(ctx: BotContext): Promise<void> {
  // Default back goes to help menu
  await handleHelp(ctx);
}
