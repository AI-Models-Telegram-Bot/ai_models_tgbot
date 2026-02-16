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
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
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
  webapp.setHeaderColor('#0f0f23');
  webapp.setBackgroundColor('#0f0f23');

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

export function openTelegramLink(url: string): void {
  const webapp = getWebApp();
  if (webapp) {
    webapp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Open an external URL in the in-app browser (Telegram) or new tab (web).
 * Unlike window.location.href, this keeps the webapp alive underneath.
 */
export function openExternalLink(url: string): void {
  const webapp = getWebApp();
  if (webapp?.openLink) {
    webapp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function isTelegramEnvironment(): boolean {
  const webapp = getWebApp();
  // Primary check: initData is only populated when opened inside Telegram.
  if (webapp && webapp.initData) return true;
  // Fallback: check URL hash for Telegram web app parameters.
  // The Telegram client appends #tgWebAppData=... when opening WebApp buttons.
  // In some cases the SDK may not have processed the hash yet.
  if (typeof window !== 'undefined' && window.location.hash.includes('tgWebApp')) return true;
  return false;
}
