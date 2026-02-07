import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ParticleBackground, Skeleton } from '@/shared/ui';
import { SubscriptionTierCard } from '@/features/subscriptions/components/SubscriptionTierCard';
import { SubscriptionComparisonTable } from '@/features/subscriptions/components/SubscriptionComparisonTable';
import { useSubscriptionStore } from '@/features/subscriptions/store/subscriptionStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import type { SubscriptionTier } from '@/types/user.types';

const SubscriptionsPage: React.FC = () => {
  const { t } = useTranslation(['subscriptions', 'common']);
  const { plans, isLoading, error, fetchPlans } = useSubscriptionStore();
  const { currentPlan, fetchUserProfile } = useProfileStore();

  // Use hook that polls for Telegram readiness (handles menu button timing)
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();

  const currentTier: SubscriptionTier = (currentPlan?.tier as SubscriptionTier) || 'FREE';

  useEffect(() => {
    fetchPlans();
    // Also fetch user profile to get currentPlan
    if (telegramId) {
      fetchUserProfile(telegramId);
    }
  }, [fetchPlans, fetchUserProfile, telegramId]);

  const handleUpgradeSuccess = () => {
    // Refresh user profile after successful upgrade
    if (telegramId) {
      fetchUserProfile(telegramId);
    }
  };

  // Still waiting for Telegram SDK to initialize
  if (isTelegramLoading) {
    return (
      <div className="relative min-h-screen">
        <ParticleBackground />
        <div className="relative z-10 px-4 py-6">
          <Skeleton variant="text" width={200} height={32} className="mb-2" />
          <Skeleton variant="text" width={280} height={20} className="mb-6" />
          <div className="flex overflow-x-auto scrollbar-hide pb-4" style={{ columnGap: 16 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={280} height={380} className="flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            {t('common:openInTelegramDesc', 'This app is designed to be opened from the Telegram bot. Please open it via the bot menu.')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-content-secondary mb-4">{error}</p>
          <button
            onClick={() => fetchPlans()}
            className="text-brand-primary underline"
          >
            {t('common:retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <div className="relative z-10 px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white font-display">
            {t('choosePlan', 'Choose Your Plan')}
          </h1>
          <p className="text-content-secondary text-sm mt-1">
            {t('subtitle', 'Unlock more AI models and credits')}
          </p>
        </motion.div>

        {/* Tier Cards - Horizontal Scroll */}
        {isLoading ? (
          <div className="flex overflow-x-auto scrollbar-hide pb-4" style={{ columnGap: 16 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={280} height={380} className="flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto scrollbar-hide pt-4 pb-4 snap-x snap-mandatory" style={{ columnGap: 16 }}>
            {plans.map((plan, index) => (
              <div key={plan.tier} className="snap-start">
                <SubscriptionTierCard
                  plan={plan}
                  isCurrent={plan.tier === currentTier}
                  isPopular={plan.tier === 'PRO'}
                  index={index}
                  onUpgradeSuccess={handleUpgradeSuccess}
                />
              </div>
            ))}
          </div>
        )}

        {/* Comparison Table */}
        {!isLoading && plans.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="text-lg font-semibold text-white font-display mb-4">
              {t('compareTitle', 'Compare Plans')}
            </h2>
            <div className="rounded-2xl backdrop-blur-xl bg-surface-card/90 border border-white/15 p-3">
              <SubscriptionComparisonTable
                plans={plans}
                currentTier={currentTier}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
