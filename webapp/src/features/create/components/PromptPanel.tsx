import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { ring: string; text: string }> = {
  TEXT: { ring: 'focus-within:ring-cyan-400/40', text: 'text-cyan-400' },
  IMAGE: { ring: 'focus-within:ring-purple-400/40', text: 'text-purple-400' },
  VIDEO: { ring: 'focus-within:ring-orange-400/40', text: 'text-orange-400' },
  AUDIO: { ring: 'focus-within:ring-emerald-400/40', text: 'text-emerald-400' },
};

const PLACEHOLDERS: Record<Category, string> = {
  TEXT: 'Ask anything...',
  IMAGE: 'Describe the image you want to create...',
  VIDEO: 'Describe the video you want to generate...',
  AUDIO: 'Enter text to convert to speech, or describe a sound...',
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
          className="flex items-center text-content-tertiary hover:text-content-primary transition-colors mb-4"
          style={{ columnGap: 6 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center" style={{ columnGap: 10 }}>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-content-primary">
            {model.name}
          </h2>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md bg-surface-elevated', colors.text)}>
            {category}
          </span>
        </div>
        {model.description && (
          <p className="text-content-tertiary text-sm mt-1">{model.description}</p>
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
            'rounded-2xl bg-surface-card border border-white/10 backdrop-blur-xl p-4 transition-all duration-200',
            'ring-2 ring-transparent',
            colors.ring,
          )}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[category]}
            disabled={isGenerating}
            rows={3}
            className="w-full bg-transparent text-content-primary placeholder-content-tertiary text-sm resize-none outline-none"
            style={{ minHeight: 72 }}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <p className="text-[11px] text-content-tertiary">
              Shift+Enter for new line
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isGenerating}
              disabled={!prompt.trim() || isGenerating}
            >
              Generate
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
