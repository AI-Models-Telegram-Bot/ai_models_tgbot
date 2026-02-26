import { BotContext } from '../types';
import { getChatReplyKeyboard, getChatModelPickerKeyboard } from '../keyboards/chatKeyboards';
import { getMainKeyboard } from '../keyboards/mainKeyboard';
import { modelService, walletService } from '../../services';
import { chatService } from '../../services/ChatService';
import { sendTrackedMessage, deleteMessage } from '../utils';
import { Language } from '../../locales';
import { config } from '../../config';
import { logger } from '../../utils/logger';

function getLang(ctx: BotContext): Language {
  return (ctx.user?.language as Language) || 'en';
}

/**
 * Entry point: "Text AI" button.
 * Auto-creates conversation with the cheapest TEXT model → user can type immediately.
 */
export async function handleTextAI(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);

  const defaultModel = await modelService.getDefaultByCategory('TEXT');
  if (!defaultModel) {
    const msg = lang === 'ru' ? 'В этой категории пока нет моделей.' : 'No models available in this category.';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
    return;
  }

  // Clear ALL other category state to prevent stale routing
  // (e.g. user was in video flow with veo selected, then presses Text AI)
  ctx.session.inVideoMenu = false;
  ctx.session.videoFamily = undefined;
  ctx.session.videoFunction = undefined;
  ctx.session.inImageMenu = false;
  ctx.session.imageFamily = undefined;
  ctx.session.imageFunction = undefined;
  ctx.session.inAudioMenu = false;
  ctx.session.audioFunction = undefined;
  ctx.session.selectedModel = undefined;
  ctx.session.awaitingInput = false;
  ctx.session.uploadedImageUrls = undefined;
  ctx.session.imageUploadMsgIds = undefined;

  try {
    const conversation = await chatService.createConversation(ctx.user.id, defaultModel.slug);
    ctx.session.activeConversationId = conversation.id;
    ctx.session.chatModelPicker = false;

    const message = lang === 'ru'
      ? `🤖 <b>Текст AI — ${defaultModel.name}</b> (⚡${defaultModel.tokenCost})\n\nОтправьте ваше сообщение:`
      : `🤖 <b>Text AI — ${defaultModel.name}</b> (⚡${defaultModel.tokenCost})\n\nSend your message:`;

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...getChatReplyKeyboard(lang, ctx.from?.id),
    });
  } catch (error) {
    logger.error('Failed to auto-create conversation:', error);
    const msg = lang === 'ru' ? 'Ошибка. Попробуйте снова.' : 'Error. Please try again.';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
  }
}

/**
 * "➕ New Chat" reply button → show model picker reply keyboard.
 */
export async function handleNewChat(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  await showModelPicker(ctx);
}

/**
 * "🔄 Model" reply button → show model picker reply keyboard.
 */
export async function handleChangeModel(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;
  await showModelPicker(ctx);
}

/**
 * Show model picker as reply keyboard buttons.
 */
async function showModelPicker(ctx: BotContext): Promise<void> {
  const lang = getLang(ctx);
  const models = await modelService.getByCategory('TEXT');
  const activeModels = models.filter((m) => m.isActive);

  if (activeModels.length === 0) {
    const msg = lang === 'ru' ? 'Нет доступных моделей.' : 'No models available.';
    await sendTrackedMessage(ctx, msg, getChatReplyKeyboard(lang, ctx.from?.id));
    return;
  }

  const chatModels = activeModels.map((m) => ({
    slug: m.slug,
    name: m.name,
    tokenCost: m.tokenCost,
  }));

  ctx.session!.chatModelPicker = true;

  const message = lang === 'ru'
    ? '🔄 <b>Выберите модель:</b>'
    : '🔄 <b>Pick a model:</b>';

  await sendTrackedMessage(ctx, message, {
    parse_mode: 'HTML',
    ...getChatModelPickerKeyboard(chatModels, lang),
  });
}

/**
 * Handle model selection from reply keyboard button.
 * Button text format: "ModelName (⚡Cost)"
 */
