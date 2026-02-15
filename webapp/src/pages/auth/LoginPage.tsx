import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { authApi } from '@/services/api/auth.api';
import { Card } from '@/shared/ui';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { loginWithGoogle, setTokens, fetchUser, clearError, error } = useAuthStore();

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'expired' | 'error'>('loading');
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const createToken = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await authApi.createTelegramQR();
      setToken(data.token);
      setDeepLink(data.deepLink);
      setExpiresAt(new Date(data.expiresAt));
      setStatus('pending');
    } catch {
      setStatus('error');
    }
  }, []);

  // Create token on mount
  useEffect(() => {
    createToken();
  }, [createToken]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || status !== 'pending') return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setStatus('expired');
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, status]);

  // Poll for confirmation
  useEffect(() => {
    if (!token || status !== 'pending') return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await authApi.checkTelegramQR(token);
        if (data.status === 'confirmed' && data.accessToken && data.refreshToken) {
          setStatus('confirmed');
          setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          await fetchUser();
          navigate('/create');
        } else if (data.status === 'expired') {
          setStatus('expired');
        }
      } catch {
        // Silently retry on network errors
      }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, status, setTokens, fetchUser, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleGoogleLogin = async (credential: string) => {
    clearError();
    try {
      await loginWithGoogle(credential);
      navigate('/create');
    } catch {
      // Error handled in store
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-content-primary">
            {t('telegramAuthTitle', 'Telegram Authentication')}
          </h1>
          <p className="mt-2 text-content-secondary text-sm">
            {t('telegramAuthSubtitle', 'Please complete authentication in Telegram')}
          </p>
        </div>

        {/* QR Auth Card */}
        <Card variant="elevated" padding="lg">
          <div className="flex flex-col items-center space-y-5">
            {/* Error */}
            {error && (
              <div className="w-full rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* QR Code */}
            {status === 'loading' && (
              <div className="w-[200px] h-[200px] rounded-2xl bg-surface-bg animate-pulse" />
            )}

            {status === 'pending' && deepLink && (
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG
                  value={deepLink}
                  size={192}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}

            {status === 'confirmed' && (
              <div className="w-[200px] h-[200px] rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-emerald-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 text-sm font-medium">{t('authSuccess', 'Authentication successful!')}</span>
                <span className="text-emerald-400/60 text-xs mt-1">{t('authRedirecting', 'Redirecting...')}</span>
              </div>
            )}

            {status === 'expired' && (
              <div className="w-[200px] h-[200px] rounded-2xl bg-surface-bg border border-white/10 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-content-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-content-secondary text-sm font-medium">{t('sessionExpired', 'Session expired')}</span>
                <button
                  onClick={createToken}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-[#54a9eb] text-white text-xs font-medium hover:bg-[#54a9eb]/90 transition-colors"
                >
                  {t('tryAgain', 'Try again')}
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="w-[200px] h-[200px] rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
                <span className="text-red-400 text-sm font-medium">Connection error</span>
                <button
                  onClick={createToken}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-[#54a9eb] text-white text-xs font-medium hover:bg-[#54a9eb]/90 transition-colors"
                >
                  {t('tryAgain', 'Try again')}
                </button>
              </div>
            )}

            {/* Timer */}
            {status === 'pending' && (
              <p className="text-content-secondary text-sm">
                {t('timeRemaining', 'Time remaining')}: <span className="font-mono font-medium text-content-primary">{formatTime(timeLeft)}</span>
              </p>
            )}

            {/* Action Buttons */}
            {status === 'pending' && deepLink && (
              <div className="w-full space-y-3">
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-12 rounded-xl bg-[#54a9eb] text-white font-medium text-sm hover:bg-[#54a9eb]/90 transition-colors"
                  style={{ columnGap: 8 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  {t('openTelegram', 'Open Telegram')}
                </a>

                <a
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-12 rounded-xl border border-white/15 text-content-primary font-medium text-sm hover:bg-white/5 transition-colors"
                  style={{ columnGap: 8 }}
                >
                  {t('openTelegramWeb', 'Open Telegram Web')}
                </a>
              </div>
            )}
          </div>

          {/* Divider */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-card px-3 text-content-secondary">
                    {t('orLoginWith', 'Or log in with')}
                  </span>
                </div>
              </div>

              <GoogleLoginButton onSuccess={handleGoogleLogin} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
