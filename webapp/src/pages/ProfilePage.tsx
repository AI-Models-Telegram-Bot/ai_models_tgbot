import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { UserCard } from '@/features/profile/components/UserCard';
import { CurrentPlanCard } from '@/features/profile/components/CurrentPlanCard';
import { CreditAllocationBar } from '@/features/subscriptions/components/CreditAllocationBar';
import { Skeleton, Card, GenerativeMark } from '@/shared/ui';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { isTelegramEnvironment } from '@/services/telegram/telegram';
import { formatCredits } from '@/shared/utils/formatters';

const LoadingState: React.FC = () => (
  <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
    <Skeleton className="h-32 w-full rounded-2xl" variant="rectangular" />
    <Skeleton className="h-28 w-full rounded-2xl" variant="rectangular" />
    <Skeleton className="h-48 w-full rounded-2xl" variant="rectangular" />
  </div>
);

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, wallet, currentPlan, stats, isLoading, error, fetchUserProfile, fetchWebProfile } =
    useProfileStore();

  const isTelegram = isTelegramEnvironment();

  // Use hook that polls for Telegram readiness (handles menu button timing)
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();

  // Fetch profile on mount
  useEffect(() => {
    if (isTelegram && telegramId) {
      fetchUserProfile(telegramId);
    } else if (!isTelegram) {
      fetchWebProfile();
    }
  }, [fetchUserProfile, fetchWebProfile, telegramId, isTelegram]);

  // Auto-refresh: refetch on visibility change + every 60s
  useEffect(() => {
    const refresh = () => {
      if (isTelegram && telegramId) fetchUserProfile(telegramId);
      else if (!isTelegram) fetchWebProfile();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(refresh, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [fetchUserProfile, fetchWebProfile, telegramId, isTelegram]);

  if (isTelegram && isTelegramLoading) return <LoadingState />;
  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-content-secondary text-sm">{error}</p>
        <button
          onClick={() => (isTelegram && telegramId ? fetchUserProfile(telegramId) : fetchWebProfile())}
          className="mt-4 text-brand-primary text-sm font-medium"
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  if (!user || !wallet) return <LoadingState />;

  return (
    <div className="p-4 pt-6 max-w-2xl mx-auto w-full animate-fade-in">
      <header className="mb-5 flex items-center gap-3">
        <GenerativeMark size={44} />
        <h1 className="font-display text-2xl font-semibold text-content-primary tracking-tight">
          {t('profile:title')}
        </h1>
      </header>

      <div className="space-y-4">
        <UserCard user={user} wallet={wallet} />

        <CurrentPlanCard plan={currentPlan} onViewPlans={() => navigate('/subscriptions')} />

        {currentPlan && (
          <Card>
            <h3 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
              {t('profile:tokenUsage', 'Token Usage')}
            </h3>
            <CreditAllocationBar
              label={t('profile:tokens', 'Tokens')}
              used={wallet.tokenBalance}
              total={currentPlan.tokens}
              color="bg-brand-primary"
            />
          </Card>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md">
              <p className="text-content-tertiary text-xs uppercase tracking-wider">
                {t('profile:totalRequests', 'Requests')}
              </p>
              <p className="text-content-primary text-2xl font-semibold font-mono mt-2 tracking-tight">
                {formatCredits(stats.totalRequests)}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-content-tertiary text-xs uppercase tracking-wider">
                {t('profile:totalSpent', 'Total Spent')}
              </p>
              <p className="text-content-primary text-2xl font-semibold font-mono mt-2 tracking-tight">
                {stats.totalSpent.toFixed(2)} ₽
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
