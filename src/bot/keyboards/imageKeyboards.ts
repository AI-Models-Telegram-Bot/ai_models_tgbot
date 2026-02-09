import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

/**
 * Reply keyboard: 4 image family buttons + main menu
 * No back button here since back would go to main menu anyway.
 */
export function getImageFamiliesKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.imageFluxFamily, l.buttons.imageSDFamily],
    [l.buttons.imageDalleFamily, l.buttons.imageIdeogramFamily],
    [l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: Flux family models + back/main
 */
export function getFluxModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.imageFluxSchnell, l.buttons.imageFluxKontext],
    [l.buttons.imageFluxDev, l.buttons.imageFluxPro],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: Stable Diffusion family models + back/main
 */
export function getSDModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.imageSDXLLightning, l.buttons.imageSDXL],
    [l.buttons.imagePlayground],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: DALL-E family models + back/main
 */
export function getDalleModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.imageDallE2, l.buttons.imageDallE3],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard: Ideogram models + back/main
 */
export function getIdeogramModelsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.imageIdeogram],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for a selected image model (with webapp settings button + back/main)
 */
export function getImageModelMenuKeyboard(lang: Language, modelSlug: string, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    const url = `${webappUrl}/image/settings?model=${encodeURIComponent(modelSlug)}${telegramId ? `&tgid=${telegramId}` : ''}`;
    rows.push([Markup.button.webApp(l.buttons.imageSettings, url)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}
