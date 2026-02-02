import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ParticleBackground, Skeleton } from '@/shared/ui';
import { SubscriptionTierCard } from '@/features/subscriptions/components/SubscriptionTierCard';
import { SubscriptionComparisonTable } from '@/features/subscriptions/components/SubscriptionComparisonTable';
import { useSubscriptionStore } from '@/features/subscriptions/store/subscriptionStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { hapticImpact } from '@/services/telegram/haptic';
import type { SubscriptionTier } from '@/types/user.types';

const SubscriptionsPage: React.FC = () => {
  const { t } = useTranslation('subscriptions');
  const { plans, isLoading, error, fetchPlans, selectPlan } = useSubscriptionStore();
  const { currentPlan } = useProfileStore();

  const currentTier: SubscriptionTier = (currentPlan?.tier as SubscriptionTier) || 'FREE';

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    hapticImpact('medium');
    selectPlan(tier);
  };

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
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={280} height={380} className="flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            {plans.map((plan, index) => (
              <div key={plan.tier} className="snap-start">
                <SubscriptionTierCard
                  plan={plan}
                  isCurrent={plan.tier === currentTier}
                  isPopular={plan.tier === 'PRO'}
                  index={index}
                  onSelect={() => handleSelectPlan(plan.tier as SubscriptionTier)}
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
            <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 p-3">
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
