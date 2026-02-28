import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { closeTelegramWebApp } from '@/services/telegram/telegram';
import { useVideoSettingsStore } from '@/features/video/store/videoSettingsStore';
import { Skeleton } from '@/shared/ui';
import { calculateDynamicCost, formatCost } from '@/shared/utils/dynamicPricing';
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
];

const MODEL_ASPECTS: Record<string, string[]> = {
  'kling': ['16:9', '9:16', '1:1'],
  'kling-pro': ['16:9', '9:16', '1:1'],
  'kling-3.0': ['16:9', '9:16', '1:1'],
  'veo-fast': ['16:9', '9:16'],
  'veo': ['16:9', '9:16'],
  'sora': ['16:9', '9:16', '1:1'],
  'sora-pro': ['16:9', '9:16', '1:1'],
  'runway': ['16:9', '9:16'],
  'runway-gen4': ['16:9', '9:16'],
  'seedance': ['16:9', '9:16', '1:1'],
  'seedance-lite': ['16:9', '9:16', '1:1'],
  'seedance-1-pro': ['16:9', '9:16', '1:1'],
  'seedance-fast': ['16:9', '9:16', '1:1'],
};

interface DurationOption {
  value: number;
  labelKey: string;
}

const MODEL_DURATIONS: Record<string, DurationOption[]> = {
  'kling': [
    { value: 5, labelKey: 'duration5s' },
    { value: 10, labelKey: 'duration10s' },
  ],
  'kling-pro': [
    { value: 5, labelKey: 'duration5s' },
    { value: 10, labelKey: 'duration10s' },
  ],
  'kling-3.0': [
    { value: 3, labelKey: 'duration3s' },
    { value: 5, labelKey: 'duration5s' },
    { value: 8, labelKey: 'duration8s' },
    { value: 10, labelKey: 'duration10s' },
    { value: 15, labelKey: 'duration15s' },
  ],
  'veo-fast': [
    { value: 5, labelKey: 'duration5s' },
    { value: 8, labelKey: 'duration8s' },
  ],
  'veo': [
    { value: 5, labelKey: 'duration5s' },
    { value: 8, labelKey: 'duration8s' },
  ],
  'sora': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
    { value: 10, labelKey: 'duration10s' },
    { value: 12, labelKey: 'duration12s' },
    { value: 15, labelKey: 'duration15s' },
  ],
  'sora-pro': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
    { value: 10, labelKey: 'duration10s' },
    { value: 12, labelKey: 'duration12s' },
    { value: 15, labelKey: 'duration15s' },
  ],
  'runway': [
    { value: 5, labelKey: 'duration5s' },
    { value: 10, labelKey: 'duration10s' },
  ],
  'runway-gen4': [
    { value: 5, labelKey: 'duration5s' },
    { value: 10, labelKey: 'duration10s' },
  ],
  'seedance': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
    { value: 12, labelKey: 'duration12s' },
  ],
  'seedance-lite': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
  ],
  'seedance-1-pro': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
  ],
  'seedance-fast': [
    { value: 4, labelKey: 'duration4s' },
    { value: 8, labelKey: 'duration8s' },
  ],
};

interface ResolutionOption {
  value: string;
  labelKey: string;
  descKey: string;
  icon: string;
}