async function handleModelPickerSelection(ctx: BotContext, input: string): Promise<void> {
  const lang = getLang(ctx);

  // Parse model name from button text
  const match = input.match(/^(.+?)\s*\(⚡\d+\)$/);
  if (!match) {
    // Not a model button — treat as chat message
    ctx.session!.chatModelPicker = false;
    return sendChatMessage(ctx, input);
  }

  const modelName = match[1].trim();
  const models = await modelService.getByCategory('TEXT');
  const model = models.find((m) => m.name === modelName && m.isActive);

  if (!model) {
    ctx.session!.chatModelPicker = false;
    const msg = lang === 'ru' ? 'Модель не найдена.' : 'Model not found.';
    await ctx.reply(msg);
    return;
  }

  ctx.session!.chatModelPicker = false;

  // Clear all other category state
  ctx.session!.inVideoMenu = false;
  ctx.session!.videoFamily = undefined;
  ctx.session!.videoFunction = undefined;
  ctx.session!.inImageMenu = false;
  ctx.session!.imageFamily = undefined;
  ctx.session!.imageFunction = undefined;
  ctx.session!.inAudioMenu = false;
  ctx.session!.audioFunction = undefined;
  ctx.session!.selectedModel = undefined;
  ctx.session!.awaitingInput = false;
  ctx.session!.uploadedImageUrls = undefined;
  ctx.session!.imageUploadMsgIds = undefined;

  try {
    // Delete the user's model button press
    try { await ctx.deleteMessage(); } catch { /* ignore */ }

    const conversation = await chatService.createConversation(ctx.user!.id, model.slug);
    ctx.session!.activeConversationId = conversation.id;

    const message = lang === 'ru'
      ? `💬 Чат создан с <b>${model.name}</b> (⚡${model.tokenCost})\n\nОтправьте ваше сообщение:`
      : `💬 Chat started with <b>${model.name}</b> (⚡${model.tokenCost})\n\nSend your message:`;

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...getChatReplyKeyboard(lang, ctx.from?.id),
    });
  } catch (error) {
    logger.error('Failed to create conversation:', error);
    await ctx.reply(lang === 'ru' ? 'Ошибка создания чата.' : 'Failed to create chat.');
  }
}

/**
 * Handle text message when activeConversationId is set.
 * Checks for model picker state first.
 */
export async function handleChatMessage(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session || !ctx.session.activeConversationId) return;
  if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) return;

  const input = ctx.message.text;

  // If model picker is active, handle model selection
  if (ctx.session.chatModelPicker) {
    return handleModelPickerSelection(ctx, input);
  }

  return sendChatMessage(ctx, input);
}

/**
 * Send a chat message to the active conversation.
 */
async function sendChatMessage(ctx: BotContext, input: string): Promise<void> {
  if (!ctx.user || !ctx.session || !ctx.session.activeConversationId) return;

  const lang = getLang(ctx);

  const processingMsg = await ctx.reply(
    lang === 'ru' ? '⏳ Генерация...' : '⏳ Generating...',
    { parse_mode: 'HTML' },
  );

  try {
    await chatService.sendBotMessage({
      conversationId: ctx.session.activeConversationId,
      userId: ctx.user.id,
      content: input,
      chatId: ctx.chat!.id,
      processingMsgId: processingMsg.message_id,
      botToken: config.bot.token,
      language: lang,
      telegramId: ctx.from?.id,
    });
  } catch (error: any) {
    try {
      await deleteMessage(ctx, processingMsg.message_id);
    } catch { /* ignore */ }

    const errMsg = error?.message || String(error);

    if (errMsg.includes('Insufficient balance')) {
      const currentBalance = await walletService.getBalance(ctx.user.id);
      const msg = lang === 'ru'
        ? `💰 Недостаточно баланса. Ваш баланс: ${currentBalance} ⚡`
        : `💰 Insufficient balance. Your balance: ${currentBalance} ⚡`;
      await ctx.reply(msg);
    } else if (errMsg.includes('access denied') || errMsg.includes('Access denied')) {
      const msg = lang === 'ru'
        ? '🔒 Эта модель недоступна на вашем тарифе.'
        : '🔒 This model is not available on your plan.';
      await ctx.reply(msg);
    } else {
      logger.error('Bot chat sendMessage failed:', error);
      const msg = lang === 'ru' ? 'Ошибка. Попробуйте снова.' : 'Error. Please try again.';
      await ctx.reply(msg);
    }
  }
}

/**
 * Route all chat: callback queries (legacy inline button support).
 */
export async function handleChatCallback(ctx: BotContext, data: string): Promise<void> {
  if (data === 'chat:new') {
    await handleNewChat(ctx);
  } else if (data === 'chat:menu') {
    const lang = getLang(ctx);
    ctx.session!.activeConversationId = undefined;
    ctx.session!.chatModelPicker = false;
    const msg = lang === 'ru' ? 'Выберите опцию:' : 'Choose an option:';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
  }
}
