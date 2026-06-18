import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const SIZE_DESKTOP: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';

      try {
        const webapp = window.Telegram?.WebApp as any;
        webapp?.disableVerticalSwipes?.();
      } catch {
        // Method may not be available in older versions
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';

      try {
        const webapp = window.Telegram?.WebApp as any;
        webapp?.enableVerticalSwipes?.();
      } catch {
        // Method may not be available in older versions
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
      try {
        const webapp = window.Telegram?.WebApp as any;
        webapp?.enableVerticalSwipes?.();
      } catch {
        // Ignore
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent touch events from propagating to Telegram WebApp
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !isOpen) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = content;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      const isAtTop = scrollable.scrollTop <= 0;
      const isAtBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
      const isScrollingDown = deltaY > 0;
      const isScrollingUp = deltaY < 0;

      if ((isAtTop && isScrollingDown) || (isAtBottom && isScrollingUp)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    content.addEventListener('touchstart', handleTouchStart, { passive: true });
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  const titleBar = title && (
    <div className="shrink-0 bg-surface-card border-b border-border px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
      <button
        onClick={onClose}
        className="text-content-tertiary hover:text-content-primary transition-colors p-1"
        aria-label="Close modal"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const scrollBody = (
    <div
      ref={contentRef}
      className="flex-1 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[oklch(0.1_0.005_75_/_0.7)] z-[1040]"
            onClick={onClose}
          />

          {/* Mobile: bottom sheet (hidden on md+) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed z-[1050] bg-surface-card shadow-elevated flex flex-col',
              // Mobile: bottom sheet (hidden on desktop where dedicated panel renders)
              'border-t border-border-strong rounded-t-3xl md:hidden',
              {
                'inset-x-4 bottom-0 max-h-[80vh]': size === 'sm',
                'inset-x-0 bottom-0 max-h-[85vh]': size === 'md',
                'inset-x-0 bottom-0 max-h-[90vh]': size === 'lg',
                'inset-0': size === 'full',
              }
            )}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Drag handle indicator — mobile only */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-10 h-1 rounded-full bg-border-strong" />
            </div>
            {titleBar}
            {scrollBody}
          </motion.div>

          {/* Desktop: centered dialog (hidden below md) */}
          <div className="fixed inset-0 z-[1050] hidden md:flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'bg-surface-card shadow-elevated flex flex-col pointer-events-auto',
                'border border-border rounded-2xl w-full',
                size === 'full' ? 'max-h-[90vh]' : 'max-h-[85vh]',
                SIZE_DESKTOP[size],
              )}
              style={{ overscrollBehavior: 'contain' }}
            >
              {titleBar}
              {scrollBody}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
