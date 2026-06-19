import React from 'react';
import { cn } from '@/shared/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  glow = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl',
        {
          'bg-surface-card border border-border': variant === 'default',
          'bg-surface-elevated border border-border-strong shadow-card': variant === 'elevated',
          'bg-surface-card border border-brand-primary/40': variant === 'bordered',
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
          'shadow-card': glow,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
