import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { authApi } from '@/services/api/auth.api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type AuthMethod = 'telegram' | 'google';

const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { loginWithGoogle, setTokens, fetchUser, clearError, error } = useAuthStore();

  const [method, setMethod] = useState<AuthMethod>('telegram');
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
      <div className="w-full max-w-[420px] space-y-6">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary/60 mb-4">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-content-primary">
            {t('loginTitle', 'Sign in to VseoNix')}
          </h1>
          <p className="mt-1.5 text-content-secondary text-sm">
            {t('loginSubtitle', 'Choose your preferred sign-in method')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Auth Card */}
        <div className="rounded-2xl bg-surface-card border border-white/[0.12] shadow-card backdrop-blur-xl overflow-hidden">
          {/* Method Tabs */}
          {GOOGLE_CLIENT_ID && (
            <div className="flex border-b border-white/[0.08]">
              <button
                onClick={() => setMethod('telegram')}
                className={`flex-1 flex items-center justify-center py-3.5 text-sm font-medium transition-colors relative ${
                  method === 'telegram'
                    ? 'text-content-primary'
                    : 'text-content-tertiary hover:text-content-secondary'
                }`}
                style={{ columnGap: 8 }}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {t('telegramAuth', 'Telegram')}
                {method === 'telegram' && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#54a9eb] rounded-full" />
                )}
              </button>
              <button
                onClick={() => setMethod('google')}
                className={`flex-1 flex items-center justify-center py-3.5 text-sm font-medium transition-colors relative ${
                  method === 'google'
                    ? 'text-content-primary'
                    : 'text-content-tertiary hover:text-content-secondary'
                }`}
                style={{ columnGap: 8 }}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('googleAuth', 'Google')}
                {method === 'google' && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#4285F4] rounded-full" />
                )}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {method === 'telegram' ? (
              <div className="flex flex-col items-center">
                {/* QR Code Area */}
                {status === 'loading' && (
                  <div className="w-[200px] h-[200px] rounded-2xl bg-surface-bg animate-pulse" />
                )}

                {status === 'pending' && deepLink && (
                  <>
                    <div className="bg-white p-3 rounded-2xl shadow-lg">
                      <QRCodeSVG
                        value={deepLink}
                        size={176}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Timer */}
                    <div className="mt-4 flex items-center text-content-tertiary text-xs" style={{ columnGap: 4 }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>{t('timeRemaining', 'Expires in')}</span>
                      <span className="font-mono font-medium text-content-secondary">{formatTime(timeLeft)}</span>
                    </div>

                    {/* Instructions */}
                    <div className="mt-5 w-full space-y-2.5">
                      <div className="flex items-start text-sm text-content-secondary" style={{ columnGap: 10 }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-content-tertiary mt-px">1</span>
                        <span>{t('step1', 'Open Telegram on your phone')}</span>
                      </div>
                      <div className="flex items-start text-sm text-content-secondary" style={{ columnGap: 10 }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-content-tertiary mt-px">2</span>
                        <span>{t('step2', 'Point camera at the QR code')}</span>
                      </div>
                      <div className="flex items-start text-sm text-content-secondary" style={{ columnGap: 10 }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-content-tertiary mt-px">3</span>
                        <span>{t('step3', 'Tap Start in the bot chat')}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative w-full my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.08]" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-surface-card px-3 text-content-tertiary">
                          {t('orClickButton', 'Or click the button below to open Telegram directly')}
                        </span>
                      </div>
                    </div>

                    {/* Open Telegram Button */}
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full h-11 rounded-xl bg-[#54a9eb] text-white font-medium text-sm hover:bg-[#4a98d4] active:scale-[0.98] transition-all"
                      style={{ columnGap: 8 }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      {t('openTelegram', 'Open in Telegram')}
                    </a>
                  </>
                )}

                {status === 'confirmed' && (
                  <div className="w-full py-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-emerald-400 font-medium">{t('authSuccess', 'Successfully signed in!')}</span>
                    <span className="text-content-tertiary text-sm mt-1">{t('authRedirecting', 'Redirecting you now...')}</span>
                  </div>
                )}

                {status === 'expired' && (
                  <div className="w-full py-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-content-secondary font-medium">{t('sessionExpired', 'QR code expired')}</span>
                    <span className="text-content-tertiary text-xs mt-1">{t('sessionExpiredHint', 'Click below to generate a new one')}</span>
                    <button
                      onClick={createToken}
                      className="mt-4 px-5 py-2 rounded-xl bg-[#54a9eb] text-white text-sm font-medium hover:bg-[#4a98d4] active:scale-[0.98] transition-all"
                    >
                      {t('tryAgain', 'Generate new QR code')}
                    </button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="w-full py-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-red-400 font-medium">{t('connectionError', 'Connection error')}</span>
                    <button
                      onClick={createToken}
                      className="mt-4 px-5 py-2 rounded-xl bg-[#54a9eb] text-white text-sm font-medium hover:bg-[#4a98d4] active:scale-[0.98] transition-all"
                    >
                      {t('tryAgain', 'Generate new QR code')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Google Auth Tab */
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mb-5">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <p className="text-content-secondary text-sm mb-6">
                  {t('googleAuthHint', 'Sign in with your Google account')}
                </p>
                <div className="w-full max-w-[280px]">
                  <GoogleLoginButton onSuccess={handleGoogleLogin} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — if no Google client ID, show nothing (no tabs shown either) */}
        {!GOOGLE_CLIENT_ID && method === 'telegram' && (
          <p className="text-center text-content-tertiary text-xs">
            {t('scanQrInstruction', 'Scan the QR code with your phone camera or Telegram app')}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
