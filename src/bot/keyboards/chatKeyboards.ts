import { Markup } from 'telegraf';
import { Language, getLocale } from '../../locales';
import { config } from '../../config';

interface ChatModel {
  slug: string;
  name: string;
  tokenCost: number;
}

/**
 * Persistent reply keyboard for active chat mode.
 * [➕ New Chat] [🔄 Model] [🌐 App]
 * [⬅️ Back] [🏠 Main menu]
 */
export function getChatReplyKeyboard(lang: Language, telegramId?: number) {
  const l = getLocale(lang);
  const webappUrl = config.webapp?.url;

  const topRow: any[] = [l.buttons.chatNewChat, l.buttons.chatChangeModel];
  if (webappUrl) {
    const chatUrl = telegramId ? `${webappUrl}/chat?tgid=${telegramId}` : `${webappUrl}/chat`;
    topRow.push(Markup.button.webApp(l.buttons.chatApp, chatUrl));
  }

  return Markup.keyboard([
    topRow,
    [l.buttons.back, l.buttons.mainMenu],
  ]).resize();
}

/**
 * Reply keyboard for model picker.
 * Shows model buttons in 2-column grid + [⬅️ Back].
 */
export function getChatModelPickerKeyboard(models: ChatModel[], lang: Language) {
  const l = getLocale(lang);
  const rows: string[][] = [];

  for (let i = 0; i < models.length; i += 2) {
    const row: string[] = [];
    row.push(`${models[i].name} (⚡${models[i].tokenCost})`);
    if (models[i + 1]) {
      row.push(`${models[i + 1].name} (⚡${models[i + 1].tokenCost})`);
    }
    rows.push(row);
  }

  rows.push([l.buttons.back]);

  return Markup.keyboard(rows).resize();
}
