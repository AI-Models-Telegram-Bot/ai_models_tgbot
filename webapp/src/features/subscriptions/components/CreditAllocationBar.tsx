import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { formatCredits } from '@/shared/utils/formatters';

interface CreditAllocationBarProps {
  label: string;
  icon?: string;
  used: number;
  total: number | null; // null = unlimited
  color: string;
}

export const CreditAllocationBar: React.FC<CreditAllocationBarProps> = ({
  label,
  used,
  total,
  color,
}) => {
  const { t } = useTranslation('common');
  const isUnlimited = total === null;
  const percentage = isUnlimited ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-content-secondary text-sm">{label}</span>
        <span className="text-content-primary text-sm font-semibold tabular-nums font-mono">
          {isUnlimited ? (
            <span className="text-brand-accent">{t('unlimited')}</span>
          ) : (
            <>{formatCredits(used)}&nbsp;/&nbsp;{formatCredits(total)}</>
          )}
        </span>
      </div>
      <div className="bg-surface-elevated rounded-full overflow-hidden" style={{ height: 6 }}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', isUnlimited ? 'bg-brand-accent w-full' : color)}
          style={isUnlimited ? undefined : { width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
};
