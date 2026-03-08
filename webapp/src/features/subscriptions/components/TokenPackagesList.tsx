import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Skeleton, Button } from '@/shared/ui';
import { TokenPackageCard } from './TokenPackageCard';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { useTokenPackageStore } from '../store/tokenPackageStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { getTelegramUser } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { formatCredits } from '@/shared/utils/formatters';
import { getActivePromo, getDiscountedPrice } from '@/config/promoConfig';
import type { TokenPackage } from '@/types/tokenPackage.types';

const CUSTOM_RATE_RUB = 3.49;
const CUSTOM_RATE_STARS = 2.5;
const CUSTOM_MIN = 50;
const CUSTOM_MAX = 50000;

interface TokenPackagesListProps {
  onPurchaseSuccess?: () => void;
}

export const TokenPackagesList: React.FC<TokenPackagesListProps> = ({ onPurchaseSuccess }) => {
  const { t } = useTranslation('subscriptions');
  const { packages, isLoading, error, fetchPackages } = useTokenPackageStore();
  const wallet = useProfileStore((s) => s.wallet);

  const telegramUser = getTelegramUser();
  const authUser = useAuthStore((s) => s.user);
  const telegramId = telegramUser?.id?.toString() || authUser?.telegramId || '';

  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [customTokens, setCustomTokens] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleCustomBuy = () => {
    const amount = Math.round(Number(customTokens));
    if (!amount || amount < CUSTOM_MIN) {
      setCustomError(t('tokenPackages.customMin', { min: CUSTOM_MIN }));
      return;
    }
    if (amount > CUSTOM_MAX) {
      setCustomError(t('tokenPackages.customMax', { max: CUSTOM_MAX.toLocaleString() }));
      return;
    }
    setCustomError(null);

    const priceRUB = Math.ceil(amount * CUSTOM_RATE_RUB);
    const priceStars = Math.ceil(amount * CUSTOM_RATE_STARS);

    const customPkg: TokenPackage = {
      id: `custom:${amount}`,
      name: `${amount} Tokens`,
      tokens: amount,
      priceRUB,
      priceStars,
      discountPercent: 0,
      isPopular: false,
      sortOrder: 999,
      description: null,
    };
    setSelectedPkg(customPkg);
  };

  const promo = getActivePromo();

  const customPrice = (() => {
    const amount = Math.round(Number(customTokens));
    if (!amount || amount < CUSTOM_MIN) return null;
    const base = Math.ceil(amount * CUSTOM_RATE_RUB);
    return promo?.appliesToTokens ? getDiscountedPrice(base) : base;
  })();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-content-secondary mb-2">{error}</p>
        <button onClick={() => fetchPackages()} className="text-brand-primary underline text-sm">
          {t('common:retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Current balance */}
      {wallet && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl backdrop-blur-xl bg-surface-card/90 border border-white/15 p-4 mb-6"
        >
          <p className="text-content-secondary text-xs uppercase tracking-wider mb-1">
            {t('tokenPackages.currentBalance')}
          </p>
          <div className="flex items-center" style={{ columnGap: 6 }}>
            <span className="text-lg">⚡</span>
            <span className="text-3xl font-bold text-white tabular-nums">
              {formatCredits(wallet.tokenBalance)}
            </span>
          </div>
          {(wallet.subscriptionTokens > 0 || wallet.purchasedTokens > 0) && (
            <div className="flex mt-2" style={{ columnGap: 12 }}>
              {wallet.subscriptionTokens > 0 && (
                <span className="text-xs text-content-tertiary">
                  {t('profile:subscriptionTokens', 'Subscription')}: {formatCredits(wallet.subscriptionTokens)}
                </span>
              )}
              {wallet.purchasedTokens > 0 && (
                <span className="text-xs text-content-tertiary">
                  {t('profile:purchasedTokens', 'Purchased')}: {formatCredits(wallet.purchasedTokens)}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Package grid */}
      {isLoading ? (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={180} className="rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {packages.map((pkg, i) => (
            <TokenPackageCard
              key={pkg.id}
              pkg={pkg}
              index={i}
              onBuy={() => setSelectedPkg(pkg)}
            />
          ))}
        </div>
      )}

      {/* Custom amount */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-6 rounded-2xl backdrop-blur-xl bg-surface-card/90 border border-white/15 p-4"
      >
        <p className="text-white text-sm font-semibold mb-3">
          {t('tokenPackages.customAmount', 'Custom Amount')}
        </p>
        <div className="flex items-center" style={{ columnGap: 8 }}>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">⚡</span>
            <input
              type="number"
              inputMode="numeric"
              min={CUSTOM_MIN}
              max={CUSTOM_MAX}
              value={customTokens}
              onChange={(e) => {
                setCustomTokens(e.target.value);
                setCustomError(null);
              }}
              placeholder={`${CUSTOM_MIN}–${CUSTOM_MAX.toLocaleString()}`}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-content-tertiary focus:outline-none focus:border-brand-primary/50 transition-colors tabular-nums"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCustomBuy}
            disabled={!customTokens || Number(customTokens) < CUSTOM_MIN}
          >
            {customPrice
              ? `${t('tokenPackages.buy')} ${customPrice.toLocaleString()} ₽`
              : t('tokenPackages.buy')}
          </Button>
        </div>
        {customError && (
          <p className="text-red-400 text-xs mt-1.5">{customError}</p>
        )}
        <p className="text-content-tertiary text-[10px] mt-2">
          {t('tokenPackages.customRate', { rate: CUSTOM_RATE_RUB.toFixed(2) })}
        </p>
      </motion.div>

      {/* Purchase modal */}
      {selectedPkg && (
        <TokenPurchaseModal
          isOpen={!!selectedPkg}
          onClose={() => setSelectedPkg(null)}
          pkg={selectedPkg}
          telegramId={telegramId}
          onSuccess={onPurchaseSuccess}
        />
      )}
    </div>
  );
};
