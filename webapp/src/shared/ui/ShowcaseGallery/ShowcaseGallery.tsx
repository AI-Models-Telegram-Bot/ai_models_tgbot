import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { GenerativeArt, type ArtVariant } from '../GenerativeArt/GenerativeArt';
import createImage from '@/assets/showcase/create-image.jpg';
import createText from '@/assets/showcase/create-text.jpg';
import createVideoPoster from '@/assets/showcase/create-video.jpg';
import createAudioPoster from '@/assets/showcase/create-audio.jpg';
import createVideoClip from '@/assets/showcase/create-video.mp4';
import createAudioClip from '@/assets/showcase/create-audio.mp4';

/**
 * Showcase of what the bot can create — a bento grid of real, human-made
 * AI-generated media (stills + short looping clips), each labelled by modality.
 * Centerpiece "wow" surface that reads as the actual range of AI outputs.
 * GenerativeArt sits underneath every tile as an instant-paint / fallback poster.
 */

interface TileDef {
  variant: ArtVariant;
  key: 'image' | 'video' | 'audio' | 'text';
  /** still image OR poster frame for a clip */
  poster: string;
  /** optional looping video clip rendered over the poster */
  clip?: string;
}

const LABELS: Record<string, { ru: string; en: string }> = {
  image: { ru: 'Изображения', en: 'Images' },
  video: { ru: 'Видео', en: 'Video' },
  audio: { ru: 'Аудио', en: 'Audio' },
  text: { ru: 'Тексты', en: 'Text' },
};

const ModalityIcon: React.FC<{ kind: TileDef['key']; className?: string }> = ({ kind, className }) => {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'image':
      return (<svg viewBox="0 0 24 24" className={className} {...p}><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></svg>);
    case 'video':
      return (<svg viewBox="0 0 24 24" className={className} {...p}><rect x="3" y="5" width="14" height="14" rx="2.5" /><path d="M17 9.5 21 7v10l-4-2.5" /></svg>);
    case 'audio':
      return (<svg viewBox="0 0 24 24" className={className} {...p}><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="2.6" /><circle cx="17" cy="16" r="2.6" /></svg>);
    case 'text':
      return (<svg viewBox="0 0 24 24" className={className} {...p}><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5z" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></svg>);
  }
};

/** Lazily mount the clip only once the tile scrolls near the viewport. */
function useInView<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }),
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView };
}

const Tile: React.FC<{ tile: TileDef; lang: 'ru' | 'en'; className?: string; tall?: boolean }> = ({ tile, lang, className, tall }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn('group relative rounded-2xl border border-border overflow-hidden bg-surface-card', className)}>
      <GenerativeArt variant={tile.variant} className="absolute inset-0" drift={tall ? 22 : 16} />
      <img
        src={tile.poster}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
      />
      {tile.clip && inView && (
        <video
          src={tile.clip}
          poster={tile.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2" style={{ backgroundImage: 'linear-gradient(180deg, transparent, oklch(0.10 0.01 75 / 0.72))' }} />
      <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.12_0.01_75_/_0.55)] backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-content-primary">
          <ModalityIcon kind={tile.key} className="w-3.5 h-3.5" />
          {LABELS[tile.key][lang]}
        </span>
        {tile.clip && (
          <span aria-hidden className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-primary" />
          </span>
        )}
      </div>
    </div>
  );
};

const TILES: TileDef[] = [
  { variant: 'image', key: 'image', poster: createImage },
  { variant: 'video', key: 'video', poster: createVideoPoster, clip: createVideoClip },
  { variant: 'audio', key: 'audio', poster: createAudioPoster, clip: createAudioClip },
  { variant: 'text', key: 'text', poster: createText },
];

interface ShowcaseGalleryProps {
  className?: string;
  /** compact: 2x2 even grid; default: hero + grid */
  compact?: boolean;
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({ className, compact = false }) => {
  const { i18n } = useTranslation();
  const lang: 'ru' | 'en' = i18n.language.startsWith('ru') ? 'ru' : 'en';

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 gap-2.5', className)}>
        {TILES.map((t) => (
          <Tile key={t.key} tile={t} lang={lang} className="aspect-[4/3]" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      <Tile tile={TILES[0]} lang={lang} tall className="col-span-2 aspect-[16/10]" />
      <Tile tile={TILES[1]} lang={lang} className="aspect-square" />
      <Tile tile={TILES[2]} lang={lang} className="aspect-square" />
      <Tile tile={TILES[3]} lang={lang} className="col-span-2 aspect-[16/7]" />
    </div>
  );
};