const MODEL_RESOLUTIONS: Record<string, ResolutionOption[]> = {
  'kling-motion': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'veo-fast': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
    { value: '4K', labelKey: 'resolution4K', descKey: 'resolution4KDesc', icon: '📐' },
  ],
  'veo': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
    { value: '4K', labelKey: 'resolution4K', descKey: 'resolution4KDesc', icon: '📐' },
  ],
  'sora': [
    { value: '480p', labelKey: 'resolution480p', descKey: 'resolution480pDesc', icon: '📱' },
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'sora-pro': [
    { value: '480p', labelKey: 'resolution480p', descKey: 'resolution480pDesc', icon: '📱' },
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'runway': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'runway-gen4': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'seedance': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'seedance-1-pro': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
  'seedance-fast': [
    { value: '720p', labelKey: 'resolution720p', descKey: 'resolution720pDesc', icon: '📺' },
    { value: '1080p', labelKey: 'resolution1080p', descKey: 'resolution1080pDesc', icon: '🎬' },
  ],
};

const AUDIO_MODELS = ['veo-fast', 'veo'];

const VEO_MODELS = ['veo-fast', 'veo'];

const SEEDANCE_MODELS = ['seedance', 'seedance-lite', 'seedance-1-pro', 'seedance-fast'];

interface ModeOption {
  value: string;
  labelKey: string;
  descKey: string;
  icon: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { value: 'text', labelKey: 'modeText', descKey: 'modeTextDesc', icon: '✏️' },
  { value: 'frames', labelKey: 'modeFrames', descKey: 'modeFramesDesc', icon: '🖼️' },
  { value: 'ingredients', labelKey: 'modeIngredients', descKey: 'modeIngredientsDesc', icon: '🧩' },
];

// ── Kling-specific config ──────────────────────────────────

const KLING_MODELS = ['kling', 'kling-pro'];
const KLING_30_MODEL = 'kling-3.0';
const KLING_MOTION_MODEL = 'kling-motion';
const KLING_VERSIONS_STD = ['2.6', '2.5', '2.1', '1.6', '1.5'];
const KLING_VERSIONS_PRO = ['2.6', '2.5', '2.1', '2.1-master', '1.6', '1.5'];

// ── Components ─────────────────────────────────────────────

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
        className="border-2 border-dashed border-video-primary/60 rounded-lg flex items-center justify-center"
        style={{
          width: previewW,
          height: previewH,
        }}
      >
        <span className="text-xs text-video-primary font-medium">{w}:{h}</span>
      </motion.div>
    </div>
  );
}

