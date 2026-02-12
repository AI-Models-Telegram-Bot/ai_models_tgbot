import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { ring: string; text: string; bg: string }> = {
  TEXT: { ring: 'focus-within:ring-cyan-400/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  IMAGE: { ring: 'focus-within:ring-purple-400/30', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  VIDEO: { ring: 'focus-within:ring-orange-400/30', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  AUDIO: { ring: 'focus-within:ring-emerald-400/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

interface PromptPanelProps {
  category: Category;
  model: ChatModel;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
  onBack: () => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  category,
  model,
  isGenerating,
  onGenerate,
  onBack,
}) => {
  const { t } = useTranslation(['create', 'common']);
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colors = CATEGORY_COLORS[category];

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [prompt]);

  const handleSubmit = () => {
    const text = prompt.trim();
    if (!text || isGenerating) return;
    onGenerate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <button
          onClick={onBack}
          className="flex items-center text-content-secondary hover:text-white transition-colors mb-4"
          style={{ columnGap: 6 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{t('common:back')}</span>
        </button>

        <div className="flex items-center" style={{ columnGap: 10 }}>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            {model.name}
          </h2>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md', colors.bg, colors.text)}>
            {category}
          </span>
        </div>
        {model.description && (
          <p className="text-content-secondary text-sm mt-1">{model.description}</p>
        )}
      </motion.div>

      {/* Prompt input */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div
          className={cn(
            'rounded-2xl bg-surface-card border border-white/[0.08] p-4 transition-all duration-200',
            'ring-2 ring-transparent',
            colors.ring,
          )}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(`create:placeholders.${category}`)}
            disabled={isGenerating}
            rows={3}
            className="w-full bg-transparent text-white placeholder-content-secondary text-sm resize-none outline-none"
            style={{ minHeight: 72 }}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <p className="text-[11px] text-content-secondary">
              {t('create:shiftEnterHint')}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isGenerating}
              disabled={!prompt.trim() || isGenerating}
            >
              {t('common:generate')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
