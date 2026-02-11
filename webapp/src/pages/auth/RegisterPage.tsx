import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { TelegramLoginWidget } from '@/features/auth/components/TelegramLoginWidget';
import { Button, Card } from '@/shared/ui';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithTelegram, isLoading, error, clearError } =
    useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError(t('passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t('passwordsNoMatch', 'Passwords do not match'));
      return;
    }

    try {
      await register(email, password, name || undefined, i18n.language);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    clearError();
    setLocalError(null);
    try {
      await loginWithGoogle(credential);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  const handleTelegramAuth = async (user: any) => {
    clearError();
    setLocalError(null);
    try {
      await loginWithTelegram(user);
      navigate('/');
    } catch {
      // Error is set in the store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-content-primary">
            {t('createAccountTitle', 'Create your account')}
          </h1>
          <p className="mt-2 text-content-secondary text-sm">
            {t('createAccountSubtitle', 'Start generating with AI in seconds')}
          </p>
        </div>

        {/* Register Card */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {displayError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {displayError}
              </div>
            )}

            {/* Name field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-content-secondary mb-1.5"
              >
                {t('name', 'Name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full h-12 px-4 rounded-xl bg-surface-bg border border-white/10 text-content-primary placeholder-content-secondary/50 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all duration-200"
                placeholder={t('name', 'Name')}
              />
            </div>

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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-content-secondary mb-1.5"
              >
                {t('password', 'Password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full h-12 px-4 rounded-xl bg-surface-bg border border-white/10 text-content-primary placeholder-content-secondary/50 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all duration-200"
                placeholder="********"
              />
            </div>

            {/* Confirm Password field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-content-secondary mb-1.5"
              >
                {t('confirmPassword', 'Confirm Password')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full h-12 px-4 rounded-xl bg-surface-bg border border-white/10 text-content-primary placeholder-content-secondary/50 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all duration-200"
                placeholder="********"
              />
            </div>

            {/* Submit button */}
            <Button type="submit" fullWidth isLoading={isLoading}>
              {t('register', 'Create Account')}
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

        {/* Login link */}
        <p className="text-center text-sm text-content-secondary">
          {t('hasAccount', 'Already have an account?')}{' '}
          <Link
            to="/auth/login"
            className="text-brand-primary font-medium hover:text-brand-primary/80 transition-colors"
          >
            {t('login', 'Log In')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
