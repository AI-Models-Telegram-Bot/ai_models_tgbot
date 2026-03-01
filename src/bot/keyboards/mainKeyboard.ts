import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

export function getMainKeyboard(lang: Language) {
  const l = getLocale(lang);

  const profileButton = config.webapp.url
    ? Markup.button.webApp(l.buttons.profile, config.webapp.url)
    : l.buttons.profile;

  const rows = [
    [l.buttons.textAi, l.buttons.imageAi],
    config.features.audioEnabled
      ? [l.buttons.videoAi, l.buttons.audioAi]
      : [l.buttons.videoAi],
    [profileButton, l.buttons.help],
  ];

  return Markup.keyboard(rows).resize();
}

export function getHelpKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.instructions],
    [l.buttons.support, l.buttons.community],
    [l.buttons.language, l.buttons.privacy],
    [l.buttons.mainMenu],
  ]).resize();
}

export function getProfileKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.topUp],
    [l.buttons.referrals, l.buttons.history],
    [l.buttons.mainMenu],
  ]).resize();
}

export function getLanguageKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.langEnglish, l.buttons.langRussian],
    [l.buttons.back],
  ]).resize();
}

export function getCancelKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.cancel],
  ]).resize();
}

export function getBackKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.back],
  ]).resize();
}

export function getWelcomeInlineKeyboard(lang: Language) {
  const isRu = lang === 'ru';
  const rows: any[][] = [
    [
      Markup.button.callback(isRu ? '🎨 Хочу крутую картинку' : '🎨 Create a cool image', 'quick_image'),
      Markup.button.callback(isRu ? '🎬 Хочу крутое видео' : '🎬 Create a cool video', 'quick_video'),
    ],
  ];

  // Second row: referral webapp + ideas channel URL
  const row2: any[] = [];
  if (config.webapp.url) {
    row2.push(Markup.button.webApp(isRu ? '💰 Зарабатывать с нами' : '💰 Earn with us', `${config.webapp.url}/referral`));
  }
  row2.push(Markup.button.url(isRu ? '💡 Идеи и промпты' : '💡 Ideas & prompts', 'https://t.me/VseOnixprompt_ii_photo'));
  rows.push(row2);

  return Markup.inlineKeyboard(rows);
}

// Legacy exports for compatibility (will be removed)
export const mainKeyboard = getMainKeyboard('en');
export const cancelKeyboard = getCancelKeyboard('en');
export const backKeyboard = getBackKeyboard('en');
