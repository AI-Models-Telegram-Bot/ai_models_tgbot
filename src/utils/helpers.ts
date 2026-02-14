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

/**
 * Sanitize raw provider error messages into user-friendly text.
 * Strips internal provider names, model IDs, URLs, status codes, etc.
 * Returns a simple, localized reason string.
 */
export function sanitizeErrorForUser(rawError: string, lang: 'en' | 'ru' = 'en'): string {
  const lower = rawError.toLowerCase();

  // Out of credits / billing
  if (lower.includes('run out of credits') || lower.includes('billing') || lower.includes('status code 403')) {
    return lang === 'ru'
      ? 'Сервис временно недоступен. Попробуйте позже.'
      : 'Service temporarily unavailable. Please try again later.';
  }

  // Polling timeout
  if (lower.includes('polling timed out') || lower.includes('timed out')) {
    return lang === 'ru'
      ? 'Генерация заняла слишком много времени. Попробуйте снова или выберите другую модель.'
      : 'Generation took too long. Please try again or choose a different model.';
  }

  // Rate limit
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('status code 429')) {
    return lang === 'ru'
      ? 'Слишком много запросов. Подождите немного и попробуйте снова.'
      : 'Too many requests. Please wait a moment and try again.';
  }

  // Model not found / 404
  if (lower.includes('status code 404') || lower.includes('not found') || lower.includes('could not be found')) {
    return lang === 'ru'
      ? 'Модель временно недоступна. Попробуйте позже.'
      : 'Model temporarily unavailable. Please try again later.';
  }

  // Bad request / validation
  if (lower.includes('status code 400') || lower.includes('bad request') || lower.includes('validation')) {
    return lang === 'ru'
      ? 'Некорректный запрос. Попробуйте изменить параметры или промпт.'
      : 'Invalid request. Try adjusting your settings or prompt.';
  }

  // Too many pending jobs
  if (lower.includes('too many pending')) {
    return lang === 'ru'
      ? 'У вас слишком много активных запросов. Дождитесь завершения текущих.'
      : 'You have too many active requests. Please wait for current ones to finish.';
  }

  // Content moderation
  if (lower.includes('content policy') || lower.includes('moderation') || lower.includes('safety') || lower.includes('nsfw')) {
    return lang === 'ru'
      ? 'Запрос отклонён из-за ограничений контента. Измените промпт.'
      : 'Request rejected due to content restrictions. Please modify your prompt.';
  }

  // Generic fallback — strip provider details
  return lang === 'ru'
    ? 'Произошла ошибка при генерации. Попробуйте снова.'
    : 'Generation failed. Please try again.';
}
