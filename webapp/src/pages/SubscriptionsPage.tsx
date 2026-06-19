import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, ShowcaseGallery, GenerativeMark } from '@/shared/ui';
import { SubscriptionTierCard } from '@/features/subscriptions/components/SubscriptionTierCard';
import { SubscriptionComparisonTable } from '@/features/subscriptions/components/SubscriptionComparisonTable';
import { TokenPackagesList } from '@/features/subscriptions/components/TokenPackagesList';
import { useSubscriptionStore } from '@/features/subscriptions/store/subscriptionStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { isTelegramEnvironment } from '@/services/telegram/telegram';
import { cn } from '@/shared/utils/cn';
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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'plans' ? {} : { tab });
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-content-secondary mb-4">{error}</p>
          <button onClick={() => fetchPlans()} className="text-brand-primary font-medium">
            {t('common:retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  const showSkeleton = isLoading || (isTelegram && isTelegramLoading);

  return (
    <div className="px-4 pt-6 max-w-2xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <header className="mb-5 flex items-start gap-3">
        <GenerativeMark size={44} className="mt-0.5" />
        <div>
          <h1 className="text-2xl font-semibold text-content-primary font-display tracking-tight">
            {activeTab === 'plans'
              ? t('choosePlan', 'Choose Your Plan')
              : t('tokenPackages.title', 'Buy Tokens')}
          </h1>
          <p className="text-content-secondary text-sm mt-1.5">
            {activeTab === 'plans'
              ? t('subtitle', 'Unlock more AI models and tokens')
              : t('tokenPackages.subtitle', 'Top up your balance anytime')}
          </p>
        </div>
      </header>

      {/* What you can create — generative showcase (plans tab only) */}
      {activeTab === 'plans' && <ShowcaseGallery compact className="mb-6" />}

      {/* Tab bar */}
      <div className="flex rounded-xl bg-surface-secondary border border-border p-1 mb-6 gap-1">
        {(['plans', 'tokens'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200',
              activeTab === tab
                ? 'bg-surface-elevated text-content-primary'
                : 'text-content-tertiary hover:text-content-secondary'
            )}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'plans' ? (
        <>
          {showSkeleton ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={300} className="w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const planTierIndex = TIER_ORDER.indexOf(plan.tier as SubscriptionTier);
                const currentTierIndex = TIER_ORDER.indexOf(currentTier);
                return (
                  <SubscriptionTierCard
                    key={plan.tier}
                    plan={plan}
                    isCurrent={plan.tier === currentTier}
                    isLowerThanCurrent={planTierIndex < currentTierIndex}
                    isPopular={plan.tier === 'PRO'}
                    index={0}
                    onUpgradeSuccess={handleUpgradeSuccess}
                  />
                );
              })}
            </div>
          )}

          {/* Comparison Table */}
          {!showSkeleton && plans.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-content-primary font-display mb-4 tracking-tight">
                {t('compareTitle', 'Compare Plans')}
              </h2>
              <div className="rounded-2xl bg-surface-card border border-border p-3">
                <SubscriptionComparisonTable plans={plans} currentTier={currentTier} />
              </div>
            </section>
          )}
        </>
      ) : (
        <TokenPackagesList onPurchaseSuccess={handleUpgradeSuccess} />
      )}
    </div>
  );
};

export default SubscriptionsPage;
