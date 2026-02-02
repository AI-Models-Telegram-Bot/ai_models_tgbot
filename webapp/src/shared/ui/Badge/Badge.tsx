import React from 'react';
import { cn } from '@/shared/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'gray' | 'success' | 'warning' | 'error' | 'gold' | 'pink';
  className?: string;
}

const variantStyles = {
  cyan: 'bg-brand-primary/20 text-brand-primary',
  gray: 'bg-surface-elevated text-content-tertiary',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  gold: 'bg-brand-accent/20 text-brand-accent',
  pink: 'bg-brand-secondary/20 text-brand-secondary',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
