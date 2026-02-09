import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { closeTelegramWebApp } from '@/services/telegram/telegram';
import { useAudioSettingsStore } from '@/features/audio/store/audioSettingsStore';
import { Card, Skeleton } from '@/shared/ui';
import toast from 'react-hot-toast';
import type { VoiceInfo } from '@/services/api/audioSettings.api';

const CATEGORIES = ['all', 'premade', 'cloned', 'generated'] as const;

function VoiceCard({
  voice,
  isSelected,
  onSelect,
}: {
  voice: VoiceInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation('audio');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.previewUrl) return;
    hapticImpact('light');

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  };

  const gender = voice.labels?.gender;
  const age = voice.labels?.age;
  const accent = voice.labels?.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        hapticImpact('light');
        onSelect();
      }}
      className={`rounded-xl p-3 cursor-pointer transition-all ${
        isSelected
          ? 'bg-audio-surface-elevated border-2 border-audio-primary shadow-audio-neon'
          : 'bg-audio-surface-card border border-white/5 hover:border-audio-primary/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ columnGap: 8 }}>
            <span className="font-semibold text-content-primary text-sm truncate">{voice.name}</span>
            {isSelected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-audio-primary/20 text-audio-primary font-medium shrink-0">
                {t('selected')}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-content-tertiary mt-1" style={{ columnGap: 6 }}>
            {gender && <span className="capitalize">{gender}</span>}
            {age && <><span>·</span><span className="capitalize">{age}</span></>}
            {accent && <><span>·</span><span className="capitalize">{accent}</span></>}
          </div>
        </div>
        {voice.previewUrl && (
          <button
            onClick={handlePreview}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-audio-primary text-white'
                : 'bg-white/5 text-content-secondary hover:bg-audio-primary/20 hover:text-audio-primary'
            }`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ElevenLabsVoicePage() {
  const { t } = useTranslation('audio');
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();
  const {
    elevenLabsSettings,
    voices,
    voicesLoading,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    updateElevenLabs,
    fetchVoices,
  } = useAudioSettingsStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (telegramId) {
      fetchSettings(telegramId);
      fetchVoices();
    }
  }, [telegramId]);

  useEffect(() => {
    if (elevenLabsSettings?.voiceId) {
      setSelectedVoiceId(elevenLabsSettings.voiceId);
    }
  }, [elevenLabsSettings]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchVoices(value || undefined, category !== 'all' ? category : undefined);
    }, 300);
  }, [category]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    hapticImpact('light');
    fetchVoices(search || undefined, cat !== 'all' ? cat : undefined);
  };

  const handleSave = async () => {
    if (!telegramId || !selectedVoiceId) return;
    hapticImpact('medium');

    const voice = voices.find(v => v.voiceId === selectedVoiceId);
    try {
      await updateElevenLabs(telegramId, {
        voiceId: selectedVoiceId,
        voiceName: voice?.name || 'Unknown',
      });
      hapticNotification('success');
      toast.success(t('saved'));
      setTimeout(() => closeTelegramWebApp(), 800);
    } catch {
      hapticNotification('error');
      toast.error(t('saveError'));
    }
  };

  if (isTelegramLoading || isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16" variant="rectangular" />
        <Skeleton className="h-10" variant="rectangular" />
        <Skeleton className="h-64" variant="rectangular" />
      </div>
    );
  }

  const hasChanged = selectedVoiceId !== elevenLabsSettings?.voiceId;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-xl font-display font-bold text-content-primary">
            <span className="text-audio-primary">🎙️</span> {t('voiceSettings')}
          </h1>
        </motion.div>

        {/* Current voice */}
        <Card className="mb-4 !bg-audio-surface-card border border-audio-primary/20">
          <div className="p-3">
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-1">{t('currentVoice')}</div>
            <div className="text-sm font-medium text-audio-primary-light">
              {elevenLabsSettings?.voiceName || t('noVoiceSelected')}
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('searchVoices')}
            className="w-full px-4 py-2.5 rounded-xl bg-audio-surface-card border border-white/10 text-content-primary placeholder-content-tertiary text-sm focus:outline-none focus:border-audio-primary focus:ring-1 focus:ring-audio-primary/30 transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex mb-4 overflow-x-auto scrollbar-hide" style={{ columnGap: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-audio-primary text-white'
                  : 'bg-white/5 text-content-secondary hover:bg-white/10'
              }`}
            >
              {t(`filter${cat.charAt(0).toUpperCase() + cat.slice(1)}` as any)}
            </button>
          ))}
          {!voicesLoading && (
            <span className="px-3 py-1.5 text-xs text-content-tertiary whitespace-nowrap">
              {t('voicesCount', { count: voices.length })}
            </span>
          )}
        </div>

        {/* Voice list */}
        {voicesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" variant="rectangular" />
            ))}
          </div>
        ) : error && voices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={() => fetchVoices()}
              className="px-4 py-2 rounded-xl bg-audio-primary/20 text-audio-primary text-sm font-medium hover:bg-audio-primary/30 transition-colors"
            >
              {t('retry', 'Retry')}
            </button>
          </div>
        ) : voices.length === 0 ? (
          <div className="text-center text-content-tertiary py-10 text-sm">
            {t('noVoicesFound')}
          </div>
        ) : (
          <div className="space-y-2">
            {voices.map(voice => (
              <VoiceCard
                key={voice.voiceId}
                voice={voice}
                isSelected={selectedVoiceId === voice.voiceId}
                onSelect={() => setSelectedVoiceId(voice.voiceId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-audio-surface via-audio-surface to-transparent pt-8">
        <button
          onClick={handleSave}
          disabled={!hasChanged || isSaving}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            hasChanged && !isSaving
              ? 'bg-audio-primary text-white shadow-audio-neon hover:bg-audio-primary-dark active:scale-[0.98]'
              : 'bg-white/5 text-content-tertiary cursor-not-allowed'
          }`}
        >
          {isSaving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
