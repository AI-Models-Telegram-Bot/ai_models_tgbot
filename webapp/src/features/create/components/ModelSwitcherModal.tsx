import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { getModelIcon } from '../constants/modelIcons';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  TEXT: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-400/30' },
  IMAGE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-400/30' },
  VIDEO: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-400/30' },
  AUDIO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
};

const CATEGORY_ORDER: Category[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];

const CATEGORY_LABELS: Record<Category, string> = {
  TEXT: 'categories.TEXT',
  IMAGE: 'categories.IMAGE',
  VIDEO: 'categories.VIDEO',
  AUDIO: 'categories.AUDIO',
};

interface ModelSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ChatModel[];
  currentModel: ChatModel | null;
  currentCategory: Category;
  onSelect: (model: ChatModel) => void;
}

export const ModelSwitcherModal: React.FC<ModelSwitcherModalProps> = ({
  isOpen,
  onClose,
  models,
  currentModel,
  currentCategory,
  onSelect,
}) => {
  const { t } = useTranslation(['create', 'common']);
  const [search, setSearch] = useState('');

  const handleSelect = (model: ChatModel) => {
    if (!model.hasAccess) return;
    onSelect(model);
    onClose();
    setSearch('');
  };

  // Group models: current category first, then others
  const groupedModels = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = models.filter(
      (m) => m.hasAccess && (
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.slug.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query)
      ),
    );

    const sortedCategories = [
      currentCategory,
      ...CATEGORY_ORDER.filter((c) => c !== currentCategory),
    ];

    return sortedCategories
      .map((cat) => ({
        category: cat,
        models: filtered.filter((m) => m.category === cat),
      }))
      .filter((group) => group.models.length > 0);
  }, [models, currentCategory, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('create:switchModel', 'Switch Model')} size="md">
      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('create:searchModels', 'Search models...')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-bg border border-white/[0.08] text-white text-sm placeholder-content-secondary outline-none focus:border-brand-primary/40 transition-colors"
            autoFocus
          />
        </div>

        {/* Model groups */}
        <div className="space-y-5">
          {groupedModels.map(({ category, models: catModels }) => {
            const colors = CATEGORY_COLORS[category];
            return (
              <div key={category}>
                <div className="flex items-center mb-2" style={{ columnGap: 6 }}>
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider', colors.text)}>
                    {t(`create:${CATEGORY_LABELS[category]}`)}
                  </span>
                  <span className="text-[10px] text-content-tertiary">
                    ({catModels.length})
                  </span>
                </div>

                <div className="space-y-1">
                  {catModels.map((model) => {
                    const isActive = currentModel?.id === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelect(model)}
                        className={cn(
                          'w-full flex items-center rounded-xl px-3 py-2.5 text-left transition-all',
                          isActive
                            ? cn('bg-surface-card border', colors.border)
                            : 'hover:bg-white/[0.04] border border-transparent',
                        )}
                        style={{ columnGap: 10 }}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base',
                          colors.bg,
                        )}>
                          {getModelIcon(model.slug, model.category)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'text-sm font-medium truncate',
                              isActive ? 'text-white' : 'text-content-secondary',
                            )}>
                              {model.name}
                            </span>
                            <span className={cn(
                              'shrink-0 ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums',
                              colors.bg, colors.text,
                            )}>
                              {model.isUnlimited ? '∞' : `${model.tokenCost}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-content-tertiary capitalize">{model.provider}</span>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <div className={cn('shrink-0 w-2 h-2 rounded-full', colors.text.replace('text-', 'bg-'))} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {groupedModels.length === 0 && (
            <div className="text-center py-8">
              <p className="text-content-secondary text-sm">{t('create:noModelsFound', 'No models found')}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
