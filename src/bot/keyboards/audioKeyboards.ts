import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

/**
 * Reply keyboard: 4 audio function buttons + main menu
 * No back button here since back would go to main menu anyway.
 */
export function getAudioFunctionsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.audioElevenLabs, l.buttons.audioVoiceCloning],
    [l.buttons.audioSuno, l.buttons.audioSoundGen],
    [l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for ElevenLabs Voice (with webapp settings)
 */
export function getElevenLabsMenuKeyboard(lang: Language, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    const url = `${webappUrl}/audio/elevenlabs-voice${telegramId ? `?tgid=${telegramId}` : ''}`;
    rows.push([Markup.button.webApp(l.buttons.audioVoiceSettings, url)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}

/**
 * Reply keyboard for Voice Cloning (no webapp settings)
 */
export function getVoiceCloningMenuKeyboard(lang: Language, _telegramId?: number) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for SUNO (with webapp settings)
 */
export function getSunoMenuKeyboard(lang: Language, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    const url = `${webappUrl}/audio/suno${telegramId ? `?tgid=${telegramId}` : ''}`;
    rows.push([Markup.button.webApp(l.buttons.audioSunoSettings, url)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}

/**
 * Reply keyboard for Sound Generator (with webapp settings)
 */
export function getSoundGenMenuKeyboard(lang: Language, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const rows: any[][] = [];
  if (webappUrl) {
    const url = `${webappUrl}/audio/sound-generator${telegramId ? `?tgid=${telegramId}` : ''}`;
    rows.push([Markup.button.webApp(l.buttons.audioSoundSettings, url)]);
  }
  rows.push([l.buttons.back, l.buttons.mainMenu]);

  return Markup.keyboard(rows).resize();
}
