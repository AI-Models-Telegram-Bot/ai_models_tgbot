import { useState, useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Hook that waits for Telegram WebApp to be fully initialized
 * and returns the user data. Handles timing issues when opening
 * from menu button vs attachment menu.
 */
export function useTelegramUser(): {
  user: TelegramUser | null;
  isLoading: boolean;
  telegramId: string | null;
} {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // Try for 5 seconds max (increased from 2)
    const interval = 100;
    let timer: NodeJS.Timeout | null = null;

    const checkTelegram = (): boolean => {
      const webapp = window.Telegram?.WebApp;

      // Signal that the WebApp is ready
      if (webapp && typeof webapp.ready === 'function') {
        try {
          webapp.ready();
        } catch {
          // Ignore errors from ready()
        }
      }

      // Try to expand the webapp
      if (webapp && typeof webapp.expand === 'function') {
        try {
          webapp.expand();
        } catch {
          // Ignore errors from expand()
        }
      }

      const telegramUser = webapp?.initDataUnsafe?.user;

      if (telegramUser?.id) {
        setUser(telegramUser);
        setIsLoading(false);
        return true;
      }

      // Also check initData string as a fallback
      const initData = webapp?.initData;
      if (initData && initData.length > 0) {
        // Parse initData to get user if initDataUnsafe is empty
        try {
          const params = new URLSearchParams(initData);
          const userStr = params.get('user');
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            if (parsedUser?.id) {
              setUser(parsedUser);
              setIsLoading(false);
              return true;
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }

      attempts++;
      if (attempts >= maxAttempts) {
        // Telegram user not available after max attempts
        setIsLoading(false);
        return true;
      }

      return false;
    };

    // Try immediately first
    if (checkTelegram()) return;

    // Poll for Telegram readiness
    timer = setInterval(() => {
      if (checkTelegram()) {
        if (timer) clearInterval(timer);
      }
    }, interval);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  return {
    user,
    isLoading,
    telegramId: user?.id?.toString() ?? null,
  };
}
