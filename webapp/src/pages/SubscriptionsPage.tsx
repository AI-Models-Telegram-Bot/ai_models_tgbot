import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground, Skeleton } from '@/shared/ui';
import { SubscriptionTierCard } from '@/features/subscriptions/components/SubscriptionTierCard';
import { SubscriptionComparisonTable } from '@/features/subscriptions/components/SubscriptionComparisonTable';
import { TokenPackagesList } from '@/features/subscriptions/components/TokenPackagesList';
import { March8PromoBanner } from '@/features/subscriptions/components/March8PromoBanner';
import { useSubscriptionStore } from '@/features/subscriptions/store/subscriptionStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { isTelegramEnvironment } from '@/services/telegram/telegram';
import type { SubscriptionTier } from '@/types/user.types';

const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'PREMIUM', 'BUSINESS', 'ENTERPRISE'];

type Tab = 'plans' | 'tokens';

const SubscriptionsPage: React.FC = () => {
  const { t } = useTranslation(['subscriptions', 'common']);
  const { plans, isLoading, error, fetchPlans } = useSubscriptionStore();
  const { currentPlan, fetchUserProfile, fetchWebProfile } = useProfileStore();

  const isTelegram = isTelegramEnvironment();
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'plans';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const currentTier: SubscriptionTier = (currentPlan?.tier as SubscriptionTier) || 'FREE';
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'plans' ? {} : { tab });
  };

  const scrollToNextPlan = useCallback(() => {
    if (!scrollRef.current || plans.length === 0) return;
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const targetIndex = Math.min(currentIndex + 1, plans.length - 1);
    const cardWidth = 280 + 16;
    scrollRef.current.scrollTo({ left: targetIndex * cardWidth - 16, behavior: 'smooth' });
  }, [plans, currentTier]);

  useEffect(() => {
    if (!isLoading && plans.length > 0 && currentTier !== 'FREE' && activeTab === 'plans') {
      setTimeout(scrollToNextPlan, 300);
    }
  }, [isLoading, plans, currentTier, scrollToNextPlan, activeTab]);

  useEffect(() => {
    fetchPlans();
    if (isTelegram && telegramId) {
      fetchUserProfile(telegramId);
    } else if (!isTelegram) {
      fetchWebProfile();
    }
  }, [fetchPlans, fetchUserProfile, fetchWebProfile, telegramId, isTelegram]);

  const handleUpgradeSuccess = () => {
    if (isTelegram && telegramId) {
      fetchUserProfile(telegramId);
    } else if (!isTelegram) {
      fetchWebProfile();
    }
  };

  if (isTelegram && isTelegramLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-content-secondary mb-4">{error}</p>
          <button onClick={() => fetchPlans()} className="text-brand-primary underline">
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
          className="mb-4"
        >
          <h1 className="text-2xl font-bold text-white font-display">
            {activeTab === 'plans'
              ? t('choosePlan', 'Choose Your Plan')
              : t('tokenPackages.title', 'Buy Tokens')}
          </h1>
          <p className="text-content-secondary text-sm mt-1">
            {activeTab === 'plans'
              ? t('subtitle', 'Unlock more AI models and tokens')
              : t('tokenPackages.subtitle', 'Top up your balance anytime')}
          </p>
        </motion.div>

        {/* Promo Banner */}
        <March8PromoBanner />

        {/* Tab bar */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6" style={{ columnGap: 4 }}>
          {(['plans', 'tokens'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'text-content-secondary hover:text-white'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'plans' ? (
          <>
            {/* Tier Cards - Horizontal Scroll */}
            {isLoading ? (
              <div className="flex overflow-x-auto scrollbar-hide pb-4" style={{ columnGap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" width={280} height={380} className="flex-shrink-0 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide pt-4 pb-4 snap-x snap-mandatory" style={{ columnGap: 16 }}>
                {plans.map((plan, index) => {
                  const planTierIndex = TIER_ORDER.indexOf(plan.tier as SubscriptionTier);
                  const currentTierIndex = TIER_ORDER.indexOf(currentTier);
                  const isLowerThan = planTierIndex < currentTierIndex;
                  return (
                    <div key={plan.tier} className="snap-start">
                      <SubscriptionTierCard
                        plan={plan}
                        isCurrent={plan.tier === currentTier}
                        isLowerThanCurrent={isLowerThan}
                        isPopular={plan.tier === 'PRO'}
                        index={index}
                        onUpgradeSuccess={handleUpgradeSuccess}
                      />
                    </div>
                  );
                })}
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
                  <SubscriptionComparisonTable plans={plans} currentTier={currentTier} />
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <TokenPackagesList onPurchaseSuccess={handleUpgradeSuccess} />
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
