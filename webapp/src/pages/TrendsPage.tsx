import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { trendsApi } from '@/services/api/trends.api';
import { Card, Button, Skeleton } from '@/shared/ui';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { cn } from '@/shared/utils/cn';

/* ───────── Types ───────── */

interface TrendCategory {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  icon?: string;
  sortOrder: number;
}

interface Trend {
  id: string;
  name: string;
  description?: string;
  category?: TrendCategory | null;
  videoUrl: string;
  thumbnailUrl?: string;
  tokenCost: number;
  usageCount: number;
  isFeatured?: boolean;
  isNew?: boolean;
}

interface GenerationResult {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

/* ───────── TrendCard ───────── */

const TrendCard: React.FC<{
  trend: Trend;
  onSelect: (trend: Trend) => void;
}> = ({ trend, onSelect }) => {
  const { t } = useTranslation('trends');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTouchStart = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTouchEnd = () => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative cursor-pointer group"
      onClick={() => {
        hapticImpact('light');
        onSelect(trend);
      }}
    >
      {/* Video container — 9:16 aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-surface-card border border-white/[0.08]"
        style={{ aspectRatio: '9 / 16' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => {
          if (isPlaying) handleTouchEnd();
        }}
      >
        <video
          ref={videoRef}
          src={trend.videoUrl}
          poster={trend.thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        />

        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M4 2.5v11l9-5.5L4 2.5z" />
              </svg>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center" style={{ columnGap: 4 }}>
          {trend.isFeatured && (
            <span className="flex items-center bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="mr-0.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
          )}
          {trend.isNew && (
            <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              NEW
            </span>
          )}
        </div>

        {/* Token cost badge */}
        <div className="absolute top-2 right-2">
          <span className="flex items-center bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="mr-0.5">
              <circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="2" />
              <path d="M12 6v12M8 10h8M9 14h6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {trend.tokenCost}
          </span>
        </div>
      </div>

      {/* Info below the card */}
      <div className="mt-2 px-0.5">
        <p className="text-white text-xs font-medium truncate">{trend.name}</p>
        <p className="text-content-tertiary text-[10px] mt-0.5">
          {t('used')} {trend.usageCount.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

/* ───────── TrendDetail ───────── */

const TrendDetail: React.FC<{
  trend: Trend;
  onBack: () => void;
}> = ({ trend, onBack }) => {
  const { t } = useTranslation('trends');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const pollGenerationStatus = useCallback((generationId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const status = await trendsApi.getGenerationStatus(generationId);
        setGeneration(status);

        if (status.status === 'completed' || status.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setIsGenerating(false);

          if (status.status === 'completed') {
            hapticNotification('success');
          } else {
            hapticNotification('error');
            setError(status.error || t('generationError'));
          }
        }
      } catch {
        // Silently retry on network errors during polling
      }
    }, 3000);
  }, [t]);

