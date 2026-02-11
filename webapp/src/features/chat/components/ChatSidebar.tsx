import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useChatStore } from '@/features/chat/store/useChatStore';
import type { ChatModel, Conversation } from '@/services/api/chat.api';

/* ------------------------------------------------------------------ */
/*  Category → colour mapping                                         */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  TEXT: 'text-brand-primary',
  IMAGE: 'text-purple-400',
  VIDEO: 'text-orange-400',
  AUDIO: 'text-emerald-400',
};

const CATEGORY_BG: Record<string, string> = {
  TEXT: 'bg-brand-primary/10',
  IMAGE: 'bg-purple-400/10',
  VIDEO: 'bg-orange-400/10',
  AUDIO: 'bg-emerald-400/10',
};

/* ------------------------------------------------------------------ */
/*  Helper: group conversations by date bucket                        */
/* ------------------------------------------------------------------ */

function dateBucket(dateStr: string): 'today' | 'yesterday' | 'previous' {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (diff < 0 || diff === 0) return 'today';
  if (diff <= 86400000) return 'yesterday';
  return 'previous';
}

/* ------------------------------------------------------------------ */
/*  Model Selector                                                     */
/* ------------------------------------------------------------------ */

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: ChatModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation('chat');
  const { availableModels } = useChatStore();
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const filtered = availableModels.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.slug.toLowerCase().includes(search.toLowerCase()),
    );

    const groups: Record<string, ChatModel[]> = {};
    for (const m of filtered) {
      const cat = m.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    }
    return groups;
  }, [availableModels, search]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown panel */}
      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-surface-elevated shadow-xl">
        {/* Search */}
        <div className="sticky top-0 z-10 bg-surface-elevated p-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchModels')}
            className="w-full rounded-lg border border-white/10 bg-surface-card px-3 py-2 text-sm text-content-primary placeholder-content-tertiary focus:border-brand-primary/50 focus:outline-none"
            autoFocus
          />
        </div>

        {Object.keys(grouped).length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-content-tertiary">
            {t('noModels')}
          </p>
        )}

        {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as const).map((cat) => {
          const models = grouped[cat];
          if (!models?.length) return null;
          return (
            <div key={cat} className="px-2 pb-2">
              <p
                className={cn(
                  'px-2 py-1 text-xs font-semibold uppercase tracking-wider',
                  CATEGORY_COLORS[cat],
                )}
              >
                {t(`categories.${cat}`)}
              </p>
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect(m);
                    onClose();
                    setSearch('');
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-content-primary transition-colors hover:bg-white/5"
                >
                  <span
                    className={cn(
                      'mr-2 inline-block h-2 w-2 rounded-full',
                      CATEGORY_BG[cat],
                      CATEGORY_COLORS[cat],
                    )}
                    style={{ minWidth: 8, minHeight: 8 }}
                  />
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Conversation Item                                                  */
/* ------------------------------------------------------------------ */

interface ConvItemProps {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationItem: React.FC<ConvItemProps> = ({ conv, isActive, onSelect, onDelete }) => {
  const { t } = useTranslation('chat');
  const [showDelete, setShowDelete] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={cn(
        'group flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        isActive
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-content-secondary hover:bg-white/5 hover:text-content-primary',
      )}
    >
      {/* Category dot */}
      <span
        className={cn(
          'mr-2 inline-block h-2 w-2 shrink-0 rounded-full',
          CATEGORY_COLORS[conv.category] ?? 'text-content-tertiary',
          CATEGORY_BG[conv.category] ?? 'bg-content-tertiary/10',
        )}
        style={{ minWidth: 8, minHeight: 8 }}
      />

      <span className="flex-1 truncate">{conv.title || t('untitledChat')}</span>

      {showDelete && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onDelete();
            }
          }}
          className="ml-1 shrink-0 rounded p-1 text-content-tertiary transition-colors hover:bg-red-500/20 hover:text-red-400"
          title={t('deleteConversation')}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </span>
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  ChatSidebar                                                        */
/* ------------------------------------------------------------------ */

interface ChatSidebarProps {
  onNewChat: (modelSlug: string) => void;
  onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onNewChat, onClose }) => {
  const { t } = useTranslation('chat');
  const {
    conversations,
    activeConversation,
    isLoadingConversations,
    selectConversation,
    deleteConversation,
  } = useChatStore();

  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [conversations],
  );

  const bucketedConversations = useMemo(() => {
    const buckets: Record<string, Conversation[]> = {
      today: [],
      yesterday: [],
      previous: [],
    };
    for (const c of sortedConversations) {
      const b = dateBucket(c.updatedAt);
      buckets[b].push(c);
    }
    return buckets;
  }, [sortedConversations]);

  const handleSelect = (conv: Conversation) => {
    selectConversation(conv.id);
    onClose?.();
  };

  const handleDelete = (conv: Conversation) => {
    deleteConversation(conv.id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center border-b border-white/5 p-4" style={{ columnGap: 8 }}>
        <h2 className="flex-1 text-sm font-semibold text-content-primary">{t('sidebar')}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-white/5 hover:text-content-primary"
            aria-label={t('closeSidebar')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New chat button + model selector */}
      <div className="relative shrink-0 border-b border-white/5 p-3">
        <button
          onClick={() => setModelSelectorOpen((v) => !v)}
          className="flex w-full items-center justify-center rounded-lg bg-brand-primary/10 px-4 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/20"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('newChat')}
        </button>

        <ModelSelector
          isOpen={modelSelectorOpen}
          onClose={() => setModelSelectorOpen(false)}
          onSelect={(model) => {
            onNewChat(model.slug);
            setModelSelectorOpen(false);
          }}
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingConversations && (
          <div className="flex flex-col p-2" style={{ rowGap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
            ))}
          </div>
        )}

        {!isLoadingConversations && sortedConversations.length === 0 && (
          <p className="mt-8 text-center text-xs text-content-tertiary">
            {t('noConversations')}
          </p>
        )}

        {!isLoadingConversations &&
          (['today', 'yesterday', 'previous'] as const).map((bucket) => {
            const items = bucketedConversations[bucket];
            if (!items.length) return null;
            return (
              <div key={bucket} className="mb-2">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary">
                  {t(bucket)}
                </p>
                <div className="flex flex-col" style={{ rowGap: 2 }}>
                  {items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={activeConversation?.id === conv.id}
                      onSelect={() => handleSelect(conv)}
                      onDelete={() => handleDelete(conv)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ChatSidebar;
