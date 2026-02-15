import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { useImageSettingsStore } from '@/features/image/store/imageSettingsStore';
import { useVideoSettingsStore } from '@/features/video/store/videoSettingsStore';
import { useAudioSettingsStore } from '@/features/audio/store/audioSettingsStore';
import type { ChatModel } from '@/services/api/chat.api';
import type { Category } from '../store/useCreateStore';

// ── Aspect ratio configs ─────────────────────────────────

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

const IMAGE_MODEL_ASPECTS: Record<string, string[]> = {
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
  'nano-banana-pro': ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
};

const VIDEO_MODEL_ASPECTS: Record<string, string[]> = {
  'kling': ['16:9', '9:16', '1:1'],
  'kling-pro': ['16:9', '9:16', '1:1'],
  'veo-fast': ['16:9', '9:16'],
  'veo': ['16:9', '9:16'],
  'sora': ['16:9', '9:16', '1:1'],
  'runway': ['16:9', '9:16'],
};

// ── Video config maps ────────────────────────────────────

const MODEL_DURATIONS: Record<string, { value: number; labelKey: string }[]> = {
  'veo-fast': [{ value: 5, labelKey: 'duration5s' }, { value: 8, labelKey: 'duration8s' }],
  'veo': [{ value: 5, labelKey: 'duration5s' }, { value: 8, labelKey: 'duration8s' }],
  'sora': [{ value: 2, labelKey: 'duration2s' }, { value: 4, labelKey: 'duration4s' }, { value: 6, labelKey: 'duration6s' }],
  'runway': [{ value: 5, labelKey: 'duration5s' }, { value: 10, labelKey: 'duration10s' }],
};

const MODEL_RESOLUTIONS: Record<string, { value: string; labelKey: string }[]> = {
  'veo-fast': [{ value: '720p', labelKey: 'resolution720p' }, { value: '1080p', labelKey: 'resolution1080p' }],
  'veo': [{ value: '720p', labelKey: 'resolution720p' }, { value: '1080p', labelKey: 'resolution1080p' }],
  'sora': [{ value: '480p', labelKey: 'resolution480p' }, { value: '720p', labelKey: 'resolution720p' }, { value: '1080p', labelKey: 'resolution1080p' }],
  'runway': [{ value: '720p', labelKey: 'resolution720p' }, { value: '1080p', labelKey: 'resolution1080p' }],
};

const VEO_MODELS = new Set(['veo-fast', 'veo']);

// ── Audio model → settings type mapping ──────────────────

const AUDIO_SETTINGS_TYPE: Record<string, 'elevenlabs' | 'suno' | 'soundgen'> = {
  'elevenlabs-tts': 'elevenlabs',
  'suno': 'suno',
  'bark': 'soundgen',
};

const SUNO_STYLE_PRESETS = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical', 'ambient'];

// ── Category color classes ───────────────────────────────

const CATEGORY_STYLES: Record<Category, {
  activeBg: string;
  activeText: string;
  sectionBg: string;
}> = {
  TEXT: { activeBg: 'bg-cyan-500', activeText: 'text-white', sectionBg: 'bg-cyan-500/5' },
  IMAGE: { activeBg: 'bg-purple-500', activeText: 'text-white', sectionBg: 'bg-purple-500/5' },
  VIDEO: { activeBg: 'bg-orange-500', activeText: 'text-white', sectionBg: 'bg-orange-500/5' },
  AUDIO: { activeBg: 'bg-emerald-500', activeText: 'text-white', sectionBg: 'bg-emerald-500/5' },
};

// ── Props ────────────────────────────────────────────────

interface ModelSettingsPanelProps {
  category: Category;
  model: ChatModel;
}

// ── Debounced save hook ──────────────────────────────────

function useDebouncedSave(saveFn: () => void, delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(saveFn, delay);
  };
}

// ── Aspect Preview ───────────────────────────────────────

