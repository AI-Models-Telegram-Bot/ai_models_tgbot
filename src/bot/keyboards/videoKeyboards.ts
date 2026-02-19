import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

/**
 * Reply keyboard: 6 video family buttons (3×2 grid) + main menu
 */
export function getVideoFamiliesKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.videoKlingFamily, l.buttons.videoVeoFamily],
    [l.buttons.videoSoraFamily, l.buttons.videoRunwayFamily],
    [l.buttons.videoLumaFamily, l.buttons.videoWanFamily],
    [l.buttons.videoSeedanceFamily],
    [l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: Kling family models + back/main
 */
export function getKlingModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.videoKling, l.buttons.videoKlingPro],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: Veo family models + back/main
 */
export function getVeoModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.videoVeoFast, l.buttons.videoVeoQuality],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for a selected video model (with optional webapp settings button + back/main)
 */
export function getVideoModelMenuKeyboard(lang: Language, modelSlug: string, hasSettings: boolean, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (hasSettings && webappUrl) {
    const url = `${webappUrl}/video/settings?model=${encodeURIComponent(modelSlug)}${telegramId ? `&tgid=${telegramId}` : ''}`;
    rows.push([Markup.button.webApp(l.buttons.videoSettings, url)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}
