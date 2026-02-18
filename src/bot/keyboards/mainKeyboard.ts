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

// Legacy exports for compatibility (will be removed)
export const mainKeyboard = getMainKeyboard('en');
export const cancelKeyboard = getCancelKeyboard('en');
export const backKeyboard = getBackKeyboard('en');
