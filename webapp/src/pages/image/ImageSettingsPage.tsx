import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { closeTelegramWebApp } from '@/services/telegram/telegram';
import { useImageSettingsStore } from '@/features/image/store/imageSettingsStore';
import { Skeleton } from '@/shared/ui';
import toast from 'react-hot-toast';

interface AspectOption {
  value: string;
  label: string;
  w: number;
  h: number;
}

const ALL_ASPECTS: AspectOption[] = [
  { value: '1:1', label: '1:1', w: 1, h: 1 },
  { value: '16:9', label: '16:9', w: 16, h: 9 },
  { value: '9:16', label: '9:16', w: 9, h: 16 },
  { value: '4:3', label: '4:3', w: 4, h: 3 },
  { value: '3:4', label: '3:4', w: 3, h: 4 },
  { value: '4:5', label: '4:5', w: 4, h: 5 },
  { value: '5:4', label: '5:4', w: 5, h: 4 },
  { value: '3:2', label: '3:2', w: 3, h: 2 },
  { value: '2:3', label: '2:3', w: 2, h: 3 },
  { value: '21:9', label: '21:9', w: 21, h: 9 },
];

const MODEL_ASPECTS: Record<string, string[]> = {
  'flux-schnell': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
  'flux-kontext': ['1:1', '16:9', '9:16', '4:3', '3:4'],
  'flux-dev': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
  'flux-pro': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
  'sdxl-lightning': ['1:1', '16:9', '9:16', '4:3', '3:4'],
  'sdxl': ['1:1', '16:9', '9:16', '4:3', '3:4'],
  'playground-v2-5': ['1:1', '16:9', '9:16', '4:3', '3:4'],
  'dall-e-2': ['1:1'],
  'dall-e-3': ['1:1', '16:9', '9:16'],
  'ideogram': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
  'midjourney': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
  'nano-banana': ['1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '21:9'],
  'nano-banana-pro': ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
  'seedream': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
};

const QUALITY_OPTIONS = [
  { value: 'standard', labelKey: 'qualityStandard', descKey: 'qualityStandardDesc', icon: '⚡' },
  { value: 'hd', labelKey: 'qualityHD', descKey: 'qualityHDDesc', icon: '✨' },
];

const STYLE_OPTIONS = [
  { value: 'vivid', labelKey: 'styleVivid', descKey: 'styleVividDesc', icon: '🎨' },
  { value: 'natural', labelKey: 'styleNatural', descKey: 'styleNaturalDesc', icon: '🍃' },
];

const VERSION_OPTIONS = [
  { value: 'v5.2', label: 'v5.2' },
  { value: 'v6.1', label: 'v6.1' },
  { value: 'v7', label: 'v7' },
];

const STYLIZE_OPTIONS = [
  { value: 50, labelKey: 'stylizeLow', descKey: 'stylizeLowDesc', icon: '🔅' },
  { value: 100, labelKey: 'stylizeMedium', descKey: 'stylizeMediumDesc', icon: '🔆' },
  { value: 250, labelKey: 'stylizeHigh', descKey: 'stylizeHighDesc', icon: '✨' },
  { value: 750, labelKey: 'stylizeMax', descKey: 'stylizeMaxDesc', icon: '💎' },
];

const SPEED_OPTIONS = [
  { value: 'relax', labelKey: 'speedRelax', descKey: 'speedRelaxDesc', icon: '🐢' },
  { value: 'fast', labelKey: 'speedFast', descKey: 'speedFastDesc', icon: '⚡' },
  { value: 'turbo', labelKey: 'speedTurbo', descKey: 'speedTurboDesc', icon: '🚀' },
];

const RESOLUTION_OPTIONS = [
  { value: '1K', labelKey: 'resolution1K', descKey: 'resolution1KDesc', icon: '📱' },
  { value: '2K', labelKey: 'resolution2K', descKey: 'resolution2KDesc', icon: '🖥️' },
  { value: '4K', labelKey: 'resolution4K', descKey: 'resolution4KDesc', icon: '🎬' },
];

function AspectPreview({ w, h }: { w: number; h: number }) {
  const maxSize = 120;
  const ratio = w / h;
  let previewW: number;
  let previewH: number;

  if (ratio >= 1) {
    previewW = maxSize;
    previewH = maxSize / ratio;
  } else {
    previewH = maxSize;
    previewW = maxSize * ratio;
  }

  return (
    <div className="flex items-center justify-center py-4">
      <motion.div
        key={`${w}:${h}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="border-2 border-dashed border-image-primary/60 rounded-lg flex items-center justify-center"
        style={{
          width: previewW,
          height: previewH,
        }}
      >
        <span className="text-xs text-image-primary font-medium">{w}:{h}</span>
      </motion.div>
    </div>
  );
}

export default function ImageSettingsPage() {
  const { t } = useTranslation('image');
  const [searchParams] = useSearchParams();
  const modelSlug = searchParams.get('model') || 'flux-schnell';

  const {
    settings,
    isLoading,
    isSaving,
    fetchModelSettings,
    updateModelSettings,
  } = useImageSettingsStore();

  const modelSettings = settings[modelSlug];
  const isDalle3 = modelSlug === 'dall-e-3';
  const isMidjourney = modelSlug === 'midjourney';
  const isNanoBananaPro = modelSlug === 'nano-banana-pro';
  const availableAspects = useMemo(
    () => ALL_ASPECTS.filter(a => (MODEL_ASPECTS[modelSlug] || ['1:1']).includes(a.value)),
    [modelSlug]
  );

  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('vivid');
  const [version, setVersion] = useState('v6.1');
  const [stylize, setStylize] = useState(100);
  const [speed, setSpeed] = useState('fast');
  const [weirdness, setWeirdness] = useState(0);
  const [resolution, setResolution] = useState('1K');

  useEffect(() => {
    fetchModelSettings(modelSlug);
  }, [modelSlug]);

  useEffect(() => {
    if (modelSettings) {
      setAspectRatio(modelSettings.aspectRatio || '1:1');
      if (isDalle3) {
        setQuality(modelSettings.quality || 'standard');
        setStyle(modelSettings.style || 'vivid');
      }
      if (isMidjourney) {
        setVersion(modelSettings.version || 'v6.1');
        setStylize(modelSettings.stylize ?? 100);
        setSpeed(modelSettings.speed || 'fast');
        setWeirdness(modelSettings.weirdness ?? 0);
      }
      if (isNanoBananaPro) {
        setResolution(modelSettings.resolution || '1K');
      }
    }
  }, [modelSettings, isDalle3, isMidjourney, isNanoBananaPro]);

  const selectedAspect = ALL_ASPECTS.find(a => a.value === aspectRatio) || ALL_ASPECTS[0];

  const hasChanged = (() => {
    const origAspect = modelSettings?.aspectRatio || '1:1';
    if (aspectRatio !== origAspect) return true;
    if (isDalle3) {
      if (quality !== (modelSettings?.quality || 'standard')) return true;
      if (style !== (modelSettings?.style || 'vivid')) return true;
    }
    if (isMidjourney) {
      if (version !== (modelSettings?.version || 'v6.1')) return true;
      if (stylize !== (modelSettings?.stylize ?? 100)) return true;
      if (speed !== (modelSettings?.speed || 'fast')) return true;
      if (weirdness !== (modelSettings?.weirdness ?? 0)) return true;
    }
    if (isNanoBananaPro) {
      if (resolution !== (modelSettings?.resolution || '1K')) return true;
    }
    return false;
  })();

  const handleAspectSelect = (value: string) => {
    hapticImpact('light');
    setAspectRatio(value);
  };

  const handleSave = async () => {
    hapticImpact('medium');
    try {
      const updates: Record<string, unknown> = { aspectRatio };
      if (isDalle3) {
        updates.quality = quality;
        updates.style = style;
      }
      if (isMidjourney) {
        updates.version = version;
        updates.stylize = stylize;
        updates.speed = speed;
        updates.weirdness = weirdness;
      }
      if (isNanoBananaPro) {
        updates.resolution = resolution;
      }
      await updateModelSettings(modelSlug, updates);
      hapticNotification('success');
      toast.success(t('saved'));
      setTimeout(() => closeTelegramWebApp(), 800);
    } catch {
      hapticNotification('error');
      toast.error(t('saveError'));
    }
  };

  const modelName = t(`modelNames.${modelSlug}` as any, modelSlug);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16" variant="rectangular" />
        <Skeleton className="h-40" variant="rectangular" />
        <Skeleton className="h-32" variant="rectangular" />
      </div>
    );
  }

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
            <span className="text-image-primary">🖼</span>{' '}
            {t('settings')}{' '}
            <span className="bg-gradient-to-r from-image-primary to-image-primary-light bg-clip-text text-transparent">
              {modelName}
            </span>
          </h1>
        </motion.div>

        {/* Aspect Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
            {t('aspectRatio')}
          </div>

          {/* Aspect preview */}
          <div className="rounded-xl bg-image-surface-card border border-white/5 mb-3">
            <AspectPreview w={selectedAspect.w} h={selectedAspect.h} />
          </div>

          {/* Aspect buttons */}
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {availableAspects.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleAspectSelect(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  aspectRatio === value
                    ? 'bg-image-primary text-white shadow-image-neon'
                    : 'bg-image-surface-card border border-white/5 text-content-secondary hover:border-image-primary/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* DALL-E 3: Quality */}
        {isDalle3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('quality')}
            </div>
            <div className="space-y-2">
              {QUALITY_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setQuality(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    quality === value
                      ? 'bg-image-surface-elevated border-2 border-image-primary shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 hover:border-image-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {quality === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-image-primary/20 text-image-primary font-medium shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t(descKey as any)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* DALL-E 3: Style */}
        {isDalle3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('style')}
            </div>
            <div className="space-y-2">
              {STYLE_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setStyle(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    style === value
                      ? 'bg-image-surface-elevated border-2 border-image-primary shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 hover:border-image-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {style === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-image-primary/20 text-image-primary font-medium shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t(descKey as any)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Midjourney: Version */}
        {isMidjourney && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('version')}
            </div>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {VERSION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setVersion(value);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    version === value
                      ? 'bg-image-primary text-white shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 text-content-secondary hover:border-image-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Midjourney: Stylize */}
        {isMidjourney && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('stylize')}
            </div>
            <div className="space-y-2">
              {STYLIZE_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setStylize(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    stylize === value
                      ? 'bg-image-surface-elevated border-2 border-image-primary shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 hover:border-image-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {stylize === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-image-primary/20 text-image-primary font-medium shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t(descKey as any)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Midjourney: Speed Mode */}
        {isMidjourney && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('speed')}
            </div>
            <div className="space-y-2">
              {SPEED_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setSpeed(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    speed === value
                      ? 'bg-image-surface-elevated border-2 border-image-primary shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 hover:border-image-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {speed === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-image-primary/20 text-image-primary font-medium shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t(descKey as any)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Midjourney: Weirdness */}
        {isMidjourney && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-2">
              {t('weirdness')}
            </div>
            <p className="text-xs text-content-tertiary mb-3">
              {t('weirdnessDesc')}
            </p>
            <div className="rounded-xl bg-image-surface-card border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-content-tertiary">0</span>
                <span className="text-sm font-semibold text-image-primary">{weirdness}</span>
                <span className="text-xs text-content-tertiary">3000</span>
              </div>
              <input
                type="range"
                min={0}
                max={3000}
                step={50}
                value={weirdness}
                onChange={(e) => {
                  setWeirdness(Number(e.target.value));
                  hapticImpact('light');
                }}
                className="w-full accent-image-primary"
              />
            </div>
          </motion.div>
        )}

        {/* Nano Banana Pro: Resolution */}
        {isNanoBananaPro && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('resolution')}
            </div>
            <div className="space-y-2">
              {RESOLUTION_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setResolution(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    resolution === value
                      ? 'bg-image-surface-elevated border-2 border-image-primary shadow-image-neon'
                      : 'bg-image-surface-card border border-white/5 hover:border-image-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {resolution === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-image-primary/20 text-image-primary font-medium shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t(descKey as any)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-image-surface via-image-surface to-transparent pt-8">
        <button
          onClick={handleSave}
          disabled={!hasChanged || isSaving}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            hasChanged && !isSaving
              ? 'bg-image-primary text-white shadow-image-neon hover:bg-image-primary-dark active:scale-[0.98]'
              : 'bg-white/5 text-content-tertiary cursor-not-allowed'
          }`}
        >
          {isSaving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
