import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('auth');
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !BOT_USERNAME) return;

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

    script.onload = () => {
      // Give the iframe time to render
      setTimeout(() => setWidgetLoaded(true), 1000);
    };

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
    <div className="flex flex-col items-center" style={{ rowGap: 8 }}>
      <div
        ref={containerRef}
        className="flex items-center justify-center min-h-[44px] [&_iframe]:!rounded-xl [&_iframe]:!overflow-hidden"
      />
      {!widgetLoaded && (
        <div className="flex items-center justify-center h-11 w-full rounded-xl bg-[#54a9eb]/10 border border-[#54a9eb]/20">
          <svg className="w-5 h-5 text-[#54a9eb] mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span className="text-sm text-[#54a9eb] font-medium">
            {t('telegramLogin', 'Log in with Telegram')}
          </span>
        </div>
      )}
    </div>
  );
};
