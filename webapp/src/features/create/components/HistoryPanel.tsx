import React, { useEffect } from 'react';
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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { history, isLoadingHistory, fetchHistory } = useCreateStore();

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

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
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface-card border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-content-primary">History</h3>
              <button
                onClick={onClose}
                className="text-content-tertiary hover:text-content-primary transition-colors p-1"
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
                    <div key={i} className="h-14 rounded-lg bg-surface-elevated/50 animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoadingHistory && history.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-content-tertiary text-sm">No generations yet</p>
                </div>
              )}

              {!isLoadingHistory && history.length > 0 && (
                <div className="p-3 space-y-1">
                  {history.map((conv: Conversation) => (
                    <HistoryItem key={conv.id} conversation={conv} />
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

const HistoryItem: React.FC<{ conversation: Conversation }> = ({ conversation }) => {
  const icon = CATEGORY_ICONS[conversation.category];
  const colorClass = CATEGORY_COLORS[conversation.category] || 'text-content-tertiary bg-surface-elevated';

  return (
    <div className="flex items-center rounded-lg px-3 py-2.5 hover:bg-surface-elevated/50 transition-colors cursor-default" style={{ columnGap: 10 }}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-content-primary truncate">
          {conversation.title || conversation.modelSlug}
        </p>
        <div className="flex items-center text-[11px] text-content-tertiary" style={{ columnGap: 6 }}>
          <span>{conversation.modelSlug}</span>
          <span>·</span>
          <span>{formatRelativeDate(conversation.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
