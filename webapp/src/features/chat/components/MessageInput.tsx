import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_ROWS = 6;
const LINE_HEIGHT = 20; // approximate line-height in px

/* ------------------------------------------------------------------ */
/*  MessageInput                                                       */
/* ------------------------------------------------------------------ */

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
}) => {
  const { t } = useTranslation('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  /** Auto-resize the textarea to fit content up to MAX_ROWS */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height so scrollHeight re-calculates
    el.style.height = 'auto';

    const maxHeight = MAX_ROWS * LINE_HEIGHT + 24; // + padding
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    autoResize();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
        // Reset textarea height after sending
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        });
      }
    }
  };

  const handleSendClick = () => {
    if (canSend) {
      onSend();
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      });
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="border-t border-white/5 p-4">
      <div className="mx-auto flex max-w-3xl items-end" style={{ columnGap: 12 }}>
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            rows={1}
            disabled={disabled}
            className={cn(
              'w-full resize-none rounded-xl border border-white/10 bg-surface-card px-4 py-3 text-sm text-content-primary placeholder-content-tertiary transition-colors',
              'focus:border-brand-primary/50 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            style={{ lineHeight: `${LINE_HEIGHT}px` }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className={cn(
            'shrink-0 rounded-xl p-3 transition-colors',
            canSend
              ? 'bg-brand-primary text-surface-bg hover:bg-brand-primary/90'
              : 'bg-surface-card text-content-tertiary',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label={t('send')}
        >
          {isSending ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
