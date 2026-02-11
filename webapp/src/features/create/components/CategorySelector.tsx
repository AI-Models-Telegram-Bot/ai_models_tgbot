import React from 'react';
import { motion } from 'framer-motion';
import type { Category } from '../store/useCreateStore';

interface CategoryConfig {
  key: Category;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  border: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'TEXT',
    label: 'Text AI',
    description: 'GPT-4, Claude, Grok',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]',
    border: 'hover:border-cyan-400/40',
  },
  {
    key: 'IMAGE',
    label: 'Image AI',
    description: 'DALL-E, Flux, Midjourney',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    border: 'hover:border-purple-400/40',
  },
  {
    key: 'VIDEO',
    label: 'Video AI',
    description: 'Kling, Sora, Runway',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    border: 'hover:border-orange-400/40',
  },
  {
    key: 'AUDIO',
    label: 'Audio AI',
    description: 'ElevenLabs, Suno, Bark',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
    ),
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    border: 'hover:border-emerald-400/40',
  },
];

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-content-primary mb-2">
          What do you want to create?
        </h1>
        <p className="text-content-secondary text-sm">
          Choose a category to get started
        </p>
      </motion.div>

      <div className="grid grid-cols-2" style={{ rowGap: 16, columnGap: 16 }}>
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.key}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            onClick={() => onSelect(cat.key)}
            className={`
              relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left
              bg-surface-card border border-white/10
              backdrop-blur-xl transition-all duration-300
              hover:scale-[1.02] active:scale-[0.98]
              ${cat.glow} ${cat.border}
            `}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} pointer-events-none`} />

            {/* Content */}
            <div className="relative z-10">
              <div className="text-content-primary mb-3">
                {cat.icon}
              </div>
              <h3 className="text-lg font-semibold text-content-primary mb-1">
                {cat.label}
              </h3>
              <p className="text-xs text-content-tertiary">
                {cat.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
