import React, { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  showUserPhoto?: boolean;
}

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME;

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  onAuth,
  buttonSize = 'large',
  cornerRadius = 12,
  showUserPhoto = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !BOT_USERNAME) return;

    // Expose callback on window so the Telegram script can invoke it
    const callbackName = '__telegram_login_callback__';
    (window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', 'write');
    if (!showUserPhoto) {
      script.setAttribute('data-userpic', 'false');
    }

    // Clear previous content and append the new script
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [onAuth, buttonSize, cornerRadius, showUserPhoto]);

  if (!BOT_USERNAME) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center [&_iframe]:!rounded-xl [&_iframe]:!overflow-hidden"
    />
  );
};
