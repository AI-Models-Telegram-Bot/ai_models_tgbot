import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { closeTelegramWebApp } from '@/services/telegram/telegram';
import { useAudioSettingsStore } from '@/features/audio/store/audioSettingsStore';
import { Skeleton } from '@/shared/ui';
import toast from 'react-hot-toast';
import type { SunoSettings } from '@/services/api/audioSettings.api';

const MODES: Array<{ value: SunoSettings['mode']; labelKey: string; descKey: string; icon: string }> = [
  { value: 'custom', labelKey: 'modeCustom', descKey: 'modeCustomDesc', icon: '✍️' },
  { value: 'standard', labelKey: 'modeStandard', descKey: 'modeStandardDesc', icon: '🎵' },
  { value: 'instrumental', labelKey: 'modeInstrumental', descKey: 'modeInstrumentalDesc', icon: '🎹' },
];

const STYLE_PRESETS = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical', 'ambient'];

export default function SunoSettingsPage() {
  const { t } = useTranslation('audio');
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();
  const {
    sunoSettings,
    isLoading,
    isSaving,
    fetchSettings,
    updateSuno,
  } = useAudioSettingsStore();

  const [mode, setMode] = useState<SunoSettings['mode']>('standard');
  const [style, setStyle] = useState('');

  useEffect(() => {
    if (telegramId) {
      fetchSettings(telegramId);
    }
  }, [telegramId]);

  useEffect(() => {
    if (sunoSettings) {
      setMode(sunoSettings.mode);
      setStyle(sunoSettings.style);
    }
  }, [sunoSettings]);

  const handleModeSelect = (newMode: SunoSettings['mode']) => {
    hapticImpact('light');
    setMode(newMode);
  };

  const handleStylePreset = (preset: string) => {
    hapticImpact('light');
    setStyle(prev => {
      const styles = prev.split(',').map(s => s.trim()).filter(Boolean);
      if (styles.includes(preset)) {
        return styles.filter(s => s !== preset).join(', ');
      }
      return [...styles, preset].join(', ');
    });
  };

  const handleSave = async () => {
    if (!telegramId) return;
    hapticImpact('medium');

    try {
      await updateSuno(telegramId, { mode, style });
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
        <Skeleton className="h-40" variant="rectangular" />
        <Skeleton className="h-32" variant="rectangular" />
      </div>
    );
  }

  const hasChanged =
    mode !== sunoSettings?.mode ||
    style !== sunoSettings?.style;

  const activeStyles = style.split(',').map(s => s.trim()).filter(Boolean);

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
            <span className="text-audio-primary">🎸</span> {t('sunoSettings')}
          </h1>
        </motion.div>

        {/* Mode selector */}
        <div className="mb-5">
          <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">{t('mode')}</div>
          <div className="space-y-2">
            {MODES.map(({ value, labelKey, descKey, icon }) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleModeSelect(value)}
                className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                  mode === value
                    ? 'bg-audio-surface-elevated border-2 border-audio-primary shadow-audio-neon'
                    : 'bg-audio-surface-card border border-white/5 hover:border-audio-primary/30'
                }`}
              >
                <div className="flex items-center" style={{ columnGap: 10 }}>
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ columnGap: 8 }}>
                      <span className="font-semibold text-content-primary text-sm">{t(labelKey as any)}</span>
                      {mode === value && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-audio-primary/20 text-audio-primary font-medium shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-content-tertiary mt-0.5">{t(descKey as any)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Style input */}
        <div className="mb-4">
          <div className="text-xs text-content-tertiary uppercase tracking-wide mb-2">{t('style')}</div>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder={t('stylePlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl bg-audio-surface-card border border-white/10 text-content-primary placeholder-content-tertiary text-sm focus:outline-none focus:border-audio-primary focus:ring-1 focus:ring-audio-primary/30 transition-colors"
          />
        </div>

        {/* Style presets */}
        <div className="mb-4">
          <div className="text-xs text-content-tertiary uppercase tracking-wide mb-2">{t('stylePresets')}</div>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {STYLE_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => handleStylePreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeStyles.includes(preset)
                    ? 'bg-audio-primary text-white'
                    : 'bg-white/5 text-content-secondary hover:bg-white/10'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
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
