import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Modal } from '@/shared/ui';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { useSSE } from '@/features/chat/hooks/useSSE';
import ChatWindow from '@/features/chat/components/ChatWindow';
import MessageInput from '@/features/chat/components/MessageInput';
import type { ChatModel, Conversation } from '@/services/api/chat.api';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Model Picker Modal                                                 */
/* ------------------------------------------------------------------ */

interface ModelPickerProps {
  isOpen: boolean;
  onClose: () => void;
  models: ChatModel[];
  onSelect: (model: ChatModel) => void;
}

function ModelPickerModal({ isOpen, onClose, models, onSelect }: ModelPickerProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('selectModelForChat')} size="md">
      <div className="p-4" style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
        {models.length === 0 && (
          <p className="py-8 text-center text-sm text-content-tertiary">{t('noModels')}</p>
        )}
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              if (model.hasAccess) {
                onSelect(model);
              } else {
                onClose();
                navigate('/subscriptions');
              }
            }}
            className={cn(
              'flex items-center rounded-xl border px-4 py-3 text-left transition-colors',
              model.hasAccess
                ? 'border-white/10 bg-surface-card hover:bg-white/5 active:bg-white/10'
                : 'border-white/5 bg-surface-card/50 opacity-60',
            )}
          >
            {/* Model icon dot */}
            <span className="mr-3 inline-block h-3 w-3 shrink-0 rounded-full bg-brand-primary/30" style={{ minWidth: 12, minHeight: 12 }} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">{model.name}</p>
              <p className="text-xs text-content-tertiary mt-0.5">
                {model.isUnlimited ? '∞' : model.tokenCost} {t('credits')}
              </p>
            </div>

            {model.hasAccess ? (
              <svg className="ml-2 h-4 w-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="ml-2 shrink-0 rounded-md bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                {t('noAccessUpgrade')}
              </span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversation List Item                                             */
/* ------------------------------------------------------------------ */

interface ConvItemProps {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ConversationListItem({ conv, isActive, onSelect, onDelete }: ConvItemProps) {
  const { t } = useTranslation('chat');
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center rounded-xl px-4 py-3 text-left transition-colors',
        isActive
          ? 'bg-brand-primary/10'
          : 'hover:bg-white/5 active:bg-white/10',
      )}
    >
      {/* Chat icon */}
      <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
        <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-content-primary truncate">
          {conv.title || t('untitledChat')}
        </p>
        <p className="text-xs text-content-tertiary mt-0.5 truncate">
          {conv.modelSlug}
        </p>
      </div>

      <div className="ml-2 flex shrink-0 items-center" style={{ columnGap: 8 }}>
        <span className="text-[11px] text-content-tertiary">
          {relativeTime(conv.updatedAt)}
        </span>

        {/* Delete button — always visible via small icon */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.stopPropagation(); onDelete(); }
          }}
          className="rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                          */
