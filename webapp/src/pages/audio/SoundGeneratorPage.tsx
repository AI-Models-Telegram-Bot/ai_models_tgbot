import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { useAudioSettingsStore } from '@/features/audio/store/audioSettingsStore';
import { Card, Skeleton } from '@/shared/ui';
import toast from 'react-hot-toast';

function TemperatureSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-content-primary">{label}</div>
        <div className="text-sm font-mono text-audio-primary font-semibold">{value.toFixed(1)}</div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={value}
        onChange={(e) => {
          hapticImpact('light');
          onChange(parseFloat(e.target.value));
        }}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-audio-primary
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-audio-primary
          [&::-webkit-slider-thumb]:shadow-audio-neon [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-audio-primary-light"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-content-tertiary">0.0</span>
        <span className="text-[10px] text-content-tertiary">1.0</span>
      </div>
      <p className="text-xs text-content-tertiary mt-1">{description}</p>
    </div>
  );
}

export default function SoundGeneratorPage() {
  const { t } = useTranslation('audio');
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();
  const {
    soundGenSettings,
    isLoading,
    isSaving,
    fetchSettings,
    updateSoundGen,
  } = useAudioSettingsStore();

  const [textTemp, setTextTemp] = useState(0.7);
  const [waveformTemp, setWaveformTemp] = useState(0.7);

  useEffect(() => {
    if (telegramId) {
      fetchSettings(telegramId);
    }
  }, [telegramId]);

  useEffect(() => {
    if (soundGenSettings) {
      setTextTemp(soundGenSettings.textTemp);
      setWaveformTemp(soundGenSettings.waveformTemp);
    }
  }, [soundGenSettings]);

  const handleSave = async () => {
    if (!telegramId) return;
    hapticImpact('medium');

    try {
      await updateSoundGen(telegramId, { textTemp, waveformTemp });
      hapticNotification('success');
      toast.success(t('saved'));
    } catch {
      hapticNotification('error');
      toast.error(t('saveError'));
    }
  };

  if (isTelegramLoading || isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16" variant="rectangular" />
        <Skeleton className="h-48" variant="rectangular" />
        <Skeleton className="h-24" variant="rectangular" />
      </div>
    );
  }

  const hasChanged =
    textTemp !== soundGenSettings?.textTemp ||
    waveformTemp !== soundGenSettings?.waveformTemp;

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
            <span className="text-audio-primary">🥁</span> {t('soundSettings')}
          </h1>
        </motion.div>

        {/* Temperature sliders */}
        <Card className="mb-4 !bg-audio-surface-card border border-white/5 p-4">
          <TemperatureSlider
            label={t('textTemp')}
            description={t('textTempDesc')}
            value={textTemp}
            onChange={setTextTemp}
          />
          <TemperatureSlider
            label={t('waveformTemp')}
            description={t('waveformTempDesc')}
            value={waveformTemp}
            onChange={setWaveformTemp}
          />
        </Card>

        {/* Info card */}
        <Card className="!bg-audio-surface-elevated border border-audio-primary/20 p-3.5">
          <div className="flex" style={{ columnGap: 10 }}>
            <span className="text-audio-primary text-lg shrink-0">💡</span>
            <p className="text-xs text-content-secondary leading-relaxed">
              {t('paramsInfo')}
            </p>
          </div>
        </Card>
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
