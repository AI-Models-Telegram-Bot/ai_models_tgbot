import i18n from '@/i18n/config';

/**
 * Access the Telegram WebApp object from the global scope.
 * The SDK is loaded via script tag in index.html.
 */
function getWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  openInvoice: (url: string, callback: (status: string) => void) => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function initTelegramWebApp() {
  const webapp = getWebApp();
  if (!webapp) {
    console.warn('Telegram WebApp SDK not available - running outside Telegram');
    return;
  }

  webapp.ready();
  webapp.expand();
  webapp.setHeaderColor('#0a0a0a');
  webapp.setBackgroundColor('#0a0a0a');

  // Detect language from Telegram user
  const user = webapp.initDataUnsafe.user;
  if (user?.language_code) {
    const lang = user.language_code.startsWith('ru') ? 'ru' : 'en';
    i18n.changeLanguage(lang);
  }
}

export function getTelegramUser() {
  return getWebApp()?.initDataUnsafe.user ?? null;
}

export function getTelegramInitData(): string {
  return getWebApp()?.initData ?? '';
}

export function closeTelegramWebApp() {
  getWebApp()?.close();
}

export function openTelegramInvoice(
  url: string,
  callback: (status: string) => void
) {
  getWebApp()?.openInvoice(url, callback);
}

export function isTelegramEnvironment(): boolean {
  return !!getWebApp();
}
