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
    locked: 'bg-red-500/15 text-red-400 border-red-500/20',
    limited: 'bg-brand-primary/15 text-brand-primary border-brand-primary/20',
    unlimited: 'bg-brand-accent/15 text-brand-accent border-brand-accent/20',
  };

  const labels: Record<AccessLevel, string> = {
    locked: 'Locked',
    limited: credits !== undefined ? `${credits} credits` : 'Limited',
    unlimited: 'Unlimited',
  };

  const icons: Record<AccessLevel, string> = {
    locked: '🔒',
    limited: '📊',
    unlimited: '⚡',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
        styles[level],
        className
      )}
    >
      <span>{icons[level]}</span>
      {labels[level]}
    </span>
  );
};
