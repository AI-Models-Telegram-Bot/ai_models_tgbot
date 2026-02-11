import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/services/api/auth.api';
import { Button, Card } from '@/shared/ui';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch', 'Passwords do not match'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
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
          {isSuccess ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <svg
                  className="w-7 h-7 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-content-secondary text-sm">
                {t('passwordResetSuccess', 'Password reset successfully. You can now log in.')}
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

              {/* No token warning */}
              {!token && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
                  {t('common:error', 'Invalid or missing reset token.')}
                </div>
              )}

              {/* New Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-content-secondary mb-1.5"
                >
                  {t('newPassword', 'New Password')}
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
              <Button type="submit" fullWidth isLoading={isLoading} disabled={!token}>
                {t('resetPassword', 'Reset Password')}
              </Button>
            </form>
          )}
        </Card>

        {/* Back to login link */}
        {!isSuccess && (
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

export default ResetPasswordPage;
