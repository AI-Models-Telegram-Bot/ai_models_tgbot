import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import type { TokenPackage } from '@/types/tokenPackage.types';

interface TokenPackageCardProps {
  pkg: TokenPackage;
  index: number;
  onBuy: (pkg: TokenPackage) => void;
}

export const TokenPackageCard: React.FC<TokenPackageCardProps> = ({ pkg, index, onBuy }) => {
  const { t, i18n } = useTranslation('subscriptions');
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={cn(
        'relative rounded-2xl backdrop-blur-xl bg-surface-card/90 border p-4 flex flex-col',
        pkg.isPopular
          ? 'border-brand-secondary/40 shadow-gold'
          : 'border-white/15 shadow-card'
      )}
    >
      {/* Popular badge */}
      {pkg.isPopular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-premium rounded-full text-[10px] font-semibold text-white shadow-gold whitespace-nowrap">
          {t('tokenPackages.popular')}
        </div>
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
        <p className="text-lg font-bold text-white font-mono">
          {lang === 'ru'
            ? `${pkg.priceRUB.toLocaleString('ru-RU')} ₽`
            : `${pkg.priceRUB.toLocaleString()} ₽`}
        </p>
        {pkg.discountPercent > 0 && (
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
