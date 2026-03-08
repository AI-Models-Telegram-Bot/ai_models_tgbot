import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getActivePromo } from '@/config/promoConfig';

// ── 3D Floating Icon Components ─────────────────────────────────

const FloatingTulip: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 48,
}) => (
  <motion.div
    className="absolute pointer-events-none promo-3d-icon"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, scale: 0.3, rotateY: -40 }}
    animate={{
      opacity: [0, 1, 1, 0.8],
      scale: [0.3, 1.1, 1, 1],
      rotateY: [-40, 10, -5, 0],
      rotateX: [20, -5, 5, 0],
      y: [10, -6, 4, -6],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-[0_4px_12px_rgba(255,107,157,0.5)]">
      {/* Stem */}
      <path d="M32 58 C32 58 30 42 32 30" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M32 45 C26 42 22 38 24 34 C28 36 30 40 32 45Z" fill="#22c55e" opacity="0.8" />
      {/* Tulip petals */}
      <ellipse cx="26" cy="22" rx="8" ry="14" fill="#ff6b9d" transform="rotate(-15 26 22)" />
      <ellipse cx="38" cy="22" rx="8" ry="14" fill="#ff85b3" transform="rotate(15 38 22)" />
      <ellipse cx="32" cy="20" rx="7" ry="15" fill="#ff4081" />
      {/* Highlight */}
      <ellipse cx="30" cy="16" rx="3" ry="6" fill="white" opacity="0.2" />
    </svg>
  </motion.div>
);

const FloatingRose: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 52,
}) => (
  <motion.div
    className="absolute pointer-events-none promo-3d-icon"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, scale: 0.2, rotateZ: -20 }}
    animate={{
      opacity: [0, 1, 1, 0.9],
      scale: [0.2, 1.05, 0.95, 1],
      rotateZ: [-20, 5, -3, 0],
      rotateX: [15, -8, 5, -3],
      y: [8, -8, 2, -4],
    }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-[0_4px_16px_rgba(220,38,38,0.4)]">
      {/* Stem */}
      <path d="M32 58 C32 56 31 44 32 34" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Thorns */}
      <path d="M31 48 C28 46 27 44 29 43" stroke="#16a34a" strokeWidth="1.5" fill="none" />
      <path d="M33 42 C36 40 37 38 35 37" stroke="#16a34a" strokeWidth="1.5" fill="none" />
      {/* Rose petals - layered for 3D */}
      <circle cx="32" cy="22" r="12" fill="#dc2626" />
      <path d="M32 10 C26 14 22 20 24 26 C28 22 30 16 32 10Z" fill="#ef4444" />
      <path d="M32 10 C38 14 42 20 40 26 C36 22 34 16 32 10Z" fill="#b91c1c" />
      <path d="M22 18 C24 24 28 28 34 28 C30 24 26 20 22 18Z" fill="#f87171" />
      <path d="M42 18 C40 24 36 28 30 28 C34 24 38 20 42 18Z" fill="#991b1b" />
      {/* Center spiral */}
      <circle cx="32" cy="22" r="4" fill="#7f1d1d" />
      <path d="M30 20 C31 19 33 19 34 20 C35 21 35 23 34 24" stroke="#fca5a5" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Highlight */}
      <circle cx="28" cy="18" r="3" fill="white" opacity="0.15" />
    </svg>
  </motion.div>
);