  const handleGenerate = async () => {
    if (!photoFile) return;

    setIsGenerating(true);
    setError(null);
    hapticImpact('medium');

    try {
      // Upload photo first
      const formData = new FormData();
      formData.append('photo', photoFile);
      const uploadResult = await trendsApi.uploadPhoto(formData);

      // Start generation
      const result = await trendsApi.generateTrendVideo(trend.id, {
        photoUrl: uploadResult.photoUrl,
      });

      setGeneration(result);
      pollGenerationStatus(result.generationId);
    } catch (err: any) {
      setIsGenerating(false);
      hapticNotification('error');

      if (err?.message?.includes('insufficient') || err?.message?.includes('tokens')) {
        const match = err.message.match(/\d+/);
        setError(t('insufficientTokens', { required: match?.[0] || trend.tokenCost }));
      } else {
        setError(err?.message || t('generationError'));
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setGeneration(null);
    handleGenerate();
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 bg-gradient-to-b from-surface-bg to-surface-secondary overflow-y-auto"
    >
      <div className="p-4 space-y-4 pb-8">
        {/* Back button */}
        <button
          onClick={() => {
            hapticImpact('light');
            onBack();
          }}
          className="flex items-center text-content-secondary hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm ml-1">{t('back')}</span>
        </button>

        {/* Video player */}
        <div
          className="w-full overflow-hidden rounded-2xl bg-surface-card border border-white/[0.08]"
          style={{ aspectRatio: '9 / 16', maxHeight: '60vh' }}
        >
          <video
            src={trend.videoUrl}
            poster={trend.thumbnailUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
            loop
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center" style={{ columnGap: 12 }}>
          <Card padding="sm" className="flex-1 text-center">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('used')}</p>
            <p className="text-white text-lg font-bold mt-0.5">{trend.usageCount.toLocaleString()}</p>
          </Card>
          <Card padding="sm" className="flex-1 text-center">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('cost')}</p>
            <p className="text-brand-accent text-lg font-bold mt-0.5">{trend.tokenCost}</p>
          </Card>
        </div>

        {/* Description */}
        {trend.description && (
          <Card padding="sm">
            <p className="text-content-secondary text-sm leading-relaxed">{trend.description}</p>
          </Card>
        )}

        {/* Photo upload area */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-2">{t('uploadPhoto')}</h3>
          <p className="text-content-tertiary text-xs mb-3">{t('photoHint')}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              'relative w-full border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
              photoPreview
                ? 'border-brand-primary/40 bg-brand-primary/5'
                : 'border-white/15 bg-surface-card hover:border-white/30'
            )}
            style={{ minHeight: 160 }}
          >
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Selected photo"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{t('tapToSelect')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-content-tertiary">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <p className="text-content-tertiary text-sm">{t('tapToSelect')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate button / Progress */}
        {isGenerating ? (
          <Card padding="md" className="text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <svg className="animate-spin w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{t('generating')}</p>
                <p className="text-content-tertiary text-xs mt-1">{t('generatingHint')}</p>
              </div>
              {generation && (
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-700"
                    style={{
                      width: generation.status === 'processing' ? '60%' : '20%',
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        ) : error ? (
          <Card padding="md" className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              {t('retry')}
            </Button>
          </Card>
        ) : generation?.status === 'completed' ? (
          <Card padding="md" className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {generation.resultUrl && (
              <video
                src={generation.resultUrl}
                controls
                playsInline
                className="w-full rounded-xl"
                style={{ maxHeight: '50vh' }}
              />
            )}
          </Card>
        ) : (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleGenerate}
            disabled={!photoFile}
          >
            {t('generate')} &middot; {trend.tokenCost}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

/* ───────── TrendsPage (Main) ───────── */

const TrendsPage: React.FC = () => {
  const { t } = useTranslation('trends');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [categories, setCategories] = useState<TrendCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrends = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      const params = category ? { category } : undefined;
      const data = await trendsApi.getTrends(params);
      setTrends(data.trends || []);
      if (!categories.length && data.categories) {
        setCategories(data.categories);
      }
    } catch {
      // API errors handled gracefully — show empty state
    } finally {
      setIsLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    fetchTrends(activeCategory || undefined);
  }, [activeCategory, fetchTrends]);

  const handleCategorySelect = (cat: string | null) => {
    hapticImpact('light');
    setActiveCategory(cat);
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 p-4 space-y-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-2"
        >
          <h1 className="text-white text-2xl font-bold">{t('title')}</h1>
          <p className="text-content-tertiary mt-1 text-[14px] leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Category chips — horizontal scroll */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <div
            className="flex overflow-x-auto no-scrollbar -mx-4 px-4"
            style={{ columnGap: 8 }}
          >
            <button
              onClick={() => handleCategorySelect(null)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                activeCategory === null
                  ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary'
                  : 'bg-surface-card border-white/10 text-content-secondary hover:border-white/20'
              )}
            >
              {t('all')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap',
                  activeCategory === cat.slug
                    ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary'
                    : 'bg-surface-card border-white/10 text-content-secondary hover:border-white/20'
                )}
              >
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div style={{ aspectRatio: '9 / 16' }}>
                  <Skeleton
                    className="w-full h-full rounded-2xl"
                    variant="rectangular"
                  />
                </div>
                <Skeleton className="h-3 w-3/4 rounded mt-2" variant="text" />
                <Skeleton className="h-2.5 w-1/2 rounded mt-1" variant="text" />
              </div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-content-tertiary">
                <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
                <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
                <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
                <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
                <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
                <path d="M10 9.5C10 10.33 9.33 11 8.5 11h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z" />
                <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
              </svg>
            </div>
            <p className="text-content-tertiary text-sm">{t('noTrends')}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {trends.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                onSelect={setSelectedTrend}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {selectedTrend && (
          <TrendDetail
            trend={selectedTrend}
            onBack={() => setSelectedTrend(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrendsPage;
