import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useChatStore } from '@/features/chat/store/useChatStore';
import type { Message } from '@/services/api/chat.api';

/* ------------------------------------------------------------------ */
/*  Simple markdown-like text renderer                                 */
/* ------------------------------------------------------------------ */

function renderTextContent(text: string): React.ReactNode {
  // Split into lines, process basic markdown:
  // **bold**, *italic*, `code`, ```code blocks```
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Handle code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const segments: { type: 'text' | 'codeblock'; content: string; lang?: string }[] = [];

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'codeblock', content: match[2], lang: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  for (const seg of segments) {
    if (seg.type === 'codeblock') {
      parts.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded-lg bg-surface-bg/80 p-3 text-xs text-content-secondary"
        >
          <code>{seg.content}</code>
        </pre>,
      );
    } else {
      // Inline formatting
      const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
      let inlineLast = 0;
      let inlineMatch: RegExpExecArray | null;
      const inlineParts: React.ReactNode[] = [];

      while ((inlineMatch = inlineRegex.exec(seg.content)) !== null) {
        if (inlineMatch.index > inlineLast) {
          inlineParts.push(seg.content.slice(inlineLast, inlineMatch.index));
        }

        if (inlineMatch[2]) {
          // **bold**
          inlineParts.push(
            <strong key={key++} className="font-semibold">
              {inlineMatch[2]}
            </strong>,
          );
        } else if (inlineMatch[3]) {
          // *italic*
          inlineParts.push(
            <em key={key++}>{inlineMatch[3]}</em>,
          );
        } else if (inlineMatch[4]) {
          // `code`
          inlineParts.push(
            <code
              key={key++}
              className="rounded bg-surface-bg/60 px-1 py-0.5 text-xs text-brand-primary"
            >
              {inlineMatch[4]}
            </code>,
          );
        }

        inlineLast = inlineMatch.index + inlineMatch[0].length;
      }
      if (inlineLast < seg.content.length) {
        inlineParts.push(seg.content.slice(inlineLast));
      }

      parts.push(<span key={key++}>{inlineParts}</span>);
    }
  }

  return <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/*  Single message bubble                                              */
/* ------------------------------------------------------------------ */

interface MessageBubbleProps {
  message: Message;
  category: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, category }) => {
  const { t } = useTranslation('chat');
  const isUser = message.role === 'USER';
  const isPending = message.status === 'PENDING' && !message.content && !message.fileUrl;
  const isFailed = message.status === 'FAILED';

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
      style={{ marginBottom: 12 }}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%]',
          isUser
            ? 'bg-brand-primary/20 text-content-primary'
            : 'bg-surface-card text-content-primary',
          isFailed && 'border border-red-500/30',
        )}
      >
        {/* Role label */}
        <p
          className={cn(
            'mb-1 text-[10px] font-semibold uppercase tracking-wider',
            isUser ? 'text-brand-primary' : 'text-content-tertiary',
          )}
        >
          {isUser ? t('you') : t('assistant')}
        </p>

        {/* Pending indicator */}
        {isPending && (
          <div className="flex items-center" style={{ columnGap: 6 }}>
            <div className="flex" style={{ columnGap: 4 }}>
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-brand-primary/60" style={{ animationDelay: '0ms' }} />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-brand-primary/60" style={{ animationDelay: '150ms' }} />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-brand-primary/60" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-content-tertiary">{t('generating')}</span>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {renderTextContent(message.content)}
          </div>
        )}

        {/* Image content */}
        {message.fileUrl && category === 'IMAGE' && (
          <div className="mt-2">
            <img
              src={message.fileUrl}
              alt="Generated image"
              className="max-w-full rounded-xl"
              loading="lazy"
            />
          </div>
        )}

        {/* Video content */}
        {message.fileUrl && category === 'VIDEO' && (
          <div className="mt-2">
            <video
              src={message.fileUrl}
              controls
              className="max-w-full rounded-xl"
              preload="metadata"
            />
          </div>
        )}

        {/* Audio content */}
        {message.fileUrl && category === 'AUDIO' && (
          <div className="mt-2">
            <audio src={message.fileUrl} controls className="w-full" preload="metadata" />
          </div>
        )}

        {/* Error state */}
        {isFailed && (
          <div className="mt-2 flex items-center text-xs text-red-400" style={{ columnGap: 4 }}>
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{message.error || t('failed')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ChatWindow                                                         */
/* ------------------------------------------------------------------ */

const ChatWindow: React.FC = () => {
  const { t } = useTranslation('chat');
  const { messages, activeConversation, isLoadingMessages } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Loading state
  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center" style={{ rowGap: 12 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
          <p className="text-sm text-content-tertiary">{t('loadingMessages')}</p>
        </div>
      </div>
    );
  }

  // Empty state — no active conversation
  if (!activeConversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
            <svg className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="mb-2 font-display text-xl font-bold text-content-primary">
            {t('emptyChat')}
          </h2>
          <p className="text-sm text-content-secondary">{t('emptyChatDesc')}</p>
        </div>
      </div>
    );
  }

  // Active conversation — no messages yet
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
            <svg className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="mb-2 font-display text-lg font-bold text-content-primary">
            {activeConversation.title || t('untitledChat')}
          </h2>
          <p className="text-sm text-content-secondary">{t('typeMessage')}</p>
        </div>
      </div>
    );
  }

  // Messages list
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            category={activeConversation.category}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
