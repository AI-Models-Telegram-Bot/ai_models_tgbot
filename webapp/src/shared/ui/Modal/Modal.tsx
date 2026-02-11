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
    <div className="shrink-0 bg-surface-card/95 border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <h2 className="text-xl font-bold text-content-primary">{title}</h2>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1040]"
            onClick={onClose}
          />

          {/* Mobile: bottom sheet (hidden on md+) */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed z-[1050] bg-surface-card/95 backdrop-blur-xl shadow-xl flex flex-col',
              // Mobile: bottom sheet
              'border-t border-white/20 rounded-t-3xl',
              // Desktop: centered dialog
              'md:border md:border-white/10 md:rounded-2xl md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto',
              {
                'inset-x-4 bottom-0 max-h-[80vh] md:inset-x-auto md:w-full md:max-w-sm': size === 'sm',
                'inset-x-0 bottom-0 max-h-[85vh] md:inset-x-auto md:w-full md:max-w-lg': size === 'md',
                'inset-x-0 bottom-0 max-h-[90vh] md:inset-x-auto md:w-full md:max-w-2xl': size === 'lg',
                'inset-0 md:inset-auto md:w-full md:max-w-4xl md:max-h-[90vh]': size === 'full',
              }
            )}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Drag handle indicator — mobile only */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {titleBar}
            {scrollBody}
          </motion.div>

          {/* Desktop: centered dialog (hidden below md) */}
          <div className="fixed inset-0 z-[1050] hidden md:flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'bg-surface-card/95 backdrop-blur-xl shadow-2xl flex flex-col pointer-events-auto',
                'border border-white/10 rounded-2xl w-full',
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
