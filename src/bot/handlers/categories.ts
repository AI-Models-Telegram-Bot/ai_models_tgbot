import { Markup } from 'telegraf';
import { BotContext } from '../types';
import { createModelSelectionKeyboard } from '../keyboards/modelKeyboards';
import { getCancelKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService } from '../../services';
import { ModelCategory } from '@prisma/client';
import { Language, getLocale, t } from '../../locales';
import { sendTrackedMessage } from '../utils';
import { config } from '../../config';

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

  // Open the WebApp chat for multi-turn conversations
  if (config.webapp.url) {
    const chatUrl = `${config.webapp.url}/chat`;
    const buttonText = lang === 'ru' ? '💬 Открыть чат' : '💬 Open Chat';
    const message = lang === 'ru'
      ? '🤖 <b>Текстовый AI</b>\n\nОткройте чат для диалогов с AI моделями. Выберите модель, задавайте вопросы и ведите многоходовые беседы.'
      : '🤖 <b>Text AI</b>\n\nOpen the chat for conversations with AI models. Choose a model, ask questions, and have multi-turn conversations.';

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.webApp(buttonText, chatUrl),
      ]),
    });
    return;
  }

  // Fallback: single-turn flow (when webapp URL is not configured)
  const l = getLocale(lang);

  const defaultModel = await modelService.getDefaultByCategory('TEXT');
  if (!defaultModel) {
    await sendTrackedMessage(ctx, l.messages.noModels);
    return;
  }

  const creditsCost = defaultModel.tokenCost;
  const hasBalance = await walletService.hasSufficientBalance(ctx.user.id, creditsCost);

  if (!hasBalance) {
    const currentBalance = await walletService.getBalance(ctx.user.id);
    const message = t(lang, 'messages.errorInsufficientBalance', {
      required: formatCredits(creditsCost),
      current: formatCredits(currentBalance),
    });
    await sendTrackedMessage(ctx, message);
    return;
  }

  ctx.session.selectedModel = defaultModel.slug;
  ctx.session.awaitingInput = true;

  const example = l.promptExamples.TEXT || '';
  const message = `🤖 <b>Text AI Ready</b>\n\nUsing: ${defaultModel.name} (${formatCredits(creditsCost)})\n\nSend your message or question now:\n${example}`;

  await sendTrackedMessage(ctx, message, { parse_mode: 'HTML', ...getCancelKeyboard(lang) });
}

export { handleImageFamilyMenu as handleImageCategory } from './image';

export { handleVideoFamilyMenu as handleVideoCategory } from './video';

export { handleAudioFunctionMenu as handleAudioCategory } from './audio';
