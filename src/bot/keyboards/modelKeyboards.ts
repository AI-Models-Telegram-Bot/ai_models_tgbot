import { Markup } from 'telegraf';
import { AIModel } from '@prisma/client';
import { Language, getLocale } from '../../locales';

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
