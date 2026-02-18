import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { FeaturesModal } from './FeaturesModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { getTelegramUser, openTelegramLink } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { SubscriptionPlan } from '@/types/subscription.types';

interface SubscriptionTierCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isPopular?: boolean;
  index: number;
  onUpgradeSuccess?: () => void;
}

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  plan,
  isCurrent,
  isPopular = false,
  index,
  onUpgradeSuccess,
}) => {
  const { t, i18n } = useTranslation(['subscriptions', 'common', 'profile']);

  const [showFeatures, setShowFeatures] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const telegramUser = getTelegramUser();
  const authUser = useAuthStore((s) => s.user);
  const telegramId = telegramUser?.id?.toString() || authUser?.telegramId || '';

  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const formatPrice = (priceUSD: number | null, priceRUB: number | null) => {
    if (priceUSD === null) return t('subscriptions:price.contactUs');
    if (priceUSD === 0) return t('subscriptions:price.free');
    const perMonth = t('subscriptions:price.perMonth');
    if (lang === 'ru' && priceRUB) {
      return `${priceRUB.toLocaleString('ru-RU')} ₽${perMonth}`;
    }
    return `$${priceUSD}${perMonth}`;
  };

  const formatCredits = (credits: number | null) => {
    if (credits === null) return t('subscriptions:unlimited');
    return credits.toLocaleString();
  };

  const handleUpgradeClick = () => {
    if (plan.priceUSD === 0) {
      return;
    }
    if (plan.priceUSD === null) {
      // Enterprise: open direct Telegram link to support
      const supportUsername = import.meta.env.VITE_SUPPORT_USERNAME || '';
      if (supportUsername) {
        openTelegramLink(`https://t.me/${supportUsername}`);
      }
      return;
    }
    setShowPayment(true);
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        'relative flex-shrink-0 w-[280px] h-[420px] rounded-2xl backdrop-blur-xl bg-surface-card/90 border transition-all duration-300 flex flex-col',
        isCurrent
          ? 'border-brand-primary/50 shadow-neon'
          : 'border-white/15 shadow-card hover:shadow-card-hover hover:translate-y-[-4px]',
        isPopular && !isCurrent && 'border-brand-secondary/40'
      )}
    >
      {/* Popular badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-premium rounded-full text-xs font-semibold text-white shadow-gold">
          {t('subscriptions:popular', 'Popular')}
        </div>
      )}

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-primary rounded-full text-xs font-semibold text-white shadow-neon">
          {t('subscriptions:currentPlan', 'Current Plan')}
        </div>
      )}

      <div className="p-5 pt-6 flex flex-col flex-1">
        {/* Header — name + price */}
        <h3 className="text-xl font-bold text-white font-display">{plan.name}</h3>
        <div className="mt-1 mb-4">
          <span className="text-2xl font-bold text-white font-display">
            {formatPrice(plan.priceUSD, plan.priceRUB)}
          </span>
        </div>

        {/* Credits */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            {t('subscriptions:credits', 'Credits')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('profile:balances.text', 'Text'), value: plan.credits.text, icon: '💬' },
              { label: t('profile:balances.image', 'Image'), value: plan.credits.image, icon: '🖼' },
              { label: t('profile:balances.video', 'Video'), value: plan.credits.video, icon: '🎬' },
            ].map((item) => (
              <div key={item.label} className="flex items-center text-sm" style={{ columnGap: 6 }}>
                <span className="text-xs">{item.icon}</span>
                <span className={cn(
                  'font-mono text-xs',
                  item.value === null ? 'text-brand-accent font-semibold' : 'text-content-secondary'
                )}>
                  {formatCredits(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features preview */}
        <div className="space-y-1.5 mb-3 flex-1">
          {plan.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start text-sm" style={{ columnGap: 8 }}>
              <span className="text-brand-primary mt-0.5 text-xs">✓</span>
              <span className="text-content-secondary text-xs">{t(`subscriptions:${feature}`, feature)}</span>
            </div>
          ))}
        </div>

        {/* All Features button */}
        {plan.features.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowFeatures(true); }}
            className="w-full text-center text-xs font-medium text-brand-primary/80 hover:text-brand-primary py-1.5 mb-3 rounded-lg bg-brand-primary/5 border border-brand-primary/10 transition-colors"
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
          <Button variant="premium" fullWidth size="sm" onClick={handleUpgradeClick}>
            {t('subscriptions:contactUs', 'Contact Us')}
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
              : t('subscriptions:upgrade', 'Subscribe')}
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
    </motion.div>
  );
};
