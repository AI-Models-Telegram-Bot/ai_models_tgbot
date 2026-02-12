import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; hoverCard: string; gradient: string }> = {
  TEXT: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    hoverCard: 'hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]',
    gradient: 'from-cyan-500/5 to-transparent',
  },
  IMAGE: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    hoverCard: 'hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    gradient: 'from-purple-500/5 to-transparent',
  },
  VIDEO: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    hoverCard: 'hover:border-orange-400/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    gradient: 'from-orange-500/5 to-transparent',
  },
  AUDIO: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    hoverCard: 'hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    gradient: 'from-emerald-500/5 to-transparent',
  },
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
  const accessibleModels = filteredModels.filter((m) => m.hasAccess);
  const lockedModels = filteredModels.filter((m) => !m.hasAccess);

  const handleSelect = (model: ChatModel) => {
    if (!model.hasAccess) return;
    onSelect(model);
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
          <span className="text-sm">Back</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">
          Choose a model
        </h2>
        <p className={cn('text-sm', colors.text)} style={{ opacity: 0.7 }}>
          {CATEGORY_LABELS[category]} — select an AI model
        </p>
      </motion.div>

      {/* Loading shimmer */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ rowGap: 12, columnGap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative h-[88px] rounded-xl bg-surface-card border border-white/5 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
            </div>
          ))}
        </div>
      )}

      {/* Available models */}
      {!isLoading && accessibleModels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ rowGap: 12, columnGap: 12 }}>
          {accessibleModels.map((model, index) => (
            <motion.button
              key={model.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              onClick={() => handleSelect(model)}
              className={cn(
                'relative rounded-xl p-4 text-left transition-all duration-200 overflow-hidden',
                'bg-surface-card border border-white/[0.08]',
                'hover:scale-[1.02] active:scale-[0.98]',
                colors.hoverCard,
              )}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} pointer-events-none`} />
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {model.name}
                  </h3>
                  {model.description && (
                    <p className="text-xs text-content-secondary mt-1 line-clamp-2">
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

      {/* Locked models */}
      {!isLoading && lockedModels.length > 0 && (
        <>
          <div className="flex items-center mt-6 mb-3" style={{ columnGap: 8 }}>
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-content-secondary flex items-center" style={{ columnGap: 4 }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Upgrade to unlock
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ rowGap: 10, columnGap: 10 }}>
            {lockedModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 0.5 }}
                transition={{ duration: 0.25, delay: (accessibleModels.length + index) * 0.04 }}
                className="relative rounded-xl p-4 text-left bg-surface-card/50 border border-white/[0.04] cursor-not-allowed"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ columnGap: 6 }}>
                      <h3 className="text-sm font-medium text-content-secondary truncate">
                        {model.name}
                      </h3>
                      <svg className="w-3.5 h-3.5 shrink-0 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    {model.description && (
                      <p className="text-xs text-content-secondary mt-1 line-clamp-1" style={{ opacity: 0.6 }}>
                        {model.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Empty */}
      {!isLoading && filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-content-secondary text-sm">No models available for this category</p>
        </div>
      )}
    </div>
  );
};
