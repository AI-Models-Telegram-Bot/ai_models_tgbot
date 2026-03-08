import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { FeaturesModal } from './FeaturesModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { getTelegramUser, openTelegramLink } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getActivePromo, getDiscountedPrice } from '@/config/promoConfig';
import type { SubscriptionPlan } from '@/types/subscription.types';

// ── Tiny promo decorations for plan cards ──────────────────────

const CardPromoFlower: React.FC<{ style: React.CSSProperties; delay: number; size?: number }> = ({ style, delay, size = 18 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={style}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 0.7, scale: 1, rotate: [0, 10, -8, 0], y: [0, -4, 2, 0] }}
    transition={{
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.6, delay, type: 'spring', bounce: 0.4 },
      rotate: { duration: 5, delay: delay + 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
      y: { duration: 4, delay: delay + 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
    }}
  >
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ filter: 'drop-shadow(0 2px 6px rgba(255,107,157,0.4))' }}>
      <defs>
        <radialGradient id={`cf${size}`} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffb3d0" />
          <stop offset="100%" stopColor="#ff4081" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="10" r="5" fill={`url(#cf${size})`} opacity="0.85" />
      <circle cx="10" cy="16" r="5" fill={`url(#cf${size})`} opacity="0.75" />
      <circle cx="22" cy="16" r="5" fill={`url(#cf${size})`} opacity="0.8" />
      <circle cx="13" cy="22" r="5" fill={`url(#cf${size})`} opacity="0.7" />
      <circle cx="19" cy="22" r="5" fill={`url(#cf${size})`} opacity="0.75" />
      <circle cx="16" cy="16" r="3" fill="#ffd700" opacity="0.9" />
    </svg>
  </motion.div>
);

const CardPromoSparkle: React.FC<{ style: React.CSSProperties; delay: number; size?: number; color?: string }> = ({ style, delay, size = 12, color = '#ffd700' }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={style}
    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
    transition={{ duration: 2.5, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill={color} opacity="0.85" />
    </svg>
  </motion.div>
);

interface SubscriptionTierCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isLowerThanCurrent?: boolean;
  isPopular?: boolean;
  index: number;
  onUpgradeSuccess?: () => void;
}

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  plan,
  isCurrent,
  isLowerThanCurrent = false,
  isPopular = false,
  index,
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
    // Fallback: convert USD to approximate RUB display
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
    if (plan.priceUSD === 0) {
      return;
    }
    if (plan.priceUSD === null) {
      // Enterprise: open support chat natively in Telegram
      const supportUsername = import.meta.env.VITE_SUPPORT_USERNAME || 'VseOnix_Support';
      openTelegramLink(`https://t.me/${supportUsername}`);
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
          : isLowerThanCurrent
            ? 'border-white/10 shadow-card opacity-60'
            : 'border-white/15 shadow-card hover:shadow-card-hover hover:translate-y-[-4px]',
        isPopular && !isCurrent && !isLowerThanCurrent && 'border-brand-secondary/40',
        showPromo && !isCurrent && !isLowerThanCurrent && 'promo-card-glow'
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

      {/* Promo discount badge */}
      {showPromo && !isCurrent && !isLowerThanCurrent && (
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: index * 0.08 + 0.3 }}
          className="absolute -top-3 -right-2 z-10"
        >
          <span className="promo-mini-badge">−{promo!.discountPercent}%</span>
        </motion.div>
      )}

      {/* Promo floating decorations on card */}
      {showPromo && !isCurrent && !isLowerThanCurrent && (
        <>
          <CardPromoFlower style={{ top: -6, left: -6 }} delay={index * 0.15} size={20} />
          <CardPromoFlower style={{ bottom: 12, right: -4 }} delay={index * 0.15 + 0.8} size={16} />
          <CardPromoSparkle style={{ top: 18, right: 8 }} delay={index * 0.2 + 0.3} size={10} color="#ffd700" />
          <CardPromoSparkle style={{ bottom: 40, left: 6 }} delay={index * 0.2 + 1.2} size={8} color="#ff85b3" />
          <CardPromoSparkle style={{ top: '50%', right: -2 }} delay={index * 0.2 + 0.6} size={11} color="#ffffff" />
        </>
      )}

      <div className="p-5 pt-6 flex flex-col flex-1">
        {/* Header — name + price */}
        <h3 className="text-xl font-bold text-white font-display">{plan.name}</h3>
        <div className="mt-1 mb-4">
          {showPromo ? (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white/50 font-display promo-old-price">
                {formatPrice(plan.priceUSD, plan.priceRUB)}
              </span>
              <span className="text-2xl font-bold font-display promo-new-price">
                {formatPromoPrice(plan.priceRUB, plan.priceUSD)}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-white font-display">
              {formatPrice(plan.priceUSD, plan.priceRUB)}
            </span>
          )}
        </div>

        {/* Tokens */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            {t('subscriptions:tokens', 'Tokens')}
          </div>
          <div className="flex items-center text-sm" style={{ columnGap: 6 }}>
            <span className="text-sm">⚡</span>
            <span className={cn(
              'font-mono text-sm',
              plan.tokens === null ? 'text-brand-accent font-semibold' : 'text-content-secondary'
            )}>
              {formatCredits(plan.tokens)} {t('subscriptions:tokens', 'tokens')}
            </span>
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
        ) : isLowerThanCurrent ? (
          <Button variant="secondary" fullWidth size="sm" disabled className="opacity-50">
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
    </motion.div>
  );
};