const FloatingGiftBox: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 44,
}) => (
  <motion.div
    className="absolute pointer-events-none promo-3d-icon"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, scale: 0.3, rotateY: 30 }}
    animate={{
      opacity: [0, 1, 1, 0.85],
      scale: [0.3, 1.08, 0.96, 1],
      rotateY: [30, -8, 5, 0],
      rotateX: [-10, 8, -4, 2],
      y: [6, -10, 0, -5],
    }}
    transition={{
      duration: 4.5,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-[0_6px_16px_rgba(255,215,0,0.4)]">
      {/* Box body */}
      <rect x="12" y="28" width="40" height="28" rx="3" fill="#ffd700" />
      <rect x="12" y="28" width="40" height="28" rx="3" fill="url(#giftGrad)" />
      {/* Box lid */}
      <rect x="8" y="22" width="48" height="10" rx="3" fill="#ffed4a" />
      {/* Ribbon vertical */}
      <rect x="28" y="22" width="8" height="34" fill="#dc2626" />
      {/* Ribbon horizontal */}
      <rect x="8" y="24" width="48" height="6" fill="#dc2626" opacity="0.9" />
      {/* Bow */}
      <ellipse cx="26" cy="20" rx="8" ry="6" fill="#ef4444" transform="rotate(-20 26 20)" />
      <ellipse cx="38" cy="20" rx="8" ry="6" fill="#ef4444" transform="rotate(20 38 20)" />
      <circle cx="32" cy="22" r="3" fill="#b91c1c" />
      {/* Shine */}
      <rect x="16" y="32" width="3" height="8" rx="1.5" fill="white" opacity="0.2" />
      <defs>
        <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="black" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  </motion.div>
);

const FloatingHeart: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 32,
}) => (
  <motion.div
    className="absolute pointer-events-none promo-3d-icon"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.8, 0.6, 0.8],
      scale: [0, 1.2, 0.9, 1.1],
      rotateZ: [0, 10, -10, 5],
      y: [0, -12, 4, -8],
    }}
    transition={{
      duration: 3.5,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow-[0_2px_8px_rgba(255,107,157,0.6)]">
      <path
        d="M16 28 C16 28 3 20 3 11 C3 6 7 3 11 3 C13.5 3 15.5 4.5 16 6 C16.5 4.5 18.5 3 21 3 C25 3 29 6 29 11 C29 20 16 28 16 28Z"
        fill="url(#heartGrad)"
      />
      <path
        d="M11 8 C9 8 7 9.5 7 12"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <defs>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff85b3" />
          <stop offset="100%" stopColor="#ff2d6f" />
        </linearGradient>
      </defs>
    </svg>
  </motion.div>
);

const FloatingRibbon: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 40,
}) => (
  <motion.div
    className="absolute pointer-events-none promo-3d-icon"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, rotateZ: -30, scale: 0.4 }}
    animate={{
      opacity: [0, 0.9, 0.7, 0.9],
      rotateZ: [-30, 10, -15, 5],
      rotateY: [20, -10, 15, -5],
      scale: [0.4, 1, 0.95, 1],
      y: [4, -10, 2, -6],
    }}
    transition={{
      duration: 5.5,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 48 48" width={size} height={size} className="drop-shadow-[0_3px_10px_rgba(168,85,247,0.4)]">
      {/* Ribbon wave */}
      <path
        d="M6 24 C12 16 18 32 24 24 C30 16 36 32 42 24"
        stroke="url(#ribbonGrad)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ribbon ends */}
      <path d="M4 26 L8 34 L12 24" fill="#c084fc" opacity="0.6" />
      <path d="M36 24 L40 34 L44 26" fill="#a855f7" opacity="0.6" />
      <defs>
        <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#ff6b9d" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
      </defs>
    </svg>
  </motion.div>
);

const FloatingStar: React.FC<{ style?: React.CSSProperties; delay?: number; size?: number }> = ({
  style,
  delay = 0,
  size = 24,
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ ...style, width: size, height: size }}
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{
      opacity: [0, 1, 0.5, 1, 0],
      scale: [0, 1, 0.8, 1.1, 0],
      rotate: [0, 72, 144, 216, 288],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
        fill="#ffd700"
        opacity="0.7"
      />
    </svg>
  </motion.div>
);

// ── Animated "8" with floral wreath ─────────────────────────────

const AnimatedEight: React.FC = () => (
  <motion.div
    className="relative promo-3d-icon"
    initial={{ scale: 0, rotateY: -90 }}
    animate={{ scale: 1, rotateY: 0 }}
    transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
  >
    <motion.div
      animate={{
        rotateY: [0, 8, -8, 0],
        rotateX: [0, -5, 5, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 120 160" width="90" height="120" className="drop-shadow-[0_8px_32px_rgba(255,107,157,0.5)]">
        {/* Glow behind */}
        <defs>
          <radialGradient id="eightGlow">
            <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff6b9d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eightGrad" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="40%" stopColor="#ff6b9d" />
            <stop offset="100%" stopColor="#ff4081" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="80" rx="55" ry="75" fill="url(#eightGlow)" />

        {/* The "8" shape */}
        <ellipse cx="60" cy="50" rx="32" ry="36" fill="none" stroke="url(#eightGrad)" strokeWidth="8" />
        <ellipse cx="60" cy="112" rx="38" ry="38" fill="none" stroke="url(#eightGrad)" strokeWidth="8" />

        {/* Floral decorations on the 8 */}
        {/* Top flower */}
        <circle cx="60" cy="14" r="6" fill="#ff85b3" />
        <circle cx="54" cy="16" r="4" fill="#ff6b9d" />
        <circle cx="66" cy="16" r="4" fill="#ff6b9d" />
        <circle cx="60" cy="14" r="2.5" fill="#ffd700" />

        {/* Right flower */}
        <circle cx="92" cy="50" r="5" fill="#ff85b3" />
        <circle cx="92" cy="44" r="3.5" fill="#ff6b9d" />
        <circle cx="96" cy="50" r="3.5" fill="#ff6b9d" />
        <circle cx="92" cy="50" r="2" fill="#ffd700" />

        {/* Bottom flower */}
        <circle cx="60" cy="150" r="5" fill="#ff85b3" />
        <circle cx="55" cy="148" r="3.5" fill="#ff6b9d" />
        <circle cx="65" cy="148" r="3.5" fill="#ff6b9d" />
        <circle cx="60" cy="150" r="2" fill="#ffd700" />

        {/* Left flower */}
        <circle cx="28" cy="50" r="5" fill="#ff85b3" />
        <circle cx="28" cy="44" r="3.5" fill="#ff6b9d" />
        <circle cx="24" cy="50" r="3.5" fill="#ff6b9d" />
        <circle cx="28" cy="50" r="2" fill="#ffd700" />

        {/* Small leaves */}
        <ellipse cx="42" cy="18" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 42 18)" opacity="0.7" />
        <ellipse cx="78" cy="18" rx="6" ry="3" fill="#22c55e" transform="rotate(30 78 18)" opacity="0.7" />
        <ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#22c55e" transform="rotate(-60 22 70)" opacity="0.7" />
        <ellipse cx="98" cy="70" rx="5" ry="2.5" fill="#22c55e" transform="rotate(60 98 70)" opacity="0.7" />
      </svg>
    </motion.div>
  </motion.div>
);

// ── Countdown Timer ─────────────────────────────────────────────

const CountdownTimer: React.FC<{ endDate: Date }> = ({ endDate }) => {
  const { i18n } = useTranslation('subscriptions');
  const isRu = i18n.language.startsWith('ru');

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="flex justify-center" style={{ columnGap: 8 }}>
      {[
        { value: timeLeft.days, label: isRu ? 'дн' : 'd' },
        { value: timeLeft.hours, label: isRu ? 'ч' : 'h' },
        { value: timeLeft.minutes, label: isRu ? 'мин' : 'm' },
        { value: timeLeft.seconds, label: isRu ? 'сек' : 's' },
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.div
            key={`${i}-${unit.value}`}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-11 h-11 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
          </motion.div>
          <span className="text-[10px] text-white/60 mt-1">{unit.label}</span>
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

// ── Main Banner ─────────────────────────────────────────────────

export const March8PromoBanner: React.FC = () => {
  const { i18n } = useTranslation();
  const isRu = i18n.language.startsWith('ru');
  const promo = getActivePromo();

  if (!promo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
      className="relative overflow-hidden rounded-2xl mb-6 promo-banner-march8"
      style={{ perspective: '1000px' }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 promo-gradient-bg" />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-transparent" />

      {/* Shimmer sweep */}
      <div className="absolute inset-0 promo-shimmer-sweep" />

      {/* ── Floating 3D Icons overlay ── */}
      {/* Left side */}
      <FloatingTulip style={{ top: '5%', left: '3%' }} delay={0} size={42} />
      <FloatingHeart style={{ top: '60%', left: '5%' }} delay={0.8} size={24} />
      <FloatingRibbon style={{ bottom: '10%', left: '2%' }} delay={1.5} size={34} />

      {/* Right side */}
      <FloatingRose style={{ top: '8%', right: '4%' }} delay={0.4} size={44} />
      <FloatingGiftBox style={{ top: '55%', right: '3%' }} delay={1.2} size={38} />
      <FloatingHeart style={{ bottom: '15%', right: '8%' }} delay={2} size={20} />

      {/* Scattered stars */}
      <FloatingStar style={{ top: '15%', left: '25%' }} delay={0.5} size={16} />
      <FloatingStar style={{ top: '70%', right: '25%' }} delay={1.8} size={14} />
      <FloatingStar style={{ top: '30%', right: '20%' }} delay={2.5} size={12} />
      <FloatingStar style={{ bottom: '20%', left: '20%' }} delay={3.2} size={18} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center py-6 px-4">
        {/* Animated "8" centerpiece */}
        <AnimatedEight />

        {/* Holiday text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-white/90 text-sm font-medium mt-2 mb-1 tracking-wide"
        >
          {isRu ? 'С праздником 8 Марта!' : 'Happy Women\'s Day!'}
        </motion.p>

        {/* Discount badge */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', bounce: 0.5 }}
          className="promo-discount-badge mt-2 mb-4"
        >
          <span className="relative z-10 text-2xl font-bold text-white font-display tracking-tight">
            −{promo.discountPercent}%
          </span>
          <span className="relative z-10 text-white/80 text-xs font-medium ml-1.5">
            {isRu ? 'на всё' : 'on everything'}
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/70 text-xs text-center mb-4 max-w-[260px]"
        >
          {isRu
            ? 'Скидка на все подписки и пакеты токенов'
            : 'Discount on all subscriptions and token packages'}
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <p className="text-white/50 text-[10px] text-center mb-2 uppercase tracking-widest">
            {isRu ? 'До конца акции' : 'Offer ends in'}
          </p>
          <CountdownTimer endDate={promo.endDate} />
        </motion.div>
      </div>
    </motion.div>
  );
};
