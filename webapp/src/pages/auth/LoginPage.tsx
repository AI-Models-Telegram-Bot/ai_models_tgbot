import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { TelegramLoginWidget } from '@/features/auth/components/TelegramLoginWidget';
import { Button, Card } from '@/shared/ui';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithTelegram, isLoading, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    clearError();
    try {
      await loginWithGoogle(credential);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  const handleTelegramAuth = async (user: any) => {
    clearError();
    try {
      await loginWithTelegram(user);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-content-primary">
            {t('welcomeTitle', 'Welcome to VseoNix AI')}
          </h1>
          <p className="mt-2 text-content-secondary text-sm">
            {t('welcomeSubtitle', 'Access powerful AI models for text, image, video, and audio generation')}
          </p>
        </div>

        {/* Login Card */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-content-secondary mb-1.5"
              >
                {t('email', 'Email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-12 px-4 rounded-xl bg-surface-bg border border-white/10 text-content-primary placeholder-content-secondary/50 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-content-secondary"
                >
                  {t('password', 'Password')}
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  {t('forgotPassword', 'Forgot Password?')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-12 px-4 rounded-xl bg-surface-bg border border-white/10 text-content-primary placeholder-content-secondary/50 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all duration-200"
                placeholder="********"
              />
            </div>

            {/* Submit button */}
            <Button type="submit" fullWidth isLoading={isLoading}>
              {t('login', 'Log In')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-card px-3 text-content-secondary">
                {t('orContinueWith', 'Or continue with')}
              </span>
            </div>
          </div>

          {/* Social logins */}
          <div className="space-y-3">
            {GOOGLE_CLIENT_ID && <GoogleLoginButton onSuccess={handleGoogleLogin} />}
            <TelegramLoginWidget onAuth={handleTelegramAuth} />
          </div>
        </Card>

        {/* Register link */}
        <p className="text-center text-sm text-content-secondary">
          {t('noAccount', "Don't have an account?")}{' '}
          <Link
            to="/auth/register"
            className="text-brand-primary font-medium hover:text-brand-primary/80 transition-colors"
          >
            {t('register', 'Create Account')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
