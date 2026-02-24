import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';

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
 * Persistent reply keyboard for active chat mode.
 * [➕ New Chat] [📋 My Chats]
 * [⬅️ Back] [🏠 Main menu]
 */
export function getChatReplyKeyboard(lang: Language) {
  const l = getLocale(lang);
  return Markup.keyboard([
    [l.buttons.chatNewChat, l.buttons.chatMyChats],
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Inline model picker — shown when user taps "➕ New Chat".
 */
export function getChatModelPickerKeyboard(models: ChatModel[], lang: Language) {
  const rows: any[][] = [];

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

  return Markup.inlineKeyboard(rows);
}

/**
 * Inline conversation list — shown when user taps "📋 My Chats".
 */
export function getChatListKeyboard(conversations: ChatConversation[], lang: Language) {
  const rows: any[][] = [];

  for (const conv of conversations.slice(0, 8)) {
    const label = conv.title.length > 35 ? conv.title.slice(0, 32) + '...' : conv.title;
    rows.push([
      Markup.button.callback(`💬 ${label}`, `chat:select:${conv.id}`),
    ]);
  }

  return Markup.inlineKeyboard(rows);
}
