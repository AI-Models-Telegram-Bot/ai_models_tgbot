import { Markup } from 'telegraf';
import { AIModel } from '@prisma/client';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

export function createModelSelectionKeyboard(models: AIModel[], lang: Language) {
  const l = getLocale(lang);
  const buttons = models.map(model => [
    Markup.button.callback(
      `${model.name} (${model.tokenCost} token${model.tokenCost !== 1 ? 's' : ''})`,
      `select_model:${model.slug}`
    ),
  ]);

  buttons.push([Markup.button.callback(l.buttons.back, 'back_to_menu')]);

  return Markup.inlineKeyboard(buttons);
}

export function getCategoryKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(l.buttons.textAi, 'category:TEXT')],
    [Markup.button.callback(l.buttons.imageAi, 'category:IMAGE')],
    [Markup.button.callback(l.buttons.videoAi, 'category:VIDEO')],
    [Markup.button.callback(l.buttons.audioAi, 'category:AUDIO')],
  ]);
}

// Legacy export for compatibility
export const categoryKeyboard = getCategoryKeyboard('en');

/**
 * Build model-active keyboard for result/processing messages.
 * Shows Settings (webapp) + Back + Main menu so user can tweak settings
 * and send another prompt without navigating back through menus.
 */
export function getModelActiveKeyboardMarkup(opts: {
  lang: Language;
  modelCategory: string;
  modelSlug: string;
  telegramId?: number;
}) {
  const { lang, modelCategory, modelSlug, telegramId } = opts;
  const webappUrl = config.webapp?.url;
  const back = lang === 'ru' ? '⬅️ Назад' : '⬅️ Back';
  const mainMenu = lang === 'ru' ? '🏠 Главное меню' : '🏠 Main menu';

  const rows: any[][] = [];

  if (webappUrl && telegramId) {
    let settingsUrl: string | null = null;
    let settingsLabel: string | null = null;

    if (modelCategory === 'IMAGE') {
      settingsUrl = `${webappUrl}/image/settings?model=${encodeURIComponent(modelSlug)}&tgid=${telegramId}`;
      settingsLabel = lang === 'ru' ? '🎛️ Настройки изображения' : '🎛️ Image Settings';
    } else if (modelCategory === 'VIDEO') {
      settingsUrl = `${webappUrl}/video/settings?model=${encodeURIComponent(modelSlug)}&tgid=${telegramId}`;
      settingsLabel = lang === 'ru' ? '🎛️ Настройки видео' : '🎛️ Video Settings';
    } else if (modelCategory === 'AUDIO') {
      const audioSettingsMap: Record<string, string> = {
        'elevenlabs-voice': 'elevenlabs-voice',
        'suno': 'suno',
        'sound-generator': 'sound-generator',
      };
      const audioPage = audioSettingsMap[modelSlug];
      if (audioPage) {
        settingsUrl = `${webappUrl}/audio/${audioPage}?tgid=${telegramId}`;
        const audioLabels: Record<string, Record<string, string>> = {
          'elevenlabs-voice': { en: '🎛️ Voice Settings', ru: '🎛️ Настройки голоса' },
          'suno': { en: '🎛️ SUNO Settings', ru: '🎛️ Настройки SUNO' },
          'sound-generator': { en: '🎛️ Sound Settings', ru: '🎛️ Настройки звука' },
        };
        settingsLabel = audioLabels[audioPage]?.[lang] || audioLabels[audioPage]?.en || null;
      }
    }

    if (settingsUrl && settingsLabel) {
      rows.push([{ text: settingsLabel, web_app: { url: settingsUrl } }]);
    }
  }

  rows.push([{ text: back }, { text: mainMenu }]);

  return {
    reply_markup: {
      keyboard: rows,
      resize_keyboard: true,
    },
  };
}
