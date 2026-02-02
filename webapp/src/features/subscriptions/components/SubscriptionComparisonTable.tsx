import React from 'react';
import { cn } from '@/shared/utils/cn';
import type { SubscriptionPlan } from '@/types/subscription.types';
import type { SubscriptionTier } from '@/types/user.types';

interface SubscriptionComparisonTableProps {
  plans: SubscriptionPlan[];
  currentTier: SubscriptionTier;
}

const formatValue = (value: number | null | boolean | string) => {
  if (value === null) return '∞';
  if (typeof value === 'boolean') return value ? '✓' : '—';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

export const SubscriptionComparisonTable: React.FC<SubscriptionComparisonTableProps> = ({
  plans,
  currentTier,
}) => {
  const rows = [
    { label: 'Price', getValue: (p: SubscriptionPlan) => p.priceUSD === null ? 'Custom' : p.priceUSD === 0 ? 'Free' : `$${p.priceUSD}` },
    { label: 'Text Credits', getValue: (p: SubscriptionPlan) => formatValue(p.credits.text) },
    { label: 'Image Credits', getValue: (p: SubscriptionPlan) => formatValue(p.credits.image) },
    { label: 'Video Credits', getValue: (p: SubscriptionPlan) => formatValue(p.credits.video) },
    { label: 'Audio Credits', getValue: (p: SubscriptionPlan) => formatValue(p.credits.audio) },
    { label: 'Priority Support', getValue: (p: SubscriptionPlan) => formatValue(p.prioritySupport) },
    { label: 'API Access', getValue: (p: SubscriptionPlan) => formatValue(p.apiAccess) },
    { label: 'Referral Bonus', getValue: (p: SubscriptionPlan) => `${p.referralBonus}%` },
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-content-tertiary uppercase tracking-wider py-3 px-3 sticky left-0 bg-surface-bg/90 backdrop-blur-sm">
              Feature
            </th>
            {plans.map((plan) => (
              <th
                key={plan.tier}
                className={cn(
                  'text-center text-xs font-semibold py-3 px-2',
                  plan.tier === currentTier ? 'text-brand-primary' : 'text-content-secondary'
                )}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
              <td className="text-xs text-content-secondary py-2.5 px-3 sticky left-0 bg-surface-bg/90 backdrop-blur-sm">
                {row.label}
              </td>
              {plans.map((plan) => {
                const value = row.getValue(plan);
                return (
                  <td
                    key={plan.tier}
                    className={cn(
                      'text-center text-xs py-2.5 px-2 font-mono',
                      plan.tier === currentTier ? 'text-brand-primary font-semibold' : 'text-content-secondary',
                      value === '∞' && 'text-brand-accent font-semibold',
                      value === '✓' && 'text-emerald-400',
                      value === '—' && 'text-content-tertiary'
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
