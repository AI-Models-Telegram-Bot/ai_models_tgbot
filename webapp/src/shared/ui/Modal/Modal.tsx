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
      // Prevent Telegram WebApp from closing when scrolling inside modal
      document.body.style.overscrollBehavior = 'contain';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
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

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = content;

      // Check if we're at scroll boundaries
      const isAtTop = scrollable.scrollTop <= 0;
      const isAtBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight;

      // If at boundaries and trying to scroll past, prevent default
      // but only stop propagation, don't prevent the touch entirely
      if ((isAtTop || isAtBottom) && scrollable.scrollHeight > scrollable.clientHeight) {
        e.stopPropagation();
      }
    };

    content.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => content.removeEventListener('touchmove', handleTouchMove);
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1040]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed z-[1050] bg-surface-card/95 backdrop-blur-xl border-t border-white/20 rounded-t-3xl shadow-xl flex flex-col',
              {
                'inset-x-4 bottom-0 max-h-[80vh]': size === 'sm',
                'inset-x-0 bottom-0 max-h-[85vh]': size === 'md',
                'inset-x-0 bottom-0 max-h-[90vh]': size === 'lg',
                'inset-0': size === 'full',
              }
            )}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Drag handle indicator */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {title && (
              <div className="shrink-0 bg-surface-card/95 border-b border-white/10 px-6 py-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-content-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-content-tertiary hover:text-content-primary transition-colors p-1"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
