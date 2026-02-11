import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { authApi } from '@/services/api/auth.api';
import { Button, Card } from '@/shared/ui';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-content-primary">
            {t('resetPassword', 'Reset Password')}
          </h1>
        </div>

        <Card variant="elevated" padding="lg">
          {isSent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
                <svg
                  className="w-7 h-7 text-brand-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-content-secondary text-sm">
                {t('resetEmailSent', 'If that email exists, a password reset link has been sent.')}
              </p>
              <Link
                to="/auth/login"
                className="inline-block text-brand-primary text-sm font-medium hover:text-brand-primary/80 transition-colors"
              >
                {t('backToLogin', 'Back to Login')}
              </Link>
            </div>
          ) : (
            /* Form state */
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

              {/* Submit button */}
              <Button type="submit" fullWidth isLoading={isLoading}>
                {t('sendResetLink', 'Send Reset Link')}
              </Button>
            </form>
          )}
        </Card>

        {/* Back to login link */}
        {!isSent && (
          <p className="text-center text-sm">
            <Link
              to="/auth/login"
              className="text-brand-primary font-medium hover:text-brand-primary/80 transition-colors"
            >
              {t('backToLogin', 'Back to Login')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