/* ------------------------------------------------------------------ */

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmProps) {
  const { t } = useTranslation('chat');
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-content-primary mb-2">{t('deleteConfirmTitle')}</h3>
        <p className="text-sm text-content-secondary mb-6">{t('deleteConfirmDesc')}</p>
        <div className="flex" style={{ columnGap: 12 }}>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-white/5"
          >
            {t('cancelDelete')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            {t('confirmDelete')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  TelegramChatPage                                                   */
/* ------------------------------------------------------------------ */

export default function TelegramChatPage() {
  const { t } = useTranslation('chat');
  const { conversationId } = useParams<{ conversationId?: string }>();

  const [screen, setScreen] = useState<'list' | 'chat'>('list');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const {
    conversations,
    activeConversation,
    availableModels,
    isLoadingConversations,
    isSending,
    fetchModels,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    clearActive,
  } = useChatStore();

  // SSE for active conversation
  useSSE(activeConversation?.id ?? null);

  // Filter to TEXT only
  const textConversations = useMemo(
    () =>
      [...conversations]
        .filter((c) => c.category === 'TEXT')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [conversations],
  );

  const textModels = useMemo(
    () => (availableModels || []).filter((m) => m.category === 'TEXT' && m.isActive),
    [availableModels],
  );

  // Init: fetch models + conversations
  useEffect(() => {
    fetchModels();
    fetchConversations();
  }, [fetchModels, fetchConversations]);

  // Deep link: /chat/:conversationId
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
      setScreen('chat');
    }
  }, [conversationId, selectConversation]);

  // Telegram BackButton integration
  useEffect(() => {
    const webapp = (window as any).Telegram?.WebApp;
    if (!webapp?.BackButton) return;

    if (screen === 'chat') {
      webapp.BackButton.show();
      const handler = () => {
        clearActive();
        setScreen('list');
        fetchConversations();
      };
      webapp.BackButton.onClick(handler);
      return () => {
        webapp.BackButton.offClick(handler);
        webapp.BackButton.hide();
      };
    } else {
      webapp.BackButton.hide();
    }
  }, [screen, clearActive, fetchConversations]);

  // Disable vertical swipes on mount
  useEffect(() => {
    try {
      const webapp = (window as any).Telegram?.WebApp;
      webapp?.disableVerticalSwipes?.();
    } catch { /* ignore */ }
    return () => {
      try {
        const webapp = (window as any).Telegram?.WebApp;
        webapp?.enableVerticalSwipes?.();
      } catch { /* ignore */ }
    };
  }, []);

  /* ---- handlers ---- */

  const handleNewChat = useCallback(
    async (model: ChatModel) => {
      try {
        await createConversation(model.slug);
        setShowModelPicker(false);
        setScreen('chat');
      } catch (err) {
        console.error('Failed to create conversation', err);
      }
    },
    [createConversation],
  );

  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      await selectConversation(conv.id);
      setScreen('chat');
    },
    [selectConversation],
  );

  const handleBack = useCallback(() => {
    clearActive();
    setScreen('list');
    fetchConversations();
  }, [clearActive, fetchConversations]);

  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || !activeConversation) return;
    setMessage('');
    await sendMessage(text);
  }, [message, activeConversation, sendMessage]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteConversation(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteConversation]);

  /* ---- render ---- */

  return (
    <div className="flex flex-col bg-surface-bg" style={{ height: 'calc(100dvh - 5rem)' }}>
      <AnimatePresence mode="wait">
        {screen === 'list' ? (
          /* ============================================================
             Screen: Conversation List
             ============================================================ */
          <motion.div
            key="list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
              <h1 className="text-lg font-bold text-content-primary font-display">
                {t('chats')}
              </h1>
              <button
                onClick={() => setShowModelPicker(true)}
                className="flex items-center rounded-xl bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/20 active:bg-brand-primary/30"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('newChat')}
              </button>
            </header>

            {/* Conversation list */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain p-3"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Loading */}
              {isLoadingConversations && (
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-card" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoadingConversations && textConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center px-4 pt-20">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-primary/10">
                    <svg className="h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-lg font-bold text-content-primary font-display">
                    {t('startFirstChat')}
                  </h2>
                  <p className="max-w-xs text-center text-sm text-content-secondary">
                    {t('startFirstChatDesc')}
                  </p>
                </div>
              )}

              {/* Conversations */}
              {!isLoadingConversations && textConversations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
                  {textConversations.map((conv) => (
                    <ConversationListItem
                      key={conv.id}
                      conv={conv}
                      isActive={activeConversation?.id === conv.id}
                      onSelect={() => handleSelectConversation(conv)}
                      onDelete={() => setDeleteTarget(conv.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ============================================================
             Screen: Active Chat
             ============================================================ */
          <motion.div
            key="chat"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center border-b border-white/5 px-3 py-3" style={{ columnGap: 10 }}>
              <button
                onClick={handleBack}
                className="rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-white/5 hover:text-content-primary active:bg-white/10"
                aria-label={t('backToChats')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {activeConversation && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-semibold text-content-primary truncate">
                    {activeConversation.title || t('untitledChat')}
                  </h1>
                  <p className="text-xs text-content-tertiary truncate">
                    {activeConversation.modelSlug}
                  </p>
                </div>
              )}
            </header>

            {/* Messages */}
            <ChatWindow />

            {/* Input */}
            {activeConversation && (
              <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                isSending={isSending}
                disabled={isSending}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Picker Modal */}
      <ModelPickerModal
        isOpen={showModelPicker}
        onClose={() => setShowModelPicker(false)}
        models={textModels}
        onSelect={handleNewChat}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
