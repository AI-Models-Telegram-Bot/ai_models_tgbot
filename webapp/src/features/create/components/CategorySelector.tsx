import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Category } from '../store/useCreateStore';

interface CategoryConfig {
  key: Category;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  border: string;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'TEXT',
    labelKey: 'categories.TEXT',
    descKey: 'categoryDescriptions.TEXT',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    gradient: 'from-cyan-500/20 via-cyan-400/5 to-transparent',
    glow: 'hover:shadow-[0_0_40px_rgba(0,212,255,0.2)]',
    border: 'hover:border-cyan-400/30',
    iconColor: 'text-cyan-400',
  },
  {
    key: 'IMAGE',
    labelKey: 'categories.IMAGE',
    descKey: 'categoryDescriptions.IMAGE',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-purple-500/20 via-purple-400/5 to-transparent',
    glow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]',
    border: 'hover:border-purple-400/30',
    iconColor: 'text-purple-400',
  },
  {
    key: 'VIDEO',
    labelKey: 'categories.VIDEO',
    descKey: 'categoryDescriptions.VIDEO',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-orange-500/20 via-orange-400/5 to-transparent',
    glow: 'hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]',
    border: 'hover:border-orange-400/30',
    iconColor: 'text-orange-400',
  },
];

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelect }) => {
  const { t } = useTranslation('create');

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-10"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          {t('whatToCreate')}
        </h1>
        <p className="text-content-secondary text-sm">
          {t('chooseCategory')}
        </p>
      </motion.div>

      <div className="grid grid-cols-2" style={{ rowGap: 14, columnGap: 14 }}>
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.key}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            onClick={() => onSelect(cat.key)}
            className={`
              relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left
              bg-surface-card/80 border border-white/[0.08]
              transition-all duration-300
              hover:scale-[1.03] active:scale-[0.97]
              ${cat.glow} ${cat.border}
            `}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} pointer-events-none`} />

            {/* Content */}
            <div className="relative z-10">
              <div className={`${cat.iconColor} mb-4`}>
                {cat.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-0.5">
                {t(cat.labelKey)}
              </h3>
              <p className="text-xs text-content-secondary">
                {t(cat.descKey)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
