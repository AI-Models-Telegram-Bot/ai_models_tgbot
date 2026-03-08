import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { getActivePromo, getDiscountedPrice } from '@/config/promoConfig';
import type { TokenPackage } from '@/types/tokenPackage.types';

const TokenCardSparkle: React.FC<{ style: React.CSSProperties; delay: number; size?: number; color?: string }> = ({ style, delay, size = 10, color = '#ffd700' }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={style}
    animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.1, 0.4] }}
    transition={{ duration: 2.8, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
      <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill={color} opacity="0.8" />
    </svg>
  </motion.div>
);

interface TokenPackageCardProps {
  pkg: TokenPackage;
  index: number;
  onBuy: (pkg: TokenPackage) => void;
}

export const TokenPackageCard: React.FC<TokenPackageCardProps> = ({ pkg, index, onBuy }) => {
  const { t, i18n } = useTranslation('subscriptions');
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const promo = getActivePromo();
  const showPromo = !!promo;

  const formatRub = (amount: number) =>
    lang === 'ru' ? `${amount.toLocaleString('ru-RU')} ₽` : `${amount.toLocaleString()} ₽`;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={cn(
        'relative rounded-2xl backdrop-blur-xl bg-surface-card/90 border p-4 flex flex-col',
        pkg.isPopular
          ? 'border-brand-secondary/40 shadow-gold'
          : 'border-white/15 shadow-card',
        showPromo && 'promo-card-glow'
      )}
    >
      {/* Popular badge */}
      {pkg.isPopular && !showPromo && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-premium rounded-full text-[10px] font-semibold text-white shadow-gold whitespace-nowrap">
          {t('tokenPackages.popular')}
        </div>
      )}

      {/* Promo discount badge (replaces Popular during promo) */}
      {showPromo && (
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: index * 0.06 + 0.2 }}
          className="absolute -top-2.5 -right-1.5 z-10"
        >
          <span className="promo-mini-badge">−{promo!.discountPercent}%</span>
        </motion.div>
      )}

      {/* Promo sparkle decorations */}
      {showPromo && (
        <>
          <TokenCardSparkle style={{ top: 6, left: 4 }} delay={index * 0.15} size={9} color="#ffd700" />
          <TokenCardSparkle style={{ bottom: 30, right: 4 }} delay={index * 0.15 + 1} size={8} color="#ff85b3" />
        </>
      )}

      {/* Token amount */}
      <div className="text-center mt-1 mb-3">
        <div className="flex items-center justify-center" style={{ columnGap: 4 }}>
          <span className="text-lg">⚡</span>
          <span className="text-2xl font-bold text-white font-display">
            {pkg.tokens.toLocaleString()}
          </span>
        </div>
        <p className="text-content-tertiary text-xs mt-0.5">
          {t('tokenPackages.tokens')}
        </p>
      </div>

      {/* Price */}
      <div className="text-center mb-3">
        {showPromo ? (
          <>
            <p className="text-sm font-bold font-mono promo-old-price">
              {formatRub(pkg.priceRUB)}
            </p>
            <p className="text-lg font-bold font-mono promo-new-price">
              {formatRub(getDiscountedPrice(pkg.priceRUB))}
            </p>
          </>
        ) : (
          <p className="text-lg font-bold text-white font-mono">
            {formatRub(pkg.priceRUB)}
          </p>
        )}
        {pkg.discountPercent > 0 && !showPromo && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
            {t('tokenPackages.discount', { percent: pkg.discountPercent })}
          </span>
        )}
      </div>

      {/* Buy button */}
      <div className="mt-auto">
        <Button
          variant="primary"
          fullWidth
          size="sm"
          onClick={() => onBuy(pkg)}
        >
          {t('tokenPackages.buy')}
        </Button>
      </div>
    </motion.div>
  );
};
