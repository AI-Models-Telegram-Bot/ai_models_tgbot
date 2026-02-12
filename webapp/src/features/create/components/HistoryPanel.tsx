import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { useCreateStore } from '../store/useCreateStore';
import type { Conversation } from '@/services/api/chat.api';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  TEXT: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  IMAGE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  VIDEO: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  AUDIO: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
  ),
};

const CATEGORY_COLORS: Record<string, string> = {
  TEXT: 'text-cyan-400 bg-cyan-500/10',
  IMAGE: 'text-purple-400 bg-purple-500/10',
  VIDEO: 'text-orange-400 bg-orange-500/10',
  AUDIO: 'text-emerald-400 bg-emerald-500/10',
};

function useFormatRelativeDate() {
  const { t } = useTranslation('create');

  return (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['create', 'common']);
  const { history, isLoadingHistory, fetchHistory, loadHistoryItem } = useCreateStore();
  const formatRelativeDate = useFormatRelativeDate();

  const handleItemClick = async (conversationId: string) => {
    await loadHistoryItem(conversationId);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const historyItems = Array.isArray(history) ? history : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface-card border-l border-white/[0.08] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">{t('common:history')}</h3>
              <button
                onClick={onClose}
                className="text-content-secondary hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingHistory && (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center rounded-lg px-3 py-2.5" style={{ columnGap: 10 }}>
                      <div className="w-8 h-8 rounded-lg bg-surface-elevated/50 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-3/4 rounded bg-surface-elevated/50 relative overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                        </div>
                        <div className="h-2.5 w-1/2 rounded bg-surface-elevated/30 relative overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingHistory && historyItems.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-content-secondary text-sm">{t('create:noGenerationsYet')}</p>
                </div>
              )}

              {!isLoadingHistory && historyItems.length > 0 && (
                <div className="p-3 space-y-1">
                  {historyItems.map((conv: Conversation) => (
                    <HistoryItem key={conv.id} conversation={conv} formatDate={formatRelativeDate} onClick={() => handleItemClick(conv.id)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const HistoryItem: React.FC<{ conversation: Conversation; formatDate: (d: string) => string; onClick: () => void }> = ({ conversation, formatDate, onClick }) => {
  const icon = CATEGORY_ICONS[conversation.category];
  const colorClass = CATEGORY_COLORS[conversation.category] || 'text-content-secondary bg-surface-elevated';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center rounded-lg px-3 py-2.5 hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
      style={{ columnGap: 10 }}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          {conversation.title || conversation.modelSlug}
        </p>
        <div className="flex items-center text-[11px] text-content-secondary" style={{ columnGap: 6 }}>
          <span>{conversation.modelSlug}</span>
          <span>·</span>
          <span>{formatDate(conversation.createdAt)}</span>
        </div>
      </div>
    </button>
  );
};
