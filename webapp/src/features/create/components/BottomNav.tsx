import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useSectionsStore, type Category } from '../store/useSectionsStore';

interface TabConfig {
  key: Category;
  labelKey: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
  dotColor: string;
}

const TABS: TabConfig[] = [
  {
    key: 'TEXT',
    labelKey: 'categories.TEXT',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    activeColor: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
    dotColor: 'bg-cyan-400',
  },
  {
    key: 'IMAGE',
    labelKey: 'categories.IMAGE',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    activeColor: 'text-purple-400',
    activeBg: 'bg-purple-500/10',
    dotColor: 'bg-purple-400',
  },
  {
    key: 'VIDEO',
    labelKey: 'categories.VIDEO',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    activeColor: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    dotColor: 'bg-orange-400',
  },
  {
    key: 'AUDIO',
    labelKey: 'categories.AUDIO',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
    ),
    activeColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-400',
  },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation('create');
  const activeSection = useSectionsStore((s) => s.activeSection);
  const sections = useSectionsStore((s) => s.sections);
  const setActiveSection = useSectionsStore((s) => s.setActiveSection);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06]"
      style={{
        background: 'rgba(15,15,35,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-2">
        {TABS.map((tab) => {
          const isActive = activeSection === tab.key;
          const section = sections[tab.key];
          const hasUnseen = section.unseenCount > 0;
          const isGenerating = section.isGenerating;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={cn(
                'relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all',
                isActive ? tab.activeBg : 'hover:bg-white/[0.03]',
              )}
              style={{ minWidth: 60 }}
            >
              <div className={cn(
                'relative transition-colors',
                isActive ? tab.activeColor : 'text-content-tertiary',
              )}>
                {tab.icon}

                {/* Badge for unseen results */}
                {hasUnseen && (
                  <span className={cn(
                    'absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white',
                    tab.dotColor,
                  )}>
                    {section.unseenCount}
                  </span>
                )}

                {/* Generating indicator */}
                {isGenerating && !hasUnseen && (
                  <span className={cn(
                    'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse',
                    tab.dotColor,
                  )} />
                )}
              </div>

              <span className={cn(
                'text-[10px] font-medium mt-0.5 transition-colors',
                isActive ? tab.activeColor : 'text-content-tertiary',
              )}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe area padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </div>
  );
};
