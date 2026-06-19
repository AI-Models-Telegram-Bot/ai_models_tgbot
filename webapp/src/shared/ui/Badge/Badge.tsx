import React from 'react';
import { cn } from '@/shared/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'gray' | 'success' | 'warning' | 'error' | 'gold' | 'pink';
  className?: string;
}

const variantStyles = {
  cyan: 'bg-brand-primary/15 text-brand-primary',
  gray: 'bg-surface-elevated text-content-secondary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  gold: 'bg-brand-accent/15 text-brand-accent',
  pink: 'bg-brand-secondary/15 text-brand-secondary',
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
