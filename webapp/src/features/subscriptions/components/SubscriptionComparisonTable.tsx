import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');

  const rows = [
    { label: t('price'), getValue: (p: SubscriptionPlan) => p.priceUSD === null ? t('custom') : p.priceUSD === 0 ? t('free') : `$${p.priceUSD}` },
    { label: t('textCredits'), getValue: (p: SubscriptionPlan) => formatValue(p.credits.text) },
    { label: t('imageCredits'), getValue: (p: SubscriptionPlan) => formatValue(p.credits.image) },
    { label: t('videoCredits'), getValue: (p: SubscriptionPlan) => formatValue(p.credits.video) },
    { label: t('prioritySupport'), getValue: (p: SubscriptionPlan) => formatValue(p.prioritySupport) },
    { label: t('referralBonus'), getValue: (p: SubscriptionPlan) => `${p.referralBonus}%` },
  ];

  return (
    <div className="relative">
      {/* Scroll hint gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface-card/90 to-transparent z-10 pointer-events-none rounded-r-2xl" />
      <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-content-tertiary uppercase tracking-wider py-3 px-3 sticky left-0 bg-surface-card/90 backdrop-blur-sm w-[100px] min-w-[100px]">
              {t('feature')}
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
              <td className="text-xs text-content-secondary py-2.5 px-3 sticky left-0 bg-surface-card/90 backdrop-blur-sm w-[100px] min-w-[100px]">
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
    </div>
  );
};
