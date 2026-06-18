import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '@/shared/ui';
import type { CurrentPlan } from '@/types/user.types';

interface CurrentPlanCardProps {
  plan: CurrentPlan | null;
  onViewPlans: () => void;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  plan,
  onViewPlans,
}) => {
  const { t } = useTranslation(['profile', 'common']);
  const planName = plan?.name || 'Free';
  const isFree = !plan || plan.tier === 'FREE';

  return (
    <Card variant="bordered">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-content-tertiary text-xs uppercase tracking-wider font-medium">
            {t('profile:currentPlan')}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-content-primary text-xl font-semibold tracking-tight">{planName}</p>
            {!isFree && <Badge variant="cyan">{t('common:active')}</Badge>}
          </div>
          {plan?.expiresAt && (
            <p className="text-content-tertiary text-xs mt-1.5">
              {t('common:expires', { date: new Date(plan.expiresAt).toLocaleDateString() })}
            </p>
          )}
        </div>
      </div>

      <Button
        variant={isFree ? 'primary' : 'secondary'}
        fullWidth
        size="sm"
        className="mt-4"
        onClick={onViewPlans}
      >
        {isFree ? t('profile:viewPlans') : t('profile:managePlan')}
      </Button>
    </Card>
  );
};
