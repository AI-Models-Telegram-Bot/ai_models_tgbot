import React from 'react';
import { cn } from '@/shared/utils/cn';
import { GenerativeArt } from '../GenerativeArt/GenerativeArt';

/**
 * Signature brand motif: a generative-art core inside a slowly rotating ring.
 * Lightweight identity element for headers / loading / empty states.
 */
interface GenerativeMarkProps {
  size?: number;
  className?: string;
}

export const GenerativeMark: React.FC<GenerativeMarkProps> = ({ size = 56, className }) => {
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {/* rotating accent ring */}
      <div
        aria-hidden
        className="mark-spin absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent, oklch(0.83 0.125 78 / 0.9), transparent 55%)',
          animation: 'mark-spin 8s linear infinite',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
        }}
      />
      {/* generative core */}
      <GenerativeArt variant="aurora" drift={14} className="absolute inset-[3px] rounded-full" />
      {/* spark glyph */}
      <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto w-1/2 h-1/2 text-content-primary" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" opacity="0.55" />
        <path d="M12 8.5 13.2 11l2.8.6-2 2 .5 2.8L12 15.1 9.5 16.4l.5-2.8-2-2 2.8-.6z" />
      </svg>
    </div>
  );
};
