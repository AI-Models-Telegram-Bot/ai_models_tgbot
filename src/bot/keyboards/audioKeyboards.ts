import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

/**
 * Inline keyboard: 4 audio function buttons + back
 */
export function getAudioFunctionsKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(l.buttons.audioElevenLabs, 'audio_func:elevenlabs_voice')],
    [Markup.button.callback(l.buttons.audioVoiceCloning, 'audio_func:voice_cloning')],
    [Markup.button.callback(l.buttons.audioSuno, 'audio_func:suno')],
    [Markup.button.callback(l.buttons.audioSoundGen, 'audio_func:sound_generator')],
    [Markup.button.callback(l.buttons.back, 'back_to_menu')],
  ]);
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
