import { Markup } from 'telegraf';
import { BotContext } from '../types';
import { createModelSelectionKeyboard } from '../keyboards/modelKeyboards';
import { modelService } from '../../services';
import { ModelCategory } from '@prisma/client';
import { Language, getLocale } from '../../locales';
import { sendTrackedMessage } from '../utils';
import { handleTextAI } from './chat';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

const categoryMessageKeys: Record<string, string> = {
  TEXT: 'categoryText',
  IMAGE: 'categoryImage',
  VIDEO: 'categoryVideo',
  AUDIO: 'categoryAudio',
};

export async function handleCategorySelection(ctx: BotContext, category: ModelCategory): Promise<void> {
  const lang = getLang(ctx);
  const l = getLocale(lang);
  const models = await modelService.getByCategory(category);

  if (models.length === 0) {
    await sendTrackedMessage(ctx, l.messages.noModels);
    return;
  }

  const messageKey = categoryMessageKeys[category] as keyof typeof l.messages;
  const message = l.messages[messageKey] || l.messages.categoryText;

  await sendTrackedMessage(ctx, message, {
    parse_mode: 'HTML',
    ...createModelSelectionKeyboard(models, lang),
  });
}

/**
 * Text AI handler — delegates to the multi-turn chat handler.
 */
export async function handleTextCategory(ctx: BotContext): Promise<void> {
  return handleTextAI(ctx);
}

export { handleImageFamilyMenu as handleImageCategory } from './image';

export { handleVideoFamilyMenu as handleVideoCategory } from './video';

export { handleAudioFunctionMenu as handleAudioCategory } from './audio';
