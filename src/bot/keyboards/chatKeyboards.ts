import { Markup } from 'telegraf';
import { Language } from '../../locales';
import { config } from '../../config';

interface ChatModel {
  slug: string;
  name: string;
  tokenCost: number;
}

interface ChatConversation {
  id: string;
  title: string;
  modelSlug: string;
}

/**
 * Model picker keyboard for text AI chat.
 * Shows TEXT models as inline buttons + optional "My Chats" row.
 */
export function getChatModelPickerKeyboard(models: ChatModel[], lang: Language, hasChats: boolean) {
  const rows: any[][] = [];

  // Models in a 2-column grid
  for (let i = 0; i < models.length; i += 2) {
    const row: any[] = [];
    row.push(
      Markup.button.callback(
        `${models[i].name} (⚡${models[i].tokenCost})`,
        `chat:model:${models[i].slug}`,
      ),
    );
    if (models[i + 1]) {
      row.push(
        Markup.button.callback(
          `${models[i + 1].name} (⚡${models[i + 1].tokenCost})`,
          `chat:model:${models[i + 1].slug}`,
        ),
      );
    }
    rows.push(row);
  }

  // Bottom row: My Chats + Open in App
  const bottomRow: any[] = [];
  if (hasChats) {
    bottomRow.push(
      Markup.button.callback(
        lang === 'ru' ? '📋 Мои чаты' : '📋 My Chats',
        'chat:list',
      ),
    );
  }
  if (config.webapp?.url) {
    bottomRow.push(
      Markup.button.webApp(
        lang === 'ru' ? '🌐 Открыть в приложении' : '🌐 Open in App',
        `${config.webapp.url}/chat`,
      ),
    );
  }
  if (bottomRow.length > 0) {
    rows.push(bottomRow);
  }

  return Markup.inlineKeyboard(rows);
}

/**
 * Conversation list keyboard — shows recent TEXT conversations.
 */
export function getChatListKeyboard(conversations: ChatConversation[], lang: Language) {
  const rows: any[][] = [];

  for (const conv of conversations.slice(0, 8)) {
    const label = conv.title.length > 35 ? conv.title.slice(0, 32) + '...' : conv.title;
    rows.push([
      Markup.button.callback(`💬 ${label}`, `chat:select:${conv.id}`),
    ]);
  }

  // Bottom row: New Chat + Back to Menu
  rows.push([
    Markup.button.callback(
      lang === 'ru' ? '➕ Новый чат' : '➕ New Chat',
      'chat:new',
    ),
    Markup.button.callback(
      lang === 'ru' ? '🏠 Меню' : '🏠 Menu',
      'chat:menu',
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Inline keyboard shown after a bot chat response.
 * [New Chat] [My Chats] [Open in App] [Menu]
 */
export function getChatActiveKeyboard(lang: Language) {
  const rows: any[][] = [];

  const row1: any[] = [
    Markup.button.callback(
      lang === 'ru' ? '➕ Новый' : '➕ New',
      'chat:new',
    ),
    Markup.button.callback(
      lang === 'ru' ? '📋 Чаты' : '📋 Chats',
      'chat:list',
    ),
  ];

  if (config.webapp?.url) {
    row1.push(
      Markup.button.webApp(
        lang === 'ru' ? '🌐 Приложение' : '🌐 App',
        `${config.webapp.url}/chat`,
      ),
    );
  }

  rows.push(row1);
  rows.push([
    Markup.button.callback(
      lang === 'ru' ? '🏠 Меню' : '🏠 Menu',
      'chat:menu',
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}
