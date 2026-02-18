import React from 'react';
import { cn } from '@/shared/utils/cn';
import type { SubscriptionTier } from '@/types/user.types';

interface TierBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

const tierStyles: Record<SubscriptionTier, string> = {
  FREE: 'bg-content-tertiary/20 text-content-tertiary',
  STARTER: 'bg-brand-primary/20 text-brand-primary',
  PRO: 'bg-blue-500/20 text-blue-400',
  PREMIUM: 'bg-purple-500/20 text-purple-400',
  BUSINESS: 'bg-brand-accent/20 text-brand-accent',
  ENTERPRISE: 'bg-gradient-to-r from-brand-accent/20 to-brand-secondary/20 text-brand-accent',
};

const tierLabels: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  PREMIUM: 'Premium',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        tierStyles[tier],
        className
      )}
    >
      {tierLabels[tier]}
    </span>
  );
};
