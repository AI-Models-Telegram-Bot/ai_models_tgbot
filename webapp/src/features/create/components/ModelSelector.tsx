import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { getModelIcon } from '../constants/modelIcons';
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
  const { t } = useTranslation(['create', 'common']);
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
          <span className="text-sm">{t('common:back')}</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">
          {t('create:chooseModel')}
        </h2>
        <p className={cn('text-sm', colors.text)} style={{ opacity: 0.7 }}>
          {t(`create:categories.${category}`)} — {t('create:selectAiModel')}
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
                'relative rounded-xl p-3.5 text-left transition-all duration-200 overflow-hidden',
                'bg-surface-card border border-white/[0.08]',
                'hover:scale-[1.02] active:scale-[0.98]',
                colors.hoverCard,
              )}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} pointer-events-none`} />
              <div className="relative flex items-start" style={{ columnGap: 10 }}>
                {/* Icon */}
                <div className={cn(
                  'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
                  colors.bg,
                )}>
                  {getModelIcon(model.slug, model.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {model.name}
                    </h3>
                    <span className={cn(
                      'shrink-0 ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums',
                      colors.bg, colors.text,
                    )}>
                      {model.isUnlimited ? '∞' : `${model.tokenCost} ${t('create:credits')}`}
                    </span>
                  </div>

                  {t(`create:modelDescriptions.${model.slug}`, '') && (
                    <p className="text-xs text-content-secondary mt-0.5 truncate">
                      {t(`create:modelDescriptions.${model.slug}`, '')}
                    </p>
                  )}

                  <p className="text-[10px] text-content-tertiary mt-0.5 capitalize">
                    {model.provider}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Locked models */}
      {!isLoading && lockedModels.length > 0 && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: accessibleModels.length * 0.05 + 0.1 }}
          className="mt-6 rounded-xl bg-surface-card/40 border border-white/[0.06] p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center" style={{ columnGap: 8 }}>
              <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {t('create:moreModelsAvailable', { count: lockedModels.length })}
                </p>
                <p className="text-xs text-content-secondary">
                  {lockedModels.slice(0, 3).map(m => `${getModelIcon(m.slug, m.category)} ${m.name}`).join(', ')}
                  {lockedModels.length > 3 ? ` ${t('create:andMore', { count: lockedModels.length - 3 })}` : ''}
                </p>
              </div>
            </div>
          </div>
          <Link
            to="/subscriptions"
            className="flex items-center justify-center w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-accent/20 to-brand-secondary/20 border border-brand-accent/20 text-brand-accent text-sm font-semibold hover:from-brand-accent/30 hover:to-brand-secondary/30 transition-all"
            style={{ columnGap: 6 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {t('create:upgradePlan')}
          </Link>
        </motion.div>
      )}

      {/* Empty */}
      {!isLoading && filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-content-secondary text-sm">{t('create:noModelsAvailable')}</p>
        </div>
      )}
    </div>
  );
};
