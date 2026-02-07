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
    const maxAttempts = 20; // Try for 2 seconds max
    const interval = 100;

    const checkTelegram = () => {
      const webapp = window.Telegram?.WebApp;
      const telegramUser = webapp?.initDataUnsafe?.user;

      if (telegramUser?.id) {
        setUser(telegramUser);
        setIsLoading(false);
        return true;
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
    const timer = setInterval(() => {
      if (checkTelegram()) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return {
    user,
    isLoading,
    telegramId: user?.id?.toString() ?? null,
  };
}
