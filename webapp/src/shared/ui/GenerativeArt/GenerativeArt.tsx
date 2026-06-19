import React from 'react';
import { cn } from '@/shared/utils/cn';

/**
 * Code-generated "AI artwork" tiles — layered OKLCH gradient meshes with a fine
 * grain overlay and slow drift. License-clean, tiny, and fast in restricted
 * WebViews (no media download). Each variant is a distinct composition so a
 * gallery of them reads as a range of generated outputs, not repeated blobs.
 *
 * To swap in real generated photos/clips later: render an <img>/<video> on top
 * of the same tile (the art becomes the poster/skeleton).
 */

export type ArtVariant = 'image' | 'video' | 'audio' | 'text' | 'gold' | 'aurora';

interface GenerativeArtProps {
  variant: ArtVariant;
  className?: string;
  /** seconds for the drift animation; 0 disables motion */
  drift?: number;
  children?: React.ReactNode;
}

// Each variant: a stack of radial/conic gradients in a distinct hue family.
const LAYERS: Record<ArtVariant, string> = {
  image:
    'radial-gradient(120% 120% at 18% 12%, oklch(0.82 0.13 70 / 0.95) 0%, transparent 45%),' +
    'radial-gradient(100% 100% at 88% 22%, oklch(0.70 0.15 28 / 0.85) 0%, transparent 50%),' +
    'conic-gradient(from 210deg at 60% 80%, oklch(0.55 0.12 350 / 0.7), oklch(0.30 0.08 60 / 0.7), oklch(0.55 0.12 350 / 0.7)),' +
    'linear-gradient(150deg, oklch(0.22 0.03 60), oklch(0.16 0.02 40))',
  video:
    'radial-gradient(130% 130% at 80% 15%, oklch(0.80 0.13 200 / 0.9) 0%, transparent 48%),' +
    'radial-gradient(110% 110% at 12% 85%, oklch(0.60 0.14 255 / 0.85) 0%, transparent 52%),' +
    'conic-gradient(from 30deg at 30% 40%, oklch(0.45 0.10 220 / 0.6), oklch(0.28 0.06 260 / 0.6), oklch(0.45 0.10 220 / 0.6)),' +
    'linear-gradient(160deg, oklch(0.20 0.03 230), oklch(0.15 0.02 250))',
  audio:
    'radial-gradient(120% 120% at 22% 20%, oklch(0.78 0.15 320 / 0.92) 0%, transparent 46%),' +
    'radial-gradient(120% 120% at 85% 80%, oklch(0.66 0.16 290 / 0.85) 0%, transparent 50%),' +
    'conic-gradient(from 120deg at 70% 30%, oklch(0.50 0.13 330 / 0.6), oklch(0.30 0.08 300 / 0.6), oklch(0.50 0.13 330 / 0.6)),' +
    'linear-gradient(150deg, oklch(0.21 0.04 320), oklch(0.15 0.02 300))',
  text:
    'radial-gradient(120% 120% at 75% 18%, oklch(0.74 0.10 150 / 0.85) 0%, transparent 50%),' +
    'radial-gradient(120% 120% at 15% 80%, oklch(0.62 0.10 175 / 0.8) 0%, transparent 52%),' +
    'conic-gradient(from 250deg at 40% 60%, oklch(0.45 0.07 160 / 0.55), oklch(0.28 0.05 140 / 0.55), oklch(0.45 0.07 160 / 0.55)),' +
    'linear-gradient(155deg, oklch(0.20 0.03 150), oklch(0.15 0.02 160))',
  gold:
    'radial-gradient(120% 120% at 30% 18%, oklch(0.88 0.12 90 / 0.95) 0%, transparent 44%),' +
    'radial-gradient(120% 120% at 82% 78%, oklch(0.74 0.13 60 / 0.85) 0%, transparent 50%),' +
    'conic-gradient(from 200deg at 65% 45%, oklch(0.55 0.10 80 / 0.6), oklch(0.32 0.07 50 / 0.6), oklch(0.55 0.10 80 / 0.6)),' +
    'linear-gradient(150deg, oklch(0.23 0.04 70), oklch(0.16 0.02 55))',
  aurora:
    'radial-gradient(130% 130% at 20% 80%, oklch(0.78 0.14 160 / 0.9) 0%, transparent 48%),' +
    'radial-gradient(120% 120% at 85% 20%, oklch(0.72 0.15 300 / 0.85) 0%, transparent 50%),' +
    'conic-gradient(from 90deg at 50% 50%, oklch(0.55 0.12 200 / 0.55), oklch(0.45 0.10 320 / 0.55), oklch(0.55 0.12 200 / 0.55)),' +
    'linear-gradient(150deg, oklch(0.19 0.03 220), oklch(0.15 0.02 280))',
};

// Fine grain overlay (SVG turbulence as a data URI) — adds texture so gradients
// read as rendered artwork rather than flat fills.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const GenerativeArt: React.FC<GenerativeArtProps> = ({
  variant,
  className,
  drift = 18,
  children,
}) => {
  return (
    <div className={cn('relative overflow-hidden isolate', className)}>
      {/* gradient mesh */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: LAYERS[variant],
          backgroundSize: '180% 180%',
          animation: drift > 0 ? `art-drift ${drift}s ease-in-out infinite` : undefined,
        }}
      />
      {/* grain */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay opacity-[0.18] pointer-events-none"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }}
      />
      {/* top sheen for depth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(180deg, oklch(1 0 0 / 0.06), transparent 35%, oklch(0 0 0 / 0.25))' }}
      />
      {children}
    </div>
  );
};
