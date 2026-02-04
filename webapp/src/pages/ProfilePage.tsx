import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { UserCard } from '@/features/profile/components/UserCard';
import { CurrentPlanCard } from '@/features/profile/components/CurrentPlanCard';
import { CreditAllocationBar } from '@/features/subscriptions/components/CreditAllocationBar';
import { ParticleBackground, Skeleton, Card } from '@/shared/ui';
import { getTelegramUser } from '@/services/telegram/telegram';
import { formatCredits } from '@/shared/utils/formatters';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, wallet, currentPlan, stats, isLoading, error, fetchUserProfile } =
    useProfileStore();

  // Memoize telegramId to avoid infinite re-render (getTelegramUser returns new object each call)
  const telegramId = useMemo(() => getTelegramUser()?.id?.toString() ?? null, []);

  useEffect(() => {
    if (telegramId) {
      fetchUserProfile(telegramId);
    }
  }, [fetchUserProfile, telegramId]);

  // No Telegram context — show prompt to open from bot
  if (!telegramId) {
    return (
      <div className="relative min-h-screen">
        <ParticleBackground />
        <div className="relative z-10 p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold font-display mb-2">
            {t('common:openInTelegram', 'Open in Telegram')}
          </h2>
          <p className="text-content-secondary text-sm max-w-xs">
            {t('common:openInTelegramDesc', 'This app is designed to be opened from the Telegram bot. Please open it via the bot menu or profile button.')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-content-secondary text-sm">{error}</p>
        <button
          onClick={() => fetchUserProfile(telegramId)}
          className="mt-4 text-brand-primary text-sm font-medium"
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  // Data loaded but user/wallet still null — shouldn't normally happen, show loading
  if (!user || !wallet) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <div className="relative z-10 p-4 space-y-5">
        {/* User profile + balance */}
        <UserCard user={user} wallet={wallet} />
        <CurrentPlanCard
          plan={currentPlan}
          onViewPlans={() => navigate('/')}
        />

        {/* Credit Usage */}
        {currentPlan && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-content-tertiary uppercase tracking-wider mb-3">
                {t('profile:creditUsage', 'Credit Usage')}
              </h3>
              <div className="space-y-3">
                <CreditAllocationBar
                  label="Text"
                  icon="🤖"
                  used={wallet.textBalance}
                  total={currentPlan.credits.text}
                  color="bg-cyan-500"
                />
                <CreditAllocationBar
                  label="Image"
                  icon="🖼"
                  used={wallet.imageBalance}
                  total={currentPlan.credits.image}
                  color="bg-pink-500"
                />
                <CreditAllocationBar
                  label="Video"
                  icon="🎬"
                  used={wallet.videoBalance}
                  total={currentPlan.credits.video}
                  color="bg-purple-500"
                />
                <CreditAllocationBar
                  label="Audio"
                  icon="🎵"
                  used={wallet.audioBalance}
                  total={currentPlan.credits.audio}
                  color="bg-emerald-500"
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        {stats && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <p className="text-content-tertiary text-xs uppercase tracking-wider">
                  {t('profile:totalRequests', 'Requests')}
                </p>
                <p className="text-white text-xl font-bold font-mono mt-1">
                  {formatCredits(stats.totalRequests)}
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-content-tertiary text-xs uppercase tracking-wider">
                  {t('profile:totalSpent', 'Total Spent')}
                </p>
                <p className="text-white text-xl font-bold font-mono mt-1">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
