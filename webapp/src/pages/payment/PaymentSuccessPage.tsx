import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '@/services/api/client';
import { closeTelegramWebApp, isTelegramEnvironment } from '@/services/telegram/telegram';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || '';

export default function PaymentSuccessPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const source = searchParams.get('source');
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking');

  const isFromBot = source === 'bot';

  useEffect(() => {
    if (!paymentId) {
      setStatus('success');
      return;
    }

    // Poll payment status until confirmed
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      try {
        const { data } = await apiClient.get(`/api/webapp/payment/status/${paymentId}`);
        if (data.status === 'SUCCEEDED') {
          setStatus('success');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('success'); // Assume success if can't check
      }
    };

    poll();
  }, [paymentId]);

  const handleReturnToBot = () => {
    // If we're inside the Telegram WebApp, just close it
    if (isTelegramEnvironment()) {
      closeTelegramWebApp();
      return;
    }
    // Otherwise (e.g. opened via in-app browser for SBP), link to bot
    if (BOT_USERNAME) {
      window.location.href = `https://t.me/${BOT_USERNAME}`;
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          {status === 'checking' ? (
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {status === 'checking' ? (
          <>
            <h1 className="text-2xl font-display font-bold text-content-primary mb-3">
              {t('auth:paymentProcessing')}
            </h1>
            <p className="text-content-secondary mb-8">
              {t('auth:paymentProcessingDesc')}
            </p>
          </>
        ) : status === 'success' ? (
          <>
            <h1 className="text-2xl font-display font-bold text-content-primary mb-3">
              {t('auth:paymentSuccessful')}
            </h1>
            <p className="text-content-secondary mb-8">
              {t('auth:paymentSuccessfulDesc')}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold text-content-primary mb-3">
              {t('auth:paymentReceived')}
            </h1>
            <p className="text-content-secondary mb-8">
              {t('auth:paymentReceivedDesc')}
            </p>
          </>
        )}

        <div className="flex flex-col" style={{ rowGap: 12 }}>
          {isFromBot ? (
            <button
              onClick={handleReturnToBot}
              className="px-6 py-3 bg-brand-primary text-surface-bg font-medium rounded-xl hover:bg-brand-primary/90 transition-colors"
            >
              {t('auth:returnToBot', 'Return to Bot')}
            </button>
          ) : (
            <>
              <Link
                to="/create"
                className="px-6 py-3 bg-brand-primary text-surface-bg font-medium rounded-xl hover:bg-brand-primary/90 transition-colors"
              >
                {t('auth:startChatting')}
              </Link>
              <Link
                to="/profile"
                className="text-brand-primary text-sm hover:underline"
              >
                {t('auth:viewProfile')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
