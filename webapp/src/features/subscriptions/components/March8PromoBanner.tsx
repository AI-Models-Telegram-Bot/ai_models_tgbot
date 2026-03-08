import React, { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getActivePromo } from '@/config/promoConfig';

// ── Reusable 3D wrapper with depth parallax ─────────────────────

interface Float3DProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  depth?: 'near' | 'mid' | 'far';
  rotateRange?: number;
}

const Float3D: React.FC<Float3DProps> = ({
  children,
  style,
  delay = 0,
  duration = 5,
  depth = 'mid',
  rotateRange = 12,
}) => {
  const depthScale = depth === 'near' ? 1.15 : depth === 'far' ? 0.7 : 0.9;
  const depthBlur = depth === 'far' ? 'blur(1px)' : 'none';

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        ...style,
        filter: depthBlur,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      initial={{ opacity: 0, scale: 0, rotateY: -60 }}
      animate={{
        opacity: 1,
        scale: depthScale,
        rotateY: [0, rotateRange, -rotateRange * 0.6, 0],
        rotateX: [0, -rotateRange * 0.5, rotateRange * 0.3, 0],
        rotateZ: [0, rotateRange * 0.2, -rotateRange * 0.15, 0],
        y: [0, -8 * depthScale, 4 * depthScale, -6 * depthScale],
        x: [0, 3 * depthScale, -2 * depthScale, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.8, delay, type: 'spring', bounce: 0.4 },
        rotateY: { duration, delay: delay + 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
        rotateX: { duration: duration * 1.1, delay: delay + 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
        rotateZ: { duration: duration * 0.9, delay: delay + 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
        y: { duration: duration * 0.8, delay: delay + 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
        x: { duration: duration * 1.2, delay: delay + 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.div>
  );
};

// ── SVG Icons with premium gradients ────────────────────────────

const Tulip3D: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 80" width={size} height={size * 1.25} style={{ filter: 'drop-shadow(0 6px 20px rgba(255,107,157,0.5))' }}>
    <defs>
      <linearGradient id="tulipPetal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff85b3" />
        <stop offset="100%" stopColor="#e91e63" />
      </linearGradient>
      <linearGradient id="tulipStem" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <radialGradient id="tulipGlow">
        <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ff6b9d" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="28" rx="20" ry="20" fill="url(#tulipGlow)" />
    <path d="M32 72 C31 72 30 50 32 35" stroke="url(#tulipStem)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M32 55 C24 52 19 46 22 40" fill="#22c55e" opacity="0.7" />
    <path d="M32 50 C38 48 42 43 40 38" fill="#16a34a" opacity="0.5" />
    <ellipse cx="24" cy="24" rx="10" ry="18" fill="url(#tulipPetal)" transform="rotate(-12 24 24)" opacity="0.9" />
    <ellipse cx="40" cy="24" rx="10" ry="18" fill="url(#tulipPetal)" transform="rotate(12 40 24)" opacity="0.85" />
    <ellipse cx="32" cy="22" rx="9" ry="19" fill="#ff4081" />
    <ellipse cx="29" cy="16" rx="3" ry="8" fill="white" opacity="0.15" />
  </svg>
);

const Rose3D: React.FC<{ size?: number }> = ({ size = 52 }) => (
  <svg viewBox="0 0 64 72" width={size} height={size * 1.125} style={{ filter: 'drop-shadow(0 6px 24px rgba(220,38,38,0.5))' }}>
    <defs>
      <radialGradient id="roseCenter" cx="50%" cy="40%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="40%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </radialGradient>
      <radialGradient id="roseGlow">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="28" rx="22" ry="22" fill="url(#roseGlow)" />
    <path d="M32 68 C32 66 31 50 32 36" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M31 56 C27 53 24 49 26 45" stroke="#16a34a" strokeWidth="1.5" fill="none" />
    <circle cx="32" cy="26" r="16" fill="url(#roseCenter)" />
    {/* Petals layered */}
    <path d="M32 10 C24 16 20 24 24 30 C28 24 30 16 32 10Z" fill="#f87171" opacity="0.8" />
    <path d="M32 10 C40 16 44 24 40 30 C36 24 34 16 32 10Z" fill="#dc2626" opacity="0.7" />
    <path d="M18 20 C22 28 28 32 36 30 C30 26 24 22 18 20Z" fill="#fca5a5" opacity="0.5" />
    <path d="M46 20 C42 28 36 32 28 30 C34 26 40 22 46 20Z" fill="#b91c1c" opacity="0.6" />
    {/* Center spiral */}
    <circle cx="32" cy="26" r="5" fill="#7f1d1d" />
    <path d="M30 24 C31 22 34 22 35 24 C36 26 35 28 33 29" stroke="#fca5a5" strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="29" cy="22" r="2.5" fill="white" opacity="0.12" />
  </svg>
);

const GiftBox3D: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg viewBox="0 0 64 68" width={size} height={size * 1.06} style={{ filter: 'drop-shadow(0 8px 24px rgba(255,215,0,0.45))' }}>
    <defs>
      <linearGradient id="boxBody3d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe066" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="boxLid3d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <linearGradient id="ribbonV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    {/* Shadow */}
    <ellipse cx="32" cy="64" rx="22" ry="3" fill="black" opacity="0.15" />
    {/* Box body */}
    <rect x="10" y="30" width="44" height="30" rx="4" fill="url(#boxBody3d)" />
    <rect x="10" y="30" width="44" height="30" rx="4" fill="white" opacity="0.08" />
    {/* Box lid */}
    <rect x="6" y="22" width="52" height="12" rx="4" fill="url(#boxLid3d)" />
    {/* Ribbon */}
    <rect x="28" y="22" width="8" height="38" fill="url(#ribbonV)" />
    <rect x="6" y="25" width="52" height="6" fill="#dc2626" opacity="0.85" />
    {/* Bow */}
    <ellipse cx="24" cy="19" rx="10" ry="7" fill="#ef4444" transform="rotate(-18 24 19)" />
    <ellipse cx="40" cy="19" rx="10" ry="7" fill="#f87171" transform="rotate(18 40 19)" />
    <circle cx="32" cy="22" r="4" fill="#b91c1c" />
    <circle cx="32" cy="21" r="2" fill="#fca5a5" opacity="0.4" />
    {/* Shine */}
    <rect x="15" y="35" width="3" height="10" rx="1.5" fill="white" opacity="0.2" />
    <rect x="21" y="37" width="2" height="6" rx="1" fill="white" opacity="0.12" />
  </svg>
);

const Heart3D: React.FC<{ size?: number; color?: string }> = ({ size = 28, color }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} style={{ filter: `drop-shadow(0 3px 12px ${color || 'rgba(255,107,157,0.6)'})` }}>
    <defs>
      <linearGradient id={`hg${size}`} x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#ffb3d0" />
        <stop offset="100%" stopColor="#ff2d6f" />
      </linearGradient>
    </defs>
    <path
      d="M16 28 C16 28 3 20 3 11 C3 6 7 3 11 3 C13.5 3 15.5 4.5 16 6 C16.5 4.5 18.5 3 21 3 C25 3 29 6 29 11 C29 20 16 28 16 28Z"
      fill={`url(#hg${size})`}
    />
    <path d="M11 8 C9 8 7 10 7 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
  </svg>
);

const Sparkle: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#ffd700' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
    <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill={color} opacity="0.9" />
  </svg>
);

const Petal: React.FC<{ size?: number; rotate?: number }> = ({ size = 20, rotate = 0 }) => (
  <svg viewBox="0 0 24 32" width={size} height={size * 1.33} style={{ transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 2px 6px rgba(255,107,157,0.3))' }}>
    <defs>
      <linearGradient id={`pg${rotate}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffc0d0" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ff6b9d" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="16" rx="8" ry="14" fill={`url(#pg${rotate})`} />
    <ellipse cx="10" cy="12" rx="2" ry="6" fill="white" opacity="0.15" />
  </svg>
);

// ── Animated "8" — premium version ──────────────────────────────

const AnimatedEight: React.FC = () => (
  <motion.div
    className="relative"
    style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
    initial={{ scale: 0, rotateY: -120, opacity: 0 }}
    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
    transition={{ duration: 1, type: 'spring', bounce: 0.35 }}
  >
    {/* Ambient glow behind */}
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255,107,157,0.4) 0%, transparent 70%)',
        width: 140,
        height: 160,
        left: -25,
        top: -20,
      }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />

    <motion.div
      animate={{
        rotateY: [0, 10, -10, 0],
        rotateX: [0, -6, 6, 0],
      }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <svg viewBox="0 0 100 140" width="90" height="126">
        <defs>
          <linearGradient id="e8grad" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="35%" stopColor="#ff85b3" />
            <stop offset="70%" stopColor="#ff4081" />
            <stop offset="100%" stopColor="#e91e63" />
          </linearGradient>
          <linearGradient id="e8shine" x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <filter id="e8glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer glow copy */}
        <ellipse cx="50" cy="42" rx="28" ry="32" fill="none" stroke="#ff6b9d" strokeWidth="10" opacity="0.15" filter="url(#e8glow)" />
        <ellipse cx="50" cy="98" rx="34" ry="34" fill="none" stroke="#ff6b9d" strokeWidth="10" opacity="0.15" filter="url(#e8glow)" />

        {/* Main "8" */}
        <ellipse cx="50" cy="42" rx="28" ry="32" fill="none" stroke="url(#e8grad)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="50" cy="98" rx="34" ry="34" fill="none" stroke="url(#e8grad)" strokeWidth="7" strokeLinecap="round" />

        {/* Shine overlay */}
        <ellipse cx="50" cy="42" rx="28" ry="32" fill="none" stroke="url(#e8shine)" strokeWidth="7" />
        <ellipse cx="50" cy="98" rx="34" ry="34" fill="none" stroke="url(#e8shine)" strokeWidth="4" />

        {/* Flower clusters */}
        {/* Top */}
        <circle cx="50" cy="10" r="5" fill="#ff85b3" />
        <circle cx="44" cy="12" r="3.5" fill="#ff6b9d" />
        <circle cx="56" cy="12" r="3.5" fill="#ff6b9d" />
        <circle cx="50" cy="10" r="2" fill="#ffd700" />
        <ellipse cx="40" cy="15" rx="5" ry="2" fill="#22c55e" transform="rotate(-35 40 15)" opacity="0.6" />
        <ellipse cx="60" cy="15" rx="5" ry="2" fill="#22c55e" transform="rotate(35 60 15)" opacity="0.6" />

        {/* Right */}
        <circle cx="78" cy="42" r="4.5" fill="#ff85b3" />
        <circle cx="80" cy="37" r="3" fill="#ffb3d0" />
        <circle cx="82" cy="43" r="3" fill="#ff6b9d" />
        <circle cx="78" cy="42" r="1.8" fill="#ffd700" />

        {/* Bottom */}
        <circle cx="50" cy="132" r="4.5" fill="#ff85b3" />
        <circle cx="45" cy="130" r="3" fill="#ff6b9d" />
        <circle cx="55" cy="130" r="3" fill="#ffb3d0" />
        <circle cx="50" cy="132" r="1.8" fill="#ffd700" />
        <ellipse cx="41" cy="128" rx="4.5" ry="2" fill="#22c55e" transform="rotate(30 41 128)" opacity="0.6" />
        <ellipse cx="59" cy="128" rx="4.5" ry="2" fill="#22c55e" transform="rotate(-30 59 128)" opacity="0.6" />

        {/* Left */}
        <circle cx="22" cy="42" r="4.5" fill="#ff85b3" />
        <circle cx="18" cy="43" r="3" fill="#ff6b9d" />
        <circle cx="20" cy="37" r="3" fill="#ffb3d0" />
        <circle cx="22" cy="42" r="1.8" fill="#ffd700" />
      </svg>
    </motion.div>
  </motion.div>
);

// ── Floating Sparkle Particles ──────────────────────────────────

const FloatingParticles: React.FC = () => (
  <>
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute pointer-events-none"
        style={{
          left: `${8 + Math.random() * 84}%`,
          top: `${5 + Math.random() * 90}%`,
          width: 3 + Math.random() * 4,
          height: 3 + Math.random() * 4,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff85b3' : '#ffffff',
        }}
        animate={{
          opacity: [0, 0.8, 0],
          scale: [0, 1.5, 0],
          y: [0, -(20 + Math.random() * 40)],
        }}
        transition={{
          duration: 2.5 + Math.random() * 2,
          delay: i * 0.4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

// ── Countdown Timer (premium glass style) ───────────────────────

const CountdownTimer: React.FC<{ endDate: Date }> = ({ endDate }) => {
  const { i18n } = useTranslation('subscriptions');
  const isRu = i18n.language.startsWith('ru');
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.total <= 0) return null;

  const units = [
    { value: timeLeft.days, label: isRu ? 'дн' : 'd' },
    { value: timeLeft.hours, label: isRu ? 'ч' : 'h' },
    { value: timeLeft.minutes, label: isRu ? 'мин' : 'm' },
    { value: timeLeft.seconds, label: isRu ? 'сек' : 's' },
  ];

  return (
    <div className="flex justify-center" style={{ columnGap: 6 }}>
      {units.map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="promo-timer-cell">
            <motion.span
              key={`${i}-${unit.value}`}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-base font-bold text-white font-mono tabular-nums"
            >
              {String(unit.value).padStart(2, '0')}
            </motion.span>
          </div>
          <span className="text-[9px] text-white/50 mt-0.5 font-medium">{unit.label}</span>
        </div>
      ))}
    </div>
  );
};

function getTimeLeft(endDate: Date) {
  const total = endDate.getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

// ── Animated Counter for discount ───────────────────────────────

const AnimatedPercent: React.FC<{ value: number }> = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      delay: 0.8,
      ease: 'easeOut',
    });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value, count, rounded]);

  return <>{display}</>;
};

// ── Main Banner ─────────────────────────────────────────────────

export const March8PromoBanner: React.FC = () => {
  const { i18n } = useTranslation();
  const isRu = i18n.language.startsWith('ru');
  const promo = getActivePromo();

  const handleScrollToPlans = useCallback(() => {
    const planCards = document.querySelector('.snap-x');
    if (planCards) {
      planCards.scrollTo({ left: 296, behavior: 'smooth' });
      // Subtle attention pulse on first paid card
      const cards = planCards.querySelectorAll('[class*="promo-card-glow"]');
      if (cards[0]) {
        (cards[0] as HTMLElement).style.transition = 'transform 0.3s';
        (cards[0] as HTMLElement).style.transform = 'scale(1.03)';
        setTimeout(() => {
          (cards[0] as HTMLElement).style.transform = '';
        }, 400);
      }
    }
  }, []);

  if (!promo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.25 }}
      className="relative overflow-hidden rounded-2xl mb-6"
      style={{ perspective: '1200px' }}
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 promo-gradient-bg" />
      <div className="absolute inset-0 promo-mesh-overlay" />
      <div className="absolute inset-0 promo-shimmer-sweep" />

      {/* ── Floating particles ── */}
      <FloatingParticles />

      {/* ── 3D Floating icons — layered depths ── */}

      {/* Far layer (background, slightly blurred) */}
      <Float3D style={{ top: '8%', left: '2%' }} delay={0.2} depth="far" duration={6} rotateRange={18}>
        <Petal size={22} rotate={-30} />
      </Float3D>
      <Float3D style={{ bottom: '12%', right: '5%' }} delay={1.4} depth="far" duration={7} rotateRange={15}>
        <Petal size={18} rotate={45} />
      </Float3D>
      <Float3D style={{ top: '50%', left: '8%' }} delay={2.2} depth="far" duration={5.5}>
        <Petal size={16} rotate={120} />
      </Float3D>

      {/* Mid layer */}
      <Float3D style={{ top: '4%', left: '4%' }} delay={0} depth="mid" duration={5}>
        <Tulip3D size={40} />
      </Float3D>
      <Float3D style={{ top: '6%', right: '3%' }} delay={0.5} depth="mid" duration={5.5}>
        <Rose3D size={42} />
      </Float3D>
      <Float3D style={{ bottom: '8%', left: '3%' }} delay={1} depth="mid" duration={4.5}>
        <Heart3D size={28} />
      </Float3D>
      <Float3D style={{ top: '45%', right: '2%' }} delay={0.8} depth="mid" duration={5}>
        <GiftBox3D size={36} />
      </Float3D>

      {/* Near layer (foreground, larger, brighter) */}
      <Float3D style={{ bottom: '6%', right: '12%' }} delay={0.3} depth="near" duration={4} rotateRange={8}>
        <Heart3D size={22} />
      </Float3D>
      <Float3D style={{ top: '20%', left: '18%' }} delay={1.6} depth="near" duration={4.5} rotateRange={10}>
        <Sparkle size={14} color="#ffd700" />
      </Float3D>
      <Float3D style={{ top: '65%', right: '18%' }} delay={2} depth="near" duration={3.5} rotateRange={6}>
        <Sparkle size={12} color="#ff85b3" />
      </Float3D>
      <Float3D style={{ top: '12%', right: '22%' }} delay={2.8} depth="near" duration={4} rotateRange={8}>
        <Sparkle size={10} color="#ffffff" />
      </Float3D>
      <Float3D style={{ bottom: '18%', left: '15%' }} delay={1.2} depth="near" duration={5} rotateRange={12}>
        <Sparkle size={16} color="#ffd700" />
      </Float3D>

      {/* ── Main content ── */}
      <div className="relative z-10 flex items-center py-5 px-4" style={{ columnGap: 16 }}>

        {/* Left: Animated "8" */}
        <div className="flex-shrink-0">
          <AnimatedEight />
        </div>

        {/* Right: Text + CTA */}
        <div className="flex-1 min-w-0">
          {/* Holiday greeting */}
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-white/85 text-[11px] font-medium tracking-wider uppercase"
          >
            {isRu ? 'С праздником 8 Марта!' : "Happy Women's Day!"}
          </motion.p>

          {/* Discount — animated counter */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-baseline mt-1" style={{ columnGap: 6 }}
          >
            <span className="promo-percent-text">
              −<AnimatedPercent value={promo.discountPercent} />%
            </span>
            <span className="text-white/70 text-xs font-medium">
              {isRu ? 'на всё' : 'on everything'}
            </span>
          </motion.div>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/50 text-[10px] mt-1 leading-tight"
          >
            {isRu ? 'Подписки и пакеты токенов' : 'Subscriptions & token packages'}
          </motion.p>

          {/* Countdown + CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-3 flex items-center" style={{ columnGap: 10 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[8px] uppercase tracking-widest mb-1">
                {isRu ? 'Осталось' : 'Ends in'}
              </p>
              <CountdownTimer endDate={promo.endDate} />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleScrollToPlans}
              className="promo-cta-button flex-shrink-0"
            >
              {isRu ? 'Выбрать' : 'Choose'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
