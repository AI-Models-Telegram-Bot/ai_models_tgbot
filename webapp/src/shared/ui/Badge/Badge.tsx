import React from 'react';
import { cn } from '@/shared/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'gray' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles = {
  purple: 'bg-purple-primary text-white',
  gray: 'bg-dark-border text-gray-text',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
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