function AspectPreview({ w, h, category }: { w: number; h: number; category: Category }) {
  const maxSize = 56;
  const ratio = w / h;
  const pw = ratio >= 1 ? maxSize : maxSize * ratio;
  const ph = ratio >= 1 ? maxSize / ratio : maxSize;
  return (
    <motion.div
      key={`${w}:${h}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn('border-2 border-dashed rounded-lg flex items-center justify-center',
        category === 'IMAGE' ? 'border-purple-400/60' :
        category === 'VIDEO' ? 'border-orange-400/60' : 'border-cyan-400/60'
      )}
      style={{ width: pw, height: ph }}
    >
      <span className={cn('text-[10px] font-medium',
        category === 'IMAGE' ? 'text-purple-400' :
        category === 'VIDEO' ? 'text-orange-400' : 'text-cyan-400'
      )}>{w}:{h}</span>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────

export const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({ category, model }) => {
  const { t } = useTranslation(['create', 'image', 'video', 'audio']);
  const [isOpen, setIsOpen] = useState(false);
  const slug = model.slug;
  const colors = CATEGORY_STYLES[category];

  const hasSettings = category !== 'TEXT' && (
    category === 'IMAGE' ||
    category === 'VIDEO' ||
    (category === 'AUDIO' && slug in AUDIO_SETTINGS_TYPE)
  );

  if (!hasSettings) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full px-3 py-2 rounded-xl text-xs font-medium transition-all',
          'border border-white/[0.08] hover:border-white/[0.15]',
          isOpen ? colors.sectionBg : 'bg-surface-card/50',
          'text-content-secondary hover:text-white',
        )}
        style={{ columnGap: 6 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="flex-1 text-left">{t('create:modelSettings')}</span>
        <svg
          className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {category === 'IMAGE' && <ImageSettingsInline slug={slug} category={category} />}
              {category === 'VIDEO' && <VideoSettingsInline slug={slug} category={category} />}
              {category === 'AUDIO' && <AudioSettingsInline slug={slug} category={category} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Shared UI ────────────────────────────────────────────

function OptionButton({
  active, onClick, children, category,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  category: Category;
}) {
  const colors = CATEGORY_STYLES[category];
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? cn(colors.activeBg, colors.activeText, 'shadow-sm')
          : 'bg-surface-card border border-white/[0.08] text-content-secondary hover:border-white/[0.15] hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function SettingLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-content-tertiary uppercase tracking-wider mb-2 font-medium">
      {children}
    </div>
  );
}

// ── IMAGE Settings ───────────────────────────────────────

function ImageSettingsInline({ slug, category }: { slug: string; category: Category }) {
  const { t } = useTranslation('image');
  const { settings, fetchModelSettings, updateModelSettings } = useImageSettingsStore();
  const serverSettings = settings[slug];

  const isDalle3 = slug === 'dall-e-3';
  const isMidjourney = slug === 'midjourney';
  const isNanoBanana = slug === 'nano-banana-pro';

  const availableAspects = useMemo(
    () => ALL_ASPECTS.filter(a => (IMAGE_MODEL_ASPECTS[slug] || ['1:1']).includes(a.value)),
    [slug]
  );

  // Local state for instant UI
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('vivid');
  const [version, setVersion] = useState('v6.1');
  const [stylize, setStylize] = useState(100);
  const [resolution, setResolution] = useState('1K');

  // Fetch settings once
  useEffect(() => {
    if (!settings[slug]) fetchModelSettings(slug);
  }, [slug]);

  // Sync local state from server when loaded
  useEffect(() => {
    if (serverSettings) {
      setAspectRatio(serverSettings.aspectRatio || '1:1');
      if (isDalle3) {
        setQuality(serverSettings.quality || 'standard');
        setStyle(serverSettings.style || 'vivid');
      }
      if (isMidjourney) {
        setVersion(serverSettings.version || 'v6.1');
        setStylize(serverSettings.stylize ?? 100);
      }
      if (isNanoBanana) {
        setResolution(serverSettings.resolution || '1K');
      }
    }
  }, [serverSettings, isDalle3, isMidjourney, isNanoBanana]);

  // Debounced save to API
  const pendingUpdates = useRef<Record<string, unknown>>({});
  const save = useDebouncedSave(() => {
    if (Object.keys(pendingUpdates.current).length > 0) {
      updateModelSettings(slug, pendingUpdates.current).catch(() => {});
      pendingUpdates.current = {};
    }
  });

  const update = (key: string, value: unknown) => {
    pendingUpdates.current[key] = value;
    save();
  };

  const selectedAspect = ALL_ASPECTS.find(a => a.value === aspectRatio) || ALL_ASPECTS[0];

  return (
    <div className="space-y-4">
      {availableAspects.length > 1 && (
        <div>
          <SettingLabel>{t('aspectRatio')}</SettingLabel>
          <div className="flex items-center" style={{ columnGap: 12 }}>
            <AspectPreview w={selectedAspect.w} h={selectedAspect.h} category={category} />
            <div className="flex-1 flex flex-wrap" style={{ rowGap: 6, columnGap: 6 }}>
              {availableAspects.map(({ value, label }) => (
                <OptionButton key={value} active={aspectRatio === value} onClick={() => { setAspectRatio(value); update('aspectRatio', value); }} category={category}>
                  {label}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDalle3 && (
        <div>
          <SettingLabel>{t('quality')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            <OptionButton active={quality === 'standard'} onClick={() => { setQuality('standard'); update('quality', 'standard'); }} category={category}>
              ⚡ {t('qualityStandard')}
            </OptionButton>
            <OptionButton active={quality === 'hd'} onClick={() => { setQuality('hd'); update('quality', 'hd'); }} category={category}>
              ✨ {t('qualityHD')}
            </OptionButton>
          </div>
        </div>
      )}

      {isDalle3 && (
        <div>
          <SettingLabel>{t('style')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            <OptionButton active={style === 'vivid'} onClick={() => { setStyle('vivid'); update('style', 'vivid'); }} category={category}>
              🎨 {t('styleVivid')}
            </OptionButton>
            <OptionButton active={style === 'natural'} onClick={() => { setStyle('natural'); update('style', 'natural'); }} category={category}>
              🍃 {t('styleNatural')}
            </OptionButton>
          </div>
        </div>
      )}

      {isMidjourney && (
        <div>
          <SettingLabel>{t('version')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            {['v5.2', 'v6.1', 'v7'].map(v => (
              <OptionButton key={v} active={version === v} onClick={() => { setVersion(v); update('version', v); }} category={category}>
                {v}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {isMidjourney && (
        <div>
          <SettingLabel>{t('stylize')}</SettingLabel>
          <div className="flex flex-wrap" style={{ rowGap: 6, columnGap: 6 }}>
            {([
              { v: 50, k: 'stylizeLow', icon: '🔅' },
              { v: 100, k: 'stylizeMedium', icon: '🔆' },
              { v: 250, k: 'stylizeHigh', icon: '✨' },
              { v: 750, k: 'stylizeMax', icon: '💎' },
            ] as const).map(({ v, k, icon }) => (
              <OptionButton key={v} active={stylize === v} onClick={() => { setStylize(v); update('stylize', v); }} category={category}>
                {icon} {t(k)}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {isNanoBanana && (
        <div>
          <SettingLabel>{t('resolution')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            {([
              { v: '1K', icon: '📱' },
              { v: '2K', icon: '🖥️' },
              { v: '4K', icon: '🎬' },
            ] as const).map(({ v, icon }) => (
              <OptionButton key={v} active={resolution === v} onClick={() => { setResolution(v); update('resolution', v); }} category={category}>
                {icon} {v}
              </OptionButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── VIDEO Settings ───────────────────────────────────────

function VideoSettingsInline({ slug, category }: { slug: string; category: Category }) {
  const { t } = useTranslation('video');
  const { settings, fetchModelSettings, updateModelSettings } = useVideoSettingsStore();
  const serverSettings = settings[slug];

  const availableAspects = useMemo(
    () => ALL_ASPECTS.filter(a => (VIDEO_MODEL_ASPECTS[slug] || ['16:9']).includes(a.value)),
    [slug]
  );

  const durations = MODEL_DURATIONS[slug];
  const resolutions = MODEL_RESOLUTIONS[slug];
  const hasAudio = VEO_MODELS.has(slug);

  // Local state
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState<number | undefined>(durations?.[0]?.value);
  const [resolution, setResolution] = useState<string | undefined>(resolutions?.[0]?.value);
  const [generateAudio, setGenerateAudio] = useState(false);

  useEffect(() => {
    if (!settings[slug]) fetchModelSettings(slug);
  }, [slug]);

  useEffect(() => {
    if (serverSettings) {
      setAspectRatio(serverSettings.aspectRatio || '16:9');
      if (serverSettings.duration !== undefined) setDuration(serverSettings.duration);
      if (serverSettings.resolution !== undefined) setResolution(serverSettings.resolution);
      setGenerateAudio(serverSettings.generateAudio ?? false);
    }
  }, [serverSettings]);

  const pendingUpdates = useRef<Record<string, unknown>>({});
  const save = useDebouncedSave(() => {
    if (Object.keys(pendingUpdates.current).length > 0) {
      updateModelSettings(slug, pendingUpdates.current).catch(() => {});
      pendingUpdates.current = {};
    }
  });

  const update = (key: string, value: unknown) => {
    pendingUpdates.current[key] = value;
    save();
  };

  const selectedAspect = ALL_ASPECTS.find(a => a.value === aspectRatio) || ALL_ASPECTS.find(a => a.value === '16:9')!;

  return (
    <div className="space-y-4">
      {availableAspects.length > 1 && (
        <div>
          <SettingLabel>{t('aspectRatio')}</SettingLabel>
          <div className="flex items-center" style={{ columnGap: 12 }}>
            <AspectPreview w={selectedAspect.w} h={selectedAspect.h} category={category} />
            <div className="flex flex-wrap" style={{ rowGap: 6, columnGap: 6 }}>
              {availableAspects.map(({ value, label }) => (
                <OptionButton key={value} active={aspectRatio === value} onClick={() => { setAspectRatio(value); update('aspectRatio', value); }} category={category}>
                  {label}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {durations && (
        <div>
          <SettingLabel>{t('duration')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            {durations.map(({ value: v, labelKey }) => (
              <OptionButton key={v} active={duration === v} onClick={() => { setDuration(v); update('duration', v); }} category={category}>
                {t(labelKey as any)}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {resolutions && (
        <div>
          <SettingLabel>{t('resolution')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            {resolutions.map(({ value: v, labelKey }) => (
              <OptionButton key={v} active={resolution === v} onClick={() => { setResolution(v); update('resolution', v); }} category={category}>
                {t(labelKey as any)}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {hasAudio && (
        <div>
          <SettingLabel>{t('generateAudio')}</SettingLabel>
          <div className="flex" style={{ columnGap: 6 }}>
            <OptionButton active={generateAudio === true} onClick={() => { setGenerateAudio(true); update('generateAudio', true); }} category={category}>
              🔊 {t('audioOn')}
            </OptionButton>
            <OptionButton active={generateAudio === false} onClick={() => { setGenerateAudio(false); update('generateAudio', false); }} category={category}>
              🔇 {t('audioOff')}
            </OptionButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AUDIO Settings ───────────────────────────────────────

function AudioSettingsInline({ slug, category }: { slug: string; category: Category }) {
  const settingsType = AUDIO_SETTINGS_TYPE[slug];
  if (!settingsType) return null;

  if (settingsType === 'elevenlabs') return <ElevenLabsInline category={category} />;
  if (settingsType === 'suno') return <SunoInline category={category} />;
  if (settingsType === 'soundgen') return <SoundGenInline />;
  return null;
}

function ElevenLabsInline({ category }: { category: Category }) {
  const { t } = useTranslation('audio');
  const { elevenLabsSettings, voices, voicesLoading, fetchSettings, fetchVoices, updateElevenLabs } = useAudioSettingsStore();
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!elevenLabsSettings) fetchSettings();
    if (voices.length === 0) fetchVoices();
  }, []);

  useEffect(() => {
    if (elevenLabsSettings) {
      setSelectedVoice({ id: elevenLabsSettings.voiceId, name: elevenLabsSettings.voiceName });
    }
  }, [elevenLabsSettings]);

  const displayVoices = voices.slice(0, 8);

  const handleSelect = (voiceId: string, voiceName: string) => {
    setSelectedVoice({ id: voiceId, name: voiceName });
    updateElevenLabs({ voiceId, voiceName }).catch(() => {});
  };

  return (
    <div className="space-y-3">
      <div>
        <SettingLabel>{t('currentVoice')}</SettingLabel>
        <div className="text-sm text-white font-medium">{selectedVoice?.name || t('noVoiceSelected')}</div>
      </div>

      {!voicesLoading && displayVoices.length > 0 && (
        <div className="flex flex-wrap" style={{ rowGap: 6, columnGap: 6 }}>
          {displayVoices.map((voice) => (
            <OptionButton
              key={voice.voiceId}
              active={selectedVoice?.id === voice.voiceId}
              onClick={() => handleSelect(voice.voiceId, voice.name)}
              category={category}
            >
              {voice.name}
            </OptionButton>
          ))}
        </div>
      )}

      {voicesLoading && (
        <div className="flex" style={{ columnGap: 6 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-7 w-16 rounded-lg bg-surface-card animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

function SunoInline({ category }: { category: Category }) {
  const { t } = useTranslation('audio');
  const { sunoSettings, fetchSettings, updateSuno } = useAudioSettingsStore();
  const [mode, setMode] = useState<string>('standard');
  const [styleInput, setStyleInput] = useState('');

  useEffect(() => {
    if (!sunoSettings) fetchSettings();
  }, []);

  useEffect(() => {
    if (sunoSettings) {
      setMode(sunoSettings.mode || 'standard');
      setStyleInput(sunoSettings.style || '');
    }
  }, [sunoSettings]);

  const handleModeChange = (m: string) => {
    setMode(m);
    updateSuno({ mode: m as 'custom' | 'standard' | 'instrumental' }).catch(() => {});
  };

  const handleStyleBlur = () => {
    if (styleInput !== sunoSettings?.style) {
      updateSuno({ style: styleInput }).catch(() => {});
    }
  };

  const togglePreset = (preset: string) => {
    const current = styleInput ? styleInput.split(',').map(s => s.trim()).filter(Boolean) : [];
    const idx = current.indexOf(preset);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(preset);
    const newStyle = current.join(', ');
    setStyleInput(newStyle);
    updateSuno({ style: newStyle }).catch(() => {});
  };

  const styleList = styleInput ? styleInput.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-4">
      <div>
        <SettingLabel>{t('mode')}</SettingLabel>
        <div className="flex flex-wrap" style={{ rowGap: 6, columnGap: 6 }}>
          {([
            { v: 'custom', icon: '✍️' },
            { v: 'standard', icon: '🎵' },
            { v: 'instrumental', icon: '🎹' },
          ] as const).map(({ v, icon }) => (
            <OptionButton key={v} active={mode === v} onClick={() => handleModeChange(v)} category={category}>
              {icon} {t(`mode${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
            </OptionButton>
          ))}
        </div>
      </div>

      <div>
        <SettingLabel>{t('style')}</SettingLabel>
        <input
          type="text"
          value={styleInput}
          onChange={(e) => setStyleInput(e.target.value)}
          onBlur={handleStyleBlur}
          placeholder={t('stylePlaceholder')}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-white/[0.08] text-white text-xs placeholder-content-secondary outline-none focus:border-emerald-400/40 transition-colors"
        />
        <div className="flex flex-wrap mt-2" style={{ rowGap: 4, columnGap: 4 }}>
          {SUNO_STYLE_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => togglePreset(preset)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-all border',
                styleList.includes(preset)
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
                  : 'border-white/[0.06] text-content-tertiary hover:text-content-secondary',
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SoundGenInline() {
  const { t } = useTranslation('audio');
  const { soundGenSettings, fetchSettings, updateSoundGen } = useAudioSettingsStore();
  const [textTemp, setTextTemp] = useState(0.7);
  const [waveformTemp, setWaveformTemp] = useState(0.7);

  useEffect(() => {
    if (!soundGenSettings) fetchSettings();
  }, []);

  useEffect(() => {
    if (soundGenSettings) {
      setTextTemp(soundGenSettings.textTemp ?? 0.7);
      setWaveformTemp(soundGenSettings.waveformTemp ?? 0.7);
    }
  }, [soundGenSettings]);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const debouncedSave = (updates: Record<string, number>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateSoundGen(updates).catch(() => {});
    }, 500);
  };

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <SettingLabel>{t('textTemp')}</SettingLabel>
          <span className="text-[10px] text-content-tertiary tabular-nums">{textTemp.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={textTemp}
          onChange={(e) => { const v = parseFloat(e.target.value); setTextTemp(v); debouncedSave({ textTemp: v, waveformTemp }); }}
          className="w-full h-1.5 rounded-full bg-surface-card appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <SettingLabel>{t('waveformTemp')}</SettingLabel>
          <span className="text-[10px] text-content-tertiary tabular-nums">{waveformTemp.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={waveformTemp}
          onChange={(e) => { const v = parseFloat(e.target.value); setWaveformTemp(v); debouncedSave({ textTemp, waveformTemp: v }); }}
          className="w-full h-1.5 rounded-full bg-surface-card appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
}
