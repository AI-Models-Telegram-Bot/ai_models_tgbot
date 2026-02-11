import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; hoverCard: string }> = {
  TEXT: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', hoverCard: 'hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)]' },
  IMAGE: { bg: 'bg-purple-500/10', text: 'text-purple-400', hoverCard: 'hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]' },
  VIDEO: { bg: 'bg-orange-500/10', text: 'text-orange-400', hoverCard: 'hover:border-orange-400/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.25)]' },
  AUDIO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hoverCard: 'hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' },
};

const CATEGORY_LABELS: Record<Category, string> = {
  TEXT: 'Text AI',
  IMAGE: 'Image AI',
  VIDEO: 'Video AI',
  AUDIO: 'Audio AI',
};

interface ModelSelectorProps {
  category: Category;
  models: ChatModel[];
  isLoading: boolean;
  onSelect: (model: ChatModel) => void;
  onBack: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  category,
  models,
  isLoading,
  onSelect,
  onBack,
}) => {
  const colors = CATEGORY_COLORS[category];
  const filteredModels = (models || []).filter((m) => m.category === category);

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

        <h2 className="text-xl sm:text-2xl font-display font-bold text-content-primary mb-1">
          Choose a model
        </h2>
        <p className="text-content-secondary text-sm">
          {CATEGORY_LABELS[category]} — select an AI model
        </p>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ rowGap: 12, columnGap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-card animate-pulse" />
          ))}
        </div>
      )}

      {/* Models grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ rowGap: 12, columnGap: 12 }}>
          {filteredModels.map((model, index) => (
            <motion.button
              key={model.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              onClick={() => onSelect(model)}
              className={cn(
                'relative rounded-xl p-4 text-left transition-all duration-200',
                'bg-surface-card border border-white/10 backdrop-blur-xl',
                'hover:scale-[1.02] active:scale-[0.98]',
                colors.hoverCard,
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-content-primary truncate">
                    {model.name}
                  </h3>
                  {model.description && (
                    <p className="text-xs text-content-tertiary mt-1 line-clamp-2">
                      {model.description}
                    </p>
                  )}
                </div>
                <div className={cn('shrink-0 ml-3 px-2 py-0.5 rounded-md text-[10px] font-semibold', colors.bg, colors.text)}>
                  {model.slug}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-content-tertiary text-sm">No models available for this category</p>
        </div>
      )}
    </div>
  );
};
