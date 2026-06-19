import React from 'react';
import { cn } from '@/shared/utils/cn';

type AccessLevel = 'locked' | 'limited' | 'unlimited';

interface ModelAccessBadgeProps {
  level: AccessLevel;
  credits?: number;
  className?: string;
}

export const ModelAccessBadge: React.FC<ModelAccessBadgeProps> = ({
  level,
  credits,
  className,
}) => {
  const styles: Record<AccessLevel, string> = {
    locked: 'bg-error/15 text-error',
    limited: 'bg-brand-primary/15 text-brand-primary',
    unlimited: 'bg-brand-accent/15 text-brand-accent',
  };

  const labels: Record<AccessLevel, string> = {
    locked: 'Locked',
    limited: credits !== undefined ? `${credits} tokens` : 'Limited',
    unlimited: 'Unlimited',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
        styles[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
};