export default function VideoSettingsPage() {
  const { t } = useTranslation('video');
  const [searchParams] = useSearchParams();
  const modelSlug = searchParams.get('model') || 'kling';

  const {
    settings,
    isLoading,
    isSaving,
    fetchModelSettings,
    updateModelSettings,
  } = useVideoSettingsStore();

  const modelSettings = settings[modelSlug];
  const hasDuration = !!MODEL_DURATIONS[modelSlug];
  const hasResolution = !!MODEL_RESOLUTIONS[modelSlug];
  const hasAudio = AUDIO_MODELS.includes(modelSlug);
  const isVeo = VEO_MODELS.includes(modelSlug);
  const isRunway = modelSlug === 'runway' || modelSlug === 'runway-gen4';
  const isSeedance = SEEDANCE_MODELS.includes(modelSlug);
  const isKling = KLING_MODELS.includes(modelSlug);
  const isKling30 = modelSlug === KLING_30_MODEL;
  const isKlingMotion = modelSlug === KLING_MOTION_MODEL;
  const hasAspect = !!MODEL_ASPECTS[modelSlug];
  const klingMode: 'std' | 'pro' = modelSlug === 'kling-pro' ? 'pro' : 'std';
  const availableVersions = modelSlug === 'kling-pro' ? KLING_VERSIONS_PRO : KLING_VERSIONS_STD;

  const availableAspects = useMemo(
    () => ALL_ASPECTS.filter(a => (MODEL_ASPECTS[modelSlug] || ['16:9']).includes(a.value)),
    [modelSlug]
  );

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  // Veo mode state
  const [mode, setMode] = useState('text');
  // Seedance-specific state
  const [cameraFixed, setCameraFixed] = useState(false);
  // Kling-specific state
  const [version, setVersion] = useState('2.6');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [cfgScale, setCfgScale] = useState(0.5);
  const [enableAudio, setEnableAudio] = useState(false);
  // Kling 3.0 state
  const [qualityMode, setQualityMode] = useState('std');
  const [sound, setSound] = useState(true);
  // Motion Control state
  const [characterOrientation, setCharacterOrientation] = useState('video');

  useEffect(() => {
    fetchModelSettings(modelSlug);
  }, [modelSlug]);

  useEffect(() => {
    if (modelSettings) {
      setAspectRatio(modelSettings.aspectRatio || '16:9');
      if (hasDuration) {
        setDuration(modelSettings.duration ?? (MODEL_DURATIONS[modelSlug]?.[0]?.value || 5));
      }
      if (hasResolution) {
        setResolution(modelSettings.resolution || '720p');
      }
      if (hasAudio) {
        setGenerateAudio(modelSettings.generateAudio ?? true);
      }
      if (isVeo) {
        setMode(modelSettings.mode || 'text');
      }
      if (isSeedance) {
        setCameraFixed(modelSettings.cameraFixed ?? false);
      }
      if (isKling) {
        setVersion(modelSettings.version || '2.6');
        setNegativePrompt(modelSettings.negativePrompt || '');
        setCfgScale(modelSettings.cfgScale ?? 0.5);
        setEnableAudio(modelSettings.enableAudio ?? false);
        setDuration(modelSettings.duration ?? 5);
      }
      if (isKling30) {
        setQualityMode(modelSettings.qualityMode || 'std');
        setSound(modelSettings.sound ?? true);
        setDuration(modelSettings.duration ?? 5);
      }
      if (isKlingMotion) {
        setCharacterOrientation(modelSettings.characterOrientation || 'video');
      }
    }
  }, [modelSettings, hasDuration, hasResolution, hasAudio, isVeo, isSeedance, isKling, isKling30, isKlingMotion, modelSlug]);

  // Auto-disable audio when switching away from v2.6
  useEffect(() => {
    if (version !== '2.6') {
      setEnableAudio(false);
    }
  }, [version]);

  const selectedAspect = ALL_ASPECTS.find(a => a.value === aspectRatio) || ALL_ASPECTS[1];

  // Runway constraint: 10s + 1080p not allowed (both Gen-4 and Gen-4 Turbo)
  const showRunwayWarning = isRunway && duration === 10 && resolution === '1080p';

  // Dynamic cost preview for all video models
  const estimatedCost = useMemo(() => {
    return calculateDynamicCost(modelSlug, {
      duration,
      resolution,
      version,
      enableAudio: enableAudio && version === '2.6' && klingMode === 'pro',
    });
  }, [modelSlug, duration, resolution, version, enableAudio, klingMode, qualityMode]);

  const hasChanged = (() => {
    if (hasAspect) {
      const origAspect = modelSettings?.aspectRatio || '16:9';
      if (aspectRatio !== origAspect) return true;
    }
    if (hasDuration && !isKling && !isKling30 && duration !== (modelSettings?.duration ?? (MODEL_DURATIONS[modelSlug]?.[0]?.value || 5))) return true;
    if (hasResolution && !isKlingMotion && resolution !== (modelSettings?.resolution || '720p')) return true;
    if (hasAudio && generateAudio !== (modelSettings?.generateAudio ?? true)) return true;
    if (isVeo && mode !== (modelSettings?.mode || 'text')) return true;
    if (isSeedance && cameraFixed !== (modelSettings?.cameraFixed ?? false)) return true;
    if (isKling) {
      if (version !== (modelSettings?.version || '2.6')) return true;
      if (negativePrompt !== (modelSettings?.negativePrompt || '')) return true;
      if (cfgScale !== (modelSettings?.cfgScale ?? 0.5)) return true;
      if (enableAudio !== (modelSettings?.enableAudio ?? false)) return true;
      if (duration !== (modelSettings?.duration ?? 5)) return true;
    }
    if (isKling30) {
      if (qualityMode !== (modelSettings?.qualityMode || 'std')) return true;
      if (sound !== (modelSettings?.sound ?? true)) return true;
      if (duration !== (modelSettings?.duration ?? 5)) return true;
    }
    if (isKlingMotion) {
      if (characterOrientation !== (modelSettings?.characterOrientation || 'video')) return true;
      if (resolution !== (modelSettings?.resolution || '720p')) return true;
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
      const updates: Record<string, unknown> = {};
      if (hasAspect) updates.aspectRatio = aspectRatio;
      if (hasDuration && !isKling && !isKling30) updates.duration = duration;
      if (hasResolution && !isKlingMotion) updates.resolution = resolution;
      if (hasAudio) updates.generateAudio = generateAudio;
      if (isVeo) updates.mode = mode;
      if (isSeedance) updates.cameraFixed = cameraFixed;
      if (isKling) {
        updates.aspectRatio = aspectRatio;
        updates.version = version;
        updates.duration = duration;
        updates.negativePrompt = negativePrompt;
        updates.cfgScale = cfgScale;
        updates.enableAudio = enableAudio;
      }
      if (isKling30) {
        updates.aspectRatio = aspectRatio;
        updates.duration = duration;
        updates.qualityMode = qualityMode;
        updates.sound = sound;
      }
      if (isKlingMotion) {
        updates.resolution = resolution;
        updates.characterOrientation = characterOrientation;
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
            <span className="text-video-primary">🎬</span>{' '}
            {t('settings')}{' '}
            <span className="bg-gradient-to-r from-video-primary to-video-primary-light bg-clip-text text-transparent">
              {modelName}
            </span>
          </h1>
        </motion.div>

        {/* ── Kling: Version Selector ── */}
        {isKling && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('version')}
            </div>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {availableVersions.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    hapticImpact('light');
                    setVersion(v);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    version === v
                      ? 'bg-video-primary text-white shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 text-content-secondary hover:border-video-primary/30'
                  }`}
                >
                  {t(`versionNames.${v}` as any, v)}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Duration (for Kling and other models with duration) */}
        {hasDuration && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('duration')}
            </div>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {MODEL_DURATIONS[modelSlug]?.map(({ value, labelKey }) => (
                <button
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setDuration(value);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === value
                      ? 'bg-video-primary text-white shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 text-content-secondary hover:border-video-primary/30'
                  }`}
                >
                  {t(labelKey as any)}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Aspect Ratio */}
        {hasAspect && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isKling ? 0.15 : 0.05 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('aspectRatio')}
            </div>

            <div className="rounded-xl bg-video-surface-card border border-white/5 mb-3">
              <AspectPreview w={selectedAspect.w} h={selectedAspect.h} />
            </div>

            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {availableAspects.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleAspectSelect(value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    aspectRatio === value
                      ? 'bg-video-primary text-white shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 text-content-secondary hover:border-video-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Kling: Negative Prompt ── */}
        {isKling && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('negativePrompt')}
            </div>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t('negativePromptPlaceholder')}
              rows={2}
              maxLength={2500}
              className="w-full rounded-xl bg-video-surface-card border border-white/5 text-content-primary text-sm p-3 placeholder:text-content-tertiary focus:border-video-primary/50 focus:outline-none resize-none"
            />
          </motion.div>
        )}

        {/* ── Kling: Creativity (cfg_scale) ── */}
        {isKling && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('creativity')}
            </div>
            <div className="rounded-xl bg-video-surface-card border border-white/5 p-4">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={cfgScale}
                onChange={(e) => {
                  hapticImpact('light');
                  setCfgScale(parseFloat(e.target.value));
                }}
                className="w-full accent-video-primary"
              />
              <div className="flex justify-between text-xs text-content-tertiary mt-2">
                <span>{t('creativityLow')}</span>
                <span className="text-video-primary font-semibold">{cfgScale.toFixed(1)}</span>
                <span>{t('creativityHigh')}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Kling: Audio Toggle (v2.6 Pro only) ── */}
        {isKling && klingMode === 'pro' && version === '2.6' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('enableAudio')}
            </div>
            <div
              onClick={() => {
                hapticImpact('light');
                setEnableAudio(!enableAudio);
              }}
              className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                enableAudio
                  ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                  : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ columnGap: 10 }}>
                  <span className="text-lg">{enableAudio ? '🔊' : '🔇'}</span>
                  <div>
                    <span className="font-semibold text-content-primary text-sm">
                      {enableAudio ? t('audioOn') : t('audioOff')}
                    </span>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {t('enableAudioDesc')}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
                    enableAudio ? 'bg-video-primary' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                      enableAudio ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Kling 3.0: Quality Mode ── */}
        {isKling30 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('qualityMode')}
            </div>
            <div className="space-y-2">
              {([
                { value: 'std', labelKey: 'qualityStd', descKey: 'qualityStdDesc', icon: '⚡' },
                { value: 'pro', labelKey: 'qualityPro', descKey: 'qualityProDesc', icon: '💎' },
              ] as const).map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setQualityMode(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    qualityMode === value
                      ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {qualityMode === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-video-primary/20 text-video-primary font-medium shrink-0">
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

        {/* ── Kling 3.0: Sound Toggle ── */}
        {isKling30 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('soundGeneration')}
            </div>
            <div
              onClick={() => {
                hapticImpact('light');
                setSound(!sound);
              }}
              className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                sound
                  ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                  : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ columnGap: 10 }}>
                  <span className="text-lg">{sound ? '🔊' : '🔇'}</span>
                  <div>
                    <span className="font-semibold text-content-primary text-sm">
                      {sound ? t('soundOn') : t('soundOff')}
                    </span>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {t('soundDesc')}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
                    sound ? 'bg-video-primary' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                      sound ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Motion Control: Character Orientation ── */}
        {isKlingMotion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('characterOrientation')}
            </div>
            <div className="space-y-2">
              {([
                { value: 'image', labelKey: 'orientImage', descKey: 'orientImageDesc', icon: '🖼️' },
                { value: 'video', labelKey: 'orientVideo', descKey: 'orientVideoDesc', icon: '🎬' },
              ] as const).map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setCharacterOrientation(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    characterOrientation === value
                      ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {characterOrientation === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-video-primary/20 text-video-primary font-medium shrink-0">
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

        {/* Veo: Image Processing Mode */}
        {isVeo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('mode')}
            </div>
            <div className="space-y-2">
              {MODE_OPTIONS.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setMode(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    mode === value
                      ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {mode === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-video-primary/20 text-video-primary font-medium shrink-0">
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

        {/* Resolution (non-Kling models) */}
        {hasResolution && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('resolution')}
            </div>
            <div className="space-y-2">
              {MODEL_RESOLUTIONS[modelSlug]?.map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={value}
                  onClick={() => {
                    hapticImpact('light');
                    setResolution(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    resolution === value
                      ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-video-primary/20 text-video-primary font-medium shrink-0">
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

            {/* Runway constraint warning */}
            {showRunwayWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
              >
                <p className="text-xs text-amber-400">
                  ⚠️ {t('runwayWarning')}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Seedance: Camera Lock */}
        {isSeedance && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('cameraLock')}
            </div>
            <div
              onClick={() => {
                hapticImpact('light');
                setCameraFixed(!cameraFixed);
              }}
              className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                cameraFixed
                  ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                  : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ columnGap: 10 }}>
                  <span className="text-lg">{cameraFixed ? '🔒' : '🔓'}</span>
                  <div>
                    <span className="font-semibold text-content-primary text-sm">
                      {cameraFixed ? t('cameraLockOn') : t('cameraLockOff')}
                    </span>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {t('cameraLockDesc')}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
                    cameraFixed ? 'bg-video-primary' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                      cameraFixed ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Generate Audio (Veo only) */}
        {hasAudio && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <div className="text-xs text-content-tertiary uppercase tracking-wide mb-3">
              {t('generateAudio')}
            </div>
            <div className="space-y-2">
              {[
                { value: true, labelKey: 'audioOn', descKey: 'audioOnDesc', icon: '🔊' },
                { value: false, labelKey: 'audioOff', descKey: 'audioOffDesc', icon: '🔇' },
              ].map(({ value, labelKey, descKey, icon }) => (
                <div
                  key={String(value)}
                  onClick={() => {
                    hapticImpact('light');
                    setGenerateAudio(value);
                  }}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all ${
                    generateAudio === value
                      ? 'bg-video-surface-elevated border-2 border-video-primary shadow-video-neon'
                      : 'bg-video-surface-card border border-white/5 hover:border-video-primary/30'
                  }`}
                >
                  <div className="flex items-center" style={{ columnGap: 10 }}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ columnGap: 8 }}>
                        <span className="font-semibold text-content-primary text-sm">
                          {t(labelKey as any)}
                        </span>
                        {generateAudio === value && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-video-primary/20 text-video-primary font-medium shrink-0">
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

      {/* Fixed bottom area: cost preview + save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-video-surface via-video-surface to-transparent pt-8">
        {/* Estimated cost for all video models */}
        {estimatedCost > 0 && (
          <div className="mb-3 p-3 rounded-xl bg-video-surface-card border border-white/5 flex items-center justify-between">
            <span className="text-sm text-content-secondary">{t('estimatedCost')}</span>
            <span className="text-lg font-bold text-video-primary">
              ⚡{formatCost(estimatedCost)} {t('tokens')}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanged || isSaving}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            hasChanged && !isSaving
              ? 'bg-video-primary text-white shadow-video-neon hover:bg-video-primary-dark active:scale-[0.98]'
              : 'bg-white/5 text-content-tertiary cursor-not-allowed'
          }`}
        >
          {isSaving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
