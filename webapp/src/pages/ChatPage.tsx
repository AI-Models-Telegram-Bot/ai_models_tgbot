import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { useSSE } from '@/features/chat/hooks/useSSE';
import ChatSidebar from '@/features/chat/components/ChatSidebar';
import ChatWindow from '@/features/chat/components/ChatWindow';
import MessageInput from '@/features/chat/components/MessageInput';

/**
 * Full chat page: sidebar + main chat area.
 * Mobile-responsive — sidebar is an overlay on small screens.
 */
export default function ChatPage() {
  const { t } = useTranslation('chat');

  const {
    activeConversation,
    isSending,
    fetchModels,
    fetchConversations,
    createConversation,
    sendMessage,
  } = useChatStore();

  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Connect SSE for the active conversation
  useSSE(activeConversation?.id ?? null);

  // Fetch models + conversations on mount
  useEffect(() => {
    fetchModels();
    fetchConversations();
  }, [fetchModels, fetchConversations]);

  /* ---- handlers ---- */

  const handleNewChat = useCallback(
    async (modelSlug: string) => {
      try {
        await createConversation(modelSlug);
        setSidebarOpen(false);
      } catch (err) {
        console.error('Failed to create conversation', err);
      }
    },
    [createConversation],
  );

  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || !activeConversation) return;
    setMessage('');
    await sendMessage(text);
  }, [message, activeConversation, sendMessage]);

  /* ---- render ---- */

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ============================================================
          Desktop sidebar (always visible on md+)
          ============================================================ */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/5 bg-surface-card md:flex">
        <ChatSidebar onNewChat={handleNewChat} />
      </aside>

      {/* ============================================================
          Mobile sidebar overlay
          ============================================================ */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Slide-over panel */}
          <aside className="fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] flex-col bg-surface-card shadow-xl md:hidden">
            <ChatSidebar
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* ============================================================
          Main chat area
          ============================================================ */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex shrink-0 items-center border-b border-white/5 px-4 py-3" style={{ columnGap: 12 }}>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-white/5 hover:text-content-primary md:hidden"
            aria-label={t('openSidebar')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Conversation title / model info */}
          {activeConversation ? (
            <div className="flex min-w-0 flex-1 items-center" style={{ columnGap: 8 }}>
              <CategoryBadge category={activeConversation.category} />
              <h1 className="truncate text-sm font-semibold text-content-primary">
                {activeConversation.title || t('untitledChat')}
              </h1>
              <span className="shrink-0 text-xs text-content-tertiary">
                {activeConversation.modelSlug}
              </span>
            </div>
          ) : (
            <h1 className="flex-1 text-sm font-semibold text-content-primary">
              {t('title')}
            </h1>
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
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helper: category badge                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_LABEL_COLORS: Record<string, string> = {
  TEXT: 'bg-brand-primary/15 text-brand-primary',
  IMAGE: 'bg-purple-500/15 text-purple-400',
  VIDEO: 'bg-orange-500/15 text-orange-400',
  AUDIO: 'bg-emerald-500/15 text-emerald-400',
};

function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation('chat');
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        CATEGORY_LABEL_COLORS[category] ?? 'bg-surface-elevated text-content-tertiary',
      )}
    >
      {t(`categories.${category}`, category)}
    </span>
  );
}
