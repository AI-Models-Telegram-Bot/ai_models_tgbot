import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useChatStore } from '@/features/chat/store/useChatStore';
import type { Message } from '@/services/api/chat.api';

/* ------------------------------------------------------------------ */
/*  Rich markdown renderer                                             */
/* ------------------------------------------------------------------ */

let _key = 0;
function k() { return _key++; }

/** Apply inline formatting: **bold**, *italic*, ~~strike~~, `code`, [link](url) */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Order matters: bold before italic, links before other patterns
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|~~(.+?)~~|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }

    if (m[2] && m[3]) {
      // [text](url) — link
      parts.push(
        <a key={k()} href={m[3]} target="_blank" rel="noopener noreferrer"
          className="text-brand-primary underline decoration-brand-primary/40 hover:decoration-brand-primary transition-colors">
          {m[2]}
        </a>,
      );
    } else if (m[4] || m[5]) {
      // **bold** or __bold__
      parts.push(<strong key={k()} className="font-semibold text-content-primary">{m[4] || m[5]}</strong>);
    } else if (m[6] || m[7]) {
      // *italic* or _italic_
      parts.push(<em key={k()} className="italic text-content-secondary">{m[6] || m[7]}</em>);
    } else if (m[8]) {
      // ~~strikethrough~~
      parts.push(<del key={k()} className="text-content-tertiary line-through">{m[8]}</del>);
    } else if (m[9]) {
      // `inline code`
      parts.push(
        <code key={k()} className="rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[13px] font-mono text-brand-primary">
          {m[9]}
        </code>,
      );
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : [text];
}

/** Parse a single line and return the appropriate block element */
function renderLine(line: string, idx: number): React.ReactNode {
  // Heading: # ## ### ####
  const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const content = renderInline(headingMatch[2]);
    const cls = [
      'text-lg font-bold text-content-primary mt-4 mb-1',    // h1
      'text-base font-bold text-content-primary mt-3 mb-1',  // h2
      'text-sm font-semibold text-content-primary mt-2 mb-1', // h3
      'text-sm font-medium text-content-primary mt-2 mb-0.5', // h4
    ][level - 1];
    return <div key={idx} className={cls}>{content}</div>;
  }

  // Horizontal rule: --- or *** or ___
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
    return <hr key={idx} className="my-3 border-white/10" />;
  }

  // Blockquote: > text
  const quoteMatch = line.match(/^>\s?(.*)$/);
  if (quoteMatch) {
    return (
      <div key={idx} className="my-1 border-l-2 border-brand-primary/40 pl-3 text-content-secondary italic">
        {renderInline(quoteMatch[1])}
      </div>
    );
  }

  // Unordered list: - or * or •
  const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
  if (ulMatch) {
    return (
      <div key={idx} className="flex my-0.5" style={{ paddingLeft: 4 }}>
        <span className="mr-2 text-brand-primary/60 select-none">•</span>
        <span className="flex-1">{renderInline(ulMatch[1])}</span>
      </div>
    );
  }

  // Ordered list: 1. 2. etc
  const olMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)$/);
  if (olMatch) {
    return (
      <div key={idx} className="flex my-0.5" style={{ paddingLeft: 4 }}>
        <span className="mr-2 text-content-tertiary font-mono text-xs select-none min-w-[1.2rem] text-right">{olMatch[1]}.</span>
        <span className="flex-1">{renderInline(olMatch[2])}</span>
      </div>
    );
  }

  // Empty line
  if (line.trim() === '') {
    return <div key={idx} className="h-2" />;
  }

  // Regular text
  return <div key={idx} className="my-0.5">{renderInline(line)}</div>;
}

/**
 * Full markdown renderer with support for:
 * - Code blocks (```lang ... ```)
 * - Headings (# ## ### ####)
 * - Bold (**text** / __text__)
 * - Italic (*text* / _text_)
 * - Strikethrough (~~text~~)
 * - Inline code (`code`)
 * - Links ([text](url))
 * - Unordered lists (- / * / •)
 * - Ordered lists (1. 2. 3.)
 * - Blockquotes (> text)
 * - Horizontal rules (---)
 * - Thinking sections (💭 **Thinking:** ... 📝 **Answer:**)
 */
function renderTextContent(text: string): React.ReactNode {
  _key = 0;
  const result: React.ReactNode[] = [];

  // Split code blocks from text
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
      result.push(
        <div key={k()} className="my-3 overflow-hidden rounded-xl border border-white/10">
          {seg.lang && (
            <div className="flex items-center justify-between bg-white/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-content-tertiary">
              <span>{seg.lang}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(seg.content)}
                className="text-content-tertiary hover:text-content-primary transition-colors"
                title="Copy"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
          <pre className="overflow-x-auto bg-black/20 p-4 text-[13px] leading-relaxed font-mono text-content-secondary">
            <code>{seg.content}</code>
          </pre>
        </div>,
      );
    } else {
      // Process text line by line
      const lines = seg.content.split('\n');
      result.push(...lines.map((line) => renderLine(line, k())));
    }
  }

  return <>{result}</>;
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
          <div className="break-words leading-relaxed">
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
