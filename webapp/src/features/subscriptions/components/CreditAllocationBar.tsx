import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { formatCredits } from '@/shared/utils/formatters';

interface CreditAllocationBarProps {
  label: string;
  icon: string;
  used: number;
  total: number | null; // null = unlimited
  color: string;
}

export const CreditAllocationBar: React.FC<CreditAllocationBarProps> = ({
  label,
  icon,
  used,
  total,
  color,
}) => {
  const { t } = useTranslation('common');
  const isUnlimited = total === null;
  const percentage = isUnlimited ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className="flex items-center">
      <span className="text-base text-center shrink-0 mr-2.5" style={{ width: 24 }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span className="text-content-secondary text-xs">{label}</span>
          <span className="text-white text-sm font-semibold tabular-nums font-mono">
            {isUnlimited ? (
              <span className="text-brand-accent">{t('unlimited')}</span>
            ) : (
              <>{formatCredits(used)}&nbsp;/&nbsp;{formatCredits(total)}</>
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="bg-surface-elevated rounded-full overflow-hidden" style={{ height: 6 }}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', color)}
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
        )}
        {isUnlimited && (
          <div className="bg-brand-accent/20 rounded-full overflow-hidden" style={{ height: 6 }}>
            <div className="h-full w-full bg-gradient-to-r from-brand-accent/40 to-brand-accent/60 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
