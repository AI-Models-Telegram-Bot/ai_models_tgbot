import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import { getActivePromo, getDiscountedPrice } from '@/config/promoConfig';
import type { TokenPackage } from '@/types/tokenPackage.types';

interface TokenPackageCardProps {
  pkg: TokenPackage;
  index: number;
  onBuy: (pkg: TokenPackage) => void;
}

export const TokenPackageCard: React.FC<TokenPackageCardProps> = ({ pkg, onBuy }) => {
  const { t, i18n } = useTranslation('subscriptions');
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const promo = getActivePromo();
  const showPromo = !!promo;

  const formatRub = (amount: number) =>
    lang === 'ru' ? `${amount.toLocaleString('ru-RU')} ₽` : `${amount.toLocaleString()} ₽`;

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-surface-card border p-4 flex flex-col',
        pkg.isPopular ? 'border-brand-primary/40' : 'border-border',
      )}
    >
      {/* Popular / promo badge */}
      {showPromo ? (
        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/15 text-brand-primary">
          −{promo!.discountPercent}%
        </span>
      ) : pkg.isPopular ? (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-content-secondary whitespace-nowrap">
          {t('tokenPackages.popular')}
        </span>
      ) : null}

      {/* Token amount */}
      <div className="text-center mt-1 mb-3">
        <span className="text-2xl font-semibold text-content-primary font-display tracking-tight">
          {pkg.tokens.toLocaleString()}
        </span>
        <p className="text-content-tertiary text-xs mt-0.5">
          {t('tokenPackages.tokens')}
        </p>
      </div>

      {/* Price */}
      <div className="text-center mb-3">
        {showPromo ? (
          <div className="flex items-baseline justify-center gap-2">
            <p className="text-lg font-semibold font-mono text-brand-primary">
              {formatRub(getDiscountedPrice(pkg.priceRUB))}
            </p>
            <p className="text-xs font-mono text-content-tertiary line-through decoration-content-tertiary/60">
              {formatRub(pkg.priceRUB)}
            </p>
          </div>
        ) : (
          <p className="text-lg font-semibold text-content-primary font-mono">
            {formatRub(pkg.priceRUB)}
          </p>
        )}
        {pkg.discountPercent > 0 && !showPromo && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">
            {t('tokenPackages.discount', { percent: pkg.discountPercent })}
          </span>
        )}
      </div>

      {/* Buy button */}
      <div className="mt-auto">
        <Button variant="primary" fullWidth size="sm" onClick={() => onBuy(pkg)}>
          {t('tokenPackages.buy')}
        </Button>
      </div>
    </div>
  );
};
