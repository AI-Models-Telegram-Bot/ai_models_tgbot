import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { TierBadge } from './TierBadge';
import type { SubscriptionPlan } from '@/types/subscription.types';
import type { SubscriptionTier } from '@/types/user.types';

interface SubscriptionTierCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isPopular?: boolean;
  index: number;
  onSelect: () => void;
}

const formatPrice = (priceUSD: number | null) => {
  if (priceUSD === null) return 'Contact Us';
  if (priceUSD === 0) return 'Free';
  return `$${priceUSD}/mo`;
};

const formatCredits = (credits: number | null) => {
  if (credits === null) return 'Unlimited';
  return credits.toLocaleString();
};

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  plan,
  isCurrent,
  isPopular = false,
  index,
  onSelect,
}) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        'relative flex-shrink-0 w-[280px] rounded-2xl backdrop-blur-xl bg-surface-card/90 border transition-all duration-300',
        isCurrent
          ? 'border-brand-primary/50 shadow-neon'
          : 'border-white/15 shadow-card hover:shadow-card-hover hover:translate-y-[-4px]',
        isPopular && !isCurrent && 'border-brand-secondary/40'
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-premium rounded-full text-xs font-semibold text-white shadow-gold">
          Popular
        </div>
      )}

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-primary rounded-full text-xs font-semibold text-white shadow-neon">
          Current Plan
        </div>
      )}

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <TierBadge tier={plan.tier as SubscriptionTier} />
        </div>

        <h3 className="text-xl font-bold text-white font-display">{plan.name}</h3>

        {/* Price */}
        <div className="mt-2 mb-4">
          <span className="text-2xl font-bold text-white font-display">
            {formatPrice(plan.priceUSD)}
          </span>
        </div>

        {/* Credits */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Credits</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Text', value: plan.credits.text, icon: '🤖' },
              { label: 'Image', value: plan.credits.image, icon: '🖼' },
              { label: 'Video', value: plan.credits.video, icon: '🎬' },
              { label: 'Audio', value: plan.credits.audio, icon: '🎵' },
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

        {/* Features */}
        <div className="space-y-1.5 mb-5">
          {plan.features.slice(0, 5).map((feature, i) => (
            <div key={i} className="flex items-start text-sm" style={{ columnGap: 8 }}>
              <span className="text-brand-primary mt-0.5 text-xs">✓</span>
              <span className="text-content-secondary text-xs">{feature}</span>
            </div>
          ))}
          {plan.features.length > 5 && (
            <span className="text-content-tertiary text-xs">
              +{plan.features.length - 5} more
            </span>
          )}
        </div>

        {/* Action button */}
        {isCurrent ? (
          <Button variant="secondary" fullWidth size="sm" disabled>
            Current Plan
          </Button>
        ) : plan.priceUSD === null ? (
          <Button variant="premium" fullWidth size="sm" onClick={onSelect}>
            Contact Us
          </Button>
        ) : (
          <Button
            variant={isPopular ? 'primary' : 'secondary'}
            fullWidth
            size="sm"
            onClick={onSelect}
          >
            {plan.priceUSD === 0 ? 'Get Started' : 'Upgrade'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};
