import { BotContext } from '../types';
import { getChatReplyKeyboard, getChatModelPickerKeyboard, getChatListKeyboard } from '../keyboards/chatKeyboards';
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

  // Get the default (cheapest) TEXT model
  const defaultModel = await modelService.getDefaultByCategory('TEXT');
  if (!defaultModel) {
    const msg = lang === 'ru' ? 'В этой категории пока нет моделей.' : 'No models available in this category.';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
    return;
  }

  try {
    // Auto-create conversation
    const conversation = await chatService.createConversation(ctx.user.id, defaultModel.slug);
    ctx.session.activeConversationId = conversation.id;
    ctx.session.selectedModel = undefined;
    ctx.session.awaitingInput = false;

    const message = lang === 'ru'
      ? `🤖 <b>Текст AI — ${defaultModel.name}</b> (⚡${defaultModel.tokenCost})\n\nОтправьте ваше сообщение:`
      : `🤖 <b>Text AI — ${defaultModel.name}</b> (⚡${defaultModel.tokenCost})\n\nSend your message:`;

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...getChatReplyKeyboard(lang),
    });
  } catch (error) {
    logger.error('Failed to auto-create conversation:', error);
    const msg = lang === 'ru' ? 'Ошибка. Попробуйте снова.' : 'Error. Please try again.';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
  }
}

/**
 * "➕ New Chat" reply button → show inline model picker.
 */
export async function handleNewChat(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const models = await modelService.getByCategory('TEXT');
  const activeModels = models.filter((m) => m.isActive);

  if (activeModels.length === 0) {
    const msg = lang === 'ru' ? 'В этой категории пока нет моделей.' : 'No models available in this category.';
    await sendTrackedMessage(ctx, msg, getChatReplyKeyboard(lang));
    return;
  }

  const chatModels = activeModels.map((m) => ({
    slug: m.slug,
    name: m.name,
    tokenCost: m.tokenCost,
  }));

  const message = lang === 'ru'
    ? '➕ <b>Новый чат</b>\n\nВыберите модель:'
    : '➕ <b>New Chat</b>\n\nPick a model:';

  await sendTrackedMessage(ctx, message, {
    parse_mode: 'HTML',
    ...getChatModelPickerKeyboard(chatModels, lang),
  });
}

/**
 * "📋 My Chats" reply button → show inline conversation list.
 */
export async function handleMyChatsList(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const conversations = await chatService.getConversations(ctx.user.id, 8, 0);
  const textConversations = conversations.filter((c) => c.category === 'TEXT');

  if (textConversations.length === 0) {
    const msg = lang === 'ru'
      ? '📋 У вас ещё нет чатов.\nВыберите модель, чтобы начать:'
      : '📋 No chats yet.\nPick a model to start:';
    await sendTrackedMessage(ctx, msg, getChatReplyKeyboard(lang));
    return;
  }

  const convList = textConversations.map((c) => ({
    id: c.id,
    title: c.title || 'Untitled',
    modelSlug: c.modelSlug,
  }));

  const message = lang === 'ru'
    ? '📋 <b>Ваши чаты:</b>'
    : '📋 <b>Your chats:</b>';

  await sendTrackedMessage(ctx, message, {
    parse_mode: 'HTML',
    ...getChatListKeyboard(convList, lang),
  });
}

/**
 * Handle callback: user selected a model → create conversation.
 */
async function handleModelSelect(ctx: BotContext, modelSlug: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);
  const model = await modelService.getBySlug(modelSlug);
  if (!model) {
    await ctx.reply(lang === 'ru' ? 'Модель не найдена.' : 'Model not found.');
    return;
  }

  try {
    const conversation = await chatService.createConversation(ctx.user.id, modelSlug);
    ctx.session.activeConversationId = conversation.id;
    ctx.session.selectedModel = undefined;
    ctx.session.awaitingInput = false;

    const message = lang === 'ru'
      ? `💬 Чат создан с <b>${model.name}</b> (⚡${model.tokenCost})\n\nОтправьте ваше сообщение:`
      : `💬 Chat started with <b>${model.name}</b> (⚡${model.tokenCost})\n\nSend your message:`;

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...getChatReplyKeyboard(lang),
    });
  } catch (error) {
    logger.error('Failed to create conversation:', error);
    await ctx.reply(lang === 'ru' ? 'Ошибка создания чата.' : 'Failed to create chat.');
  }
}

/**
 * Handle callback: select an existing conversation.
 */
async function handleChatSelect(ctx: BotContext, conversationId: string): Promise<void> {
  if (!ctx.user || !ctx.session) return;

  const lang = getLang(ctx);

  try {
    await chatService.getMessages(conversationId, ctx.user.id, 1, 0);
    ctx.session.activeConversationId = conversationId;
    ctx.session.selectedModel = undefined;
    ctx.session.awaitingInput = false;

    const conversations = await chatService.getConversations(ctx.user.id, 20, 0);
    const conv = conversations.find((c) => c.id === conversationId);
    const title = conv?.title || (lang === 'ru' ? 'Чат' : 'Chat');
    const modelSlug = conv?.modelSlug || '';
    const model = modelSlug ? await modelService.getBySlug(modelSlug) : null;
    const modelName = model?.name || modelSlug;

    const message = lang === 'ru'
      ? `💬 <b>${title}</b>\n<i>${modelName}</i>\n\nОтправьте ваше сообщение:`
      : `💬 <b>${title}</b>\n<i>${modelName}</i>\n\nSend your message:`;

    await sendTrackedMessage(ctx, message, {
      parse_mode: 'HTML',
      ...getChatReplyKeyboard(lang),
    });
  } catch (error) {
    logger.error('Failed to select conversation:', error);
    await ctx.reply(lang === 'ru' ? 'Чат не найден.' : 'Chat not found.');
  }
}

/**
 * Handle text message when activeConversationId is set.
 */
export async function handleChatMessage(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.session || !ctx.session.activeConversationId) return;
  if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) return;

  const lang = getLang(ctx);
  const input = ctx.message.text;

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
 * Route all chat: callback queries.
 */
export async function handleChatCallback(ctx: BotContext, data: string): Promise<void> {
  if (data.startsWith('chat:model:')) {
    const slug = data.replace('chat:model:', '');
    await handleModelSelect(ctx, slug);
  } else if (data === 'chat:list') {
    await handleMyChatsList(ctx);
  } else if (data.startsWith('chat:select:')) {
    const id = data.replace('chat:select:', '');
    await handleChatSelect(ctx, id);
  } else if (data === 'chat:new') {
    await handleNewChat(ctx);
  } else if (data === 'chat:menu') {
    const lang = getLang(ctx);
    ctx.session!.activeConversationId = undefined;
    const msg = lang === 'ru' ? 'Выберите опцию:' : 'Choose an option:';
    await sendTrackedMessage(ctx, msg, getMainKeyboard(lang));
  }
}
