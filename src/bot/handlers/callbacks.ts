import { BotContext } from '../types';
import { handleCategorySelection } from './categories';
import { handleModelSelection } from './models';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { ModelCategory } from '@prisma/client';
import { deleteMessage } from '../utils';
import { Language, getLocale } from '../../locales';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

export async function handleCallbackQuery(ctx: BotContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;
  const lang = getLang(ctx);
  const l = getLocale(lang);
  await ctx.answerCbQuery();

  // ── Image delete callback — edit message in-place, don't delete ──
  if (data.startsWith('delete_image:')) {
    const idx = parseInt(data.split(':')[1], 10);
    if (ctx.session?.uploadedImageUrls?.length) {
      ctx.session.uploadedImageUrls.splice(idx, 1);
      if (ctx.session.uploadedImageUrls.length === 0) {
        ctx.session.uploadedImageUrls = undefined;
      }
    }
    const remaining = ctx.session?.uploadedImageUrls?.length || 0;
    const deleteMsg = lang === 'ru'
      ? `🗑 Изображение удалено.${remaining > 0 ? ` Осталось: ${remaining}` : ''}`
      : `🗑 Image removed.${remaining > 0 ? ` Remaining: ${remaining}` : ''}`;
    try {
      await ctx.editMessageText(deleteMsg);
    } catch {
      // If edit fails (e.g. message too old), just send a new message
      await ctx.reply(deleteMsg);
    }
    return;
  }

  // Delete the message with inline keyboard to keep chat clean
  await deleteMessage(ctx, ctx.callbackQuery.message?.message_id);

  if (data.startsWith('category:')) {
    const category = data.replace('category:', '') as ModelCategory;
    await handleCategorySelection(ctx, category);
  } else if (data.startsWith('select_model:')) {
    const modelSlug = data.replace('select_model:', '');
    await handleModelSelection(ctx, modelSlug);
  } else if (data === 'back_to_menu') {
    await ctx.reply(l.messages.chooseOption, getMainKeyboard(lang));
  }
}
