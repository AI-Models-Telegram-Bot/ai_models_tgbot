import React from 'react';
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
  const isUnlimited = total === null;
  const percentage = isUnlimited ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base w-6 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-content-secondary text-xs">{label}</span>
          <span className="text-white text-sm font-semibold tabular-nums font-mono">
            {isUnlimited ? (
              <span className="text-brand-accent">Unlimited</span>
            ) : (
              <>{formatCredits(used)} / {formatCredits(total)}</>
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', color)}
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
        )}
        {isUnlimited && (
          <div className="h-1.5 bg-brand-accent/20 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-brand-accent/40 to-brand-accent/60 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
