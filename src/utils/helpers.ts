import crypto from 'crypto';

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function formatTokens(amount: number): string {
  return `${amount} token${amount !== 1 ? 's' : ''}`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert standard Markdown to Telegram HTML format
 */
export function markdownToTelegramHtml(text: string): string {
  let result = text;

  // Escape HTML entities first (but preserve what we'll convert)
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```code```) - must be before inline code
  result = result.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre>$2</pre>');

  // Inline code (`code`)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers (## Header) -> bold
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  result = result.replace(/__(.+?)__/g, '<b>$1</b>');

  // Italic (*text* or _text_) - careful not to match already processed
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<i>$1</i>');

  // Strikethrough (~~text~~)
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Links [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bullet points (- item or * item) -> • item
  result = result.replace(/^[\-\*]\s+/gm, '• ');

  // Numbered lists keep as is (1. item)

  return result;
}
