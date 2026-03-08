import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@/shared/ui';
import { getActivePromo } from '@/config/promoConfig';
import type { CurrentPlan } from '@/types/user.types';

interface CurrentPlanCardProps {
  plan: CurrentPlan | null;
  onViewPlans: () => void;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  plan,
  onViewPlans,
}) => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const isRu = i18n.language.startsWith('ru');
  const planName = plan?.name || 'Free';
  const isFree = !plan || plan.tier === 'FREE';
  const promo = getActivePromo();

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={promo ? 'promo-card-glow' : ''}
    >
      <Card variant="bordered">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-content-tertiary text-xs uppercase tracking-wider font-medium">
              {t('profile:currentPlan')}
            </p>
            <div className="flex items-center mt-1">
              <p className="text-white text-lg font-semibold">{planName}</p>
              {!isFree && <Badge variant="cyan" className="ml-2">{t('common:active')}</Badge>}
            </div>
            {plan?.expiresAt && (
              <p className="text-content-tertiary text-xs mt-1">
                {t('common:expires', { date: new Date(plan.expiresAt).toLocaleDateString() })}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-5 h-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <Button
          variant={promo ? 'primary' : 'secondary'}
          fullWidth
          className="mt-4"
          onClick={onViewPlans}
        >
          {promo
            ? (isRu ? `🌸 Скидка ${promo.discountPercent}% — Выбрать план` : `🌸 ${promo.discountPercent}% off — View Plans`)
            : isFree ? t('profile:viewPlans') : t('profile:managePlan')}
        </Button>
      </Card>
    </motion.div>
  );
};
