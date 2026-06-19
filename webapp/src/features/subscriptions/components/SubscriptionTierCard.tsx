import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { FeaturesModal } from './FeaturesModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { getTelegramUser, openTelegramLink } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getActivePromo, getDiscountedPrice } from '@/config/promoConfig';
import type { SubscriptionPlan } from '@/types/subscription.types';

interface SubscriptionTierCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isLowerThanCurrent?: boolean;
  isPopular?: boolean;
  index: number;
  onUpgradeSuccess?: () => void;
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-primary">
    <path d="M5 12.5 10 17.5 19 6.5" />
  </svg>
);

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  plan,
  isCurrent,
  isLowerThanCurrent = false,
  isPopular = false,
  onUpgradeSuccess,
}) => {
  const { t } = useTranslation(['subscriptions', 'common', 'profile']);

  const [showFeatures, setShowFeatures] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const telegramUser = getTelegramUser();
  const authUser = useAuthStore((s) => s.user);
  const telegramId = telegramUser?.id?.toString() || authUser?.telegramId || '';

  const promo = getActivePromo();
  const hasPaidPrice = plan.priceUSD !== null && plan.priceUSD > 0;
  const showPromo = !!promo && hasPaidPrice;

  const formatPrice = (priceUSD: number | null, priceRUB: number | null) => {
    if (priceUSD === null) return t('subscriptions:price.contactUs');
    if (priceUSD === 0) return t('subscriptions:price.free');
    const perMonth = t('subscriptions:price.perMonth');
    if (priceRUB) {
      return `${priceRUB.toLocaleString('ru-RU')} ₽${perMonth}`;
    }
    return `${Math.round((priceUSD || 0) * 95).toLocaleString('ru-RU')} ₽${perMonth}`;
  };

  const formatPromoPrice = (priceRUB: number | null, priceUSD: number | null) => {
    const perMonth = t('subscriptions:price.perMonth');
    if (priceRUB) {
      return `${getDiscountedPrice(priceRUB).toLocaleString('ru-RU')} ₽${perMonth}`;
    }
    if (priceUSD) {
      return `${getDiscountedPrice(Math.round(priceUSD * 95)).toLocaleString('ru-RU')} ₽${perMonth}`;
    }
    return '';
  };

  const formatCredits = (credits: number | null) => {
    if (credits === null) return t('subscriptions:unlimited');
    return credits.toLocaleString();
  };

  const handleUpgradeClick = () => {
    if (plan.priceUSD === 0) return;
    if (plan.priceUSD === null) {
      const supportUsername = import.meta.env.VITE_SUPPORT_USERNAME || 'VseOnix_Support';
      openTelegramLink(`https://t.me/${supportUsername}`);
      return;
    }
    setShowPayment(true);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-surface-card flex flex-col transition-colors duration-200',
        isCurrent
          ? 'border-brand-primary/60'
          : isLowerThanCurrent
            ? 'border-border opacity-55'
            : 'border-border',
      )}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header — name + tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-semibold text-content-primary font-display tracking-tight">{plan.name}</h3>
          <div className="flex items-center gap-1.5">
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary/15 text-brand-primary">
                {t('subscriptions:currentPlan', 'Current Plan')}
              </span>
            )}
            {isPopular && !isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-elevated text-content-secondary">
                {t('subscriptions:popular', 'Popular')}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          {showPromo ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-brand-primary font-display tracking-tight">
                {formatPromoPrice(plan.priceRUB, plan.priceUSD)}
              </span>
              <span className="text-sm text-content-tertiary line-through decoration-content-tertiary/60">
                {formatPrice(plan.priceUSD, plan.priceRUB)}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-semibold text-content-primary font-display tracking-tight">
              {formatPrice(plan.priceUSD, plan.priceRUB)}
            </span>
          )}
        </div>

        {/* Tokens */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-1">
            {t('subscriptions:tokens', 'Tokens')}
          </div>
          <span className={cn(
            'font-mono text-sm',
            plan.tokens === null ? 'text-brand-accent font-semibold' : 'text-content-primary'
          )}>
            {formatCredits(plan.tokens)} {t('subscriptions:tokens', 'tokens')}
          </span>
        </div>

        {/* Features preview */}
        <div className="space-y-2 mb-4 flex-1">
          {plan.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-content-secondary text-sm leading-snug">{t(`subscriptions:${feature}`, feature)}</span>
            </div>
          ))}
        </div>

        {/* All Features button */}
        {plan.features.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowFeatures(true); }}
            className="w-full text-center text-sm font-medium text-content-secondary hover:text-content-primary py-2 mb-3 rounded-lg bg-surface-secondary hover:bg-surface-elevated transition-colors"
          >
            {t('subscriptions:allFeatures', 'All Features')} ({plan.features.length})
          </button>
        )}

        {/* Action button */}
        {isCurrent ? (
          <Button variant="secondary" fullWidth size="sm" disabled>
            {t('subscriptions:currentPlan', 'Current Plan')}
          </Button>
        ) : plan.priceUSD === null ? (
          <Button variant="primary" fullWidth size="sm" onClick={handleUpgradeClick}>
            {t('subscriptions:contactUs', 'Contact Us')}
          </Button>
        ) : isLowerThanCurrent ? (
          <Button variant="secondary" fullWidth size="sm" disabled>
            {plan.priceUSD === 0
              ? t('subscriptions:getStarted', 'Get Started')
              : t('subscriptions:includedInCurrent', 'Included')}
          </Button>
        ) : (
          <Button
            variant={plan.priceUSD === 0 ? 'secondary' : 'primary'}
            fullWidth
            size="sm"
            onClick={handleUpgradeClick}
          >
            {plan.priceUSD === 0
              ? t('subscriptions:getStarted', 'Get Started')
              : t('subscriptions:upgrade', 'Upgrade')}
          </Button>
        )}
      </div>

      <FeaturesModal
        isOpen={showFeatures}
        onClose={() => setShowFeatures(false)}
        plan={plan}
      />

      <PaymentMethodModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        plan={plan}
        telegramId={telegramId}
        onSuccess={onUpgradeSuccess}
      />
    </div>
  );
};
