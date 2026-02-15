import { BotContext } from '../types';
import { createModelSelectionKeyboard } from '../keyboards/modelKeyboards';
import { getCancelKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService } from '../../services';
import { ModelCategory, WalletCategory } from '@prisma/client';
import { Language, getLocale, t } from '../../locales';
import { sendTrackedMessage } from '../utils';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

function formatCredits(amount: number): string {
  return `${amount} credits`;
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

export async function handleTextCategory(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const l = getLocale(lang);

  // Get default/cheapest TEXT model
  const defaultModel = await modelService.getDefaultByCategory('TEXT');

  if (!defaultModel) {
    await sendTrackedMessage(ctx, l.messages.noModels);
    return;
  }

  const creditsCost = defaultModel.tokenCost;
  const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, 'TEXT' as WalletCategory, creditsCost);

  if (!hasBalance) {
    const currentBalance = await walletService.getBalance(ctx.user.id, 'TEXT' as WalletCategory);
    const message = t(lang, 'messages.errorInsufficientBalance', {
      required: formatCredits(creditsCost),
      current: formatCredits(currentBalance),
    });
    await sendTrackedMessage(ctx, message);
    return;
  }

  // Set model and prompt for input immediately
  ctx.session.selectedModel = defaultModel.slug;
  ctx.session.awaitingInput = true;

  const example = l.promptExamples.TEXT || '';

  const message = `🤖 <b>Text AI Ready</b>\n\nUsing: ${defaultModel.name} (${formatCredits(creditsCost)})\n\nSend your message or question now:\n${example}`;

  await sendTrackedMessage(ctx, message, { parse_mode: 'HTML', ...getCancelKeyboard(lang) });
}

export { handleImageFamilyMenu as handleImageCategory } from './image';

export { handleVideoFamilyMenu as handleVideoCategory } from './video';

export { handleAudioFunctionMenu as handleAudioCategory } from './audio';
