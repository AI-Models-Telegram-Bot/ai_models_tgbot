import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSectionsStore, type Category } from '@/features/create/store/useSectionsStore';
import { SectionView } from '@/features/create/components/SectionView';
import { BottomNav } from '@/features/create/components/BottomNav';
import { HistoryPanel } from '@/features/create/components/HistoryPanel';

const ALL_CATEGORIES: Category[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];

export default function CreatePage() {
  const { t } = useTranslation('common');
  const activeSection = useSectionsStore((s) => s.activeSection);
  const fetchModels = useSectionsStore((s) => s.fetchModels);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative pb-20">
      {/* History toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center text-content-secondary hover:text-white transition-colors bg-surface-card/40 rounded-xl px-3 py-2 border border-white/[0.06] hover:border-white/[0.12]"
          style={{ columnGap: 6 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">{t('history')}</span>
        </button>
      </div>

      {/* Section content — all sections are rendered but only active one is visible */}
      <div className="flex items-start justify-center px-4 pt-8 pb-12 sm:pt-16">
        {ALL_CATEGORIES.map((cat) => (
          <SectionView
            key={cat}
            category={cat}
            isVisible={cat === activeSection}
          />
        ))}
      </div>

      {/* Bottom navigation tabs */}
      <BottomNav />

      {/* History drawer */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
