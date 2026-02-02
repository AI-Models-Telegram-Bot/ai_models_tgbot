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
        'rounded-2xl bg-surface-card/90 backdrop-blur-xl transition-all duration-300',
        {
          'border border-white/15 shadow-card hover:shadow-card-hover hover:translate-y-[-2px]': variant === 'default',
          'border border-white/20 shadow-card-hover': variant === 'elevated',
          'border border-brand-primary/30': variant === 'bordered',
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
          'shadow-neon': glow,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
