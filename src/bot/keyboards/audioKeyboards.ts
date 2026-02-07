import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

/**
 * Reply keyboard: 4 audio function buttons + back/main
 */
export function getAudioFunctionsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.audioElevenLabs, l.buttons.audioVoiceCloning],
    [l.buttons.audioSuno, l.buttons.audioSoundGen],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for ElevenLabs Voice (with webapp settings)
 */
export function getElevenLabsMenuKeyboard(lang: Language) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    rows.push([Markup.button.webApp(l.buttons.audioVoiceSettings, `${webappUrl}/audio/elevenlabs-voice`)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}

/**
 * Reply keyboard for Voice Cloning (no webapp settings)
 */
export function getVoiceCloningMenuKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for SUNO (with webapp settings)
 */
export function getSunoMenuKeyboard(lang: Language) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    rows.push([Markup.button.webApp(l.buttons.audioSunoSettings, `${webappUrl}/audio/suno`)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}

/**
 * Reply keyboard for Sound Generator (with webapp settings)
 */
export function getSoundGenMenuKeyboard(lang: Language) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    rows.push([Markup.button.webApp(l.buttons.audioSoundSettings, `${webappUrl}/audio/sound-generator`)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}
