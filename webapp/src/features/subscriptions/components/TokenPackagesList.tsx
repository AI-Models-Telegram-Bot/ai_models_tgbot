import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
        <div className="rounded-2xl bg-surface-card border border-border p-4 mb-6">
          <p className="text-content-tertiary text-xs uppercase tracking-wider mb-1">
            {t('tokenPackages.currentBalance')}
          </p>
          <span className="text-3xl font-semibold text-content-primary tabular-nums font-mono tracking-tight">
            {formatCredits(wallet.tokenBalance)}
          </span>
          {(wallet.subscriptionTokens > 0 || wallet.purchasedTokens > 0) && (
            <div className="flex gap-3 mt-2">
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
        </div>
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
      <div className="mt-6 rounded-2xl bg-surface-card border border-border p-4">
        <p className="text-content-primary text-sm font-semibold mb-3">
          {t('tokenPackages.customAmount', 'Custom Amount')}
        </p>
        <div className="flex items-center gap-2">
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
            className="flex-1 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-content-primary text-sm placeholder-content-tertiary focus:outline-none focus:border-brand-primary/50 transition-colors tabular-nums"
          />
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
          <p className="text-error text-xs mt-1.5">{customError}</p>
        )}
        <p className="text-content-tertiary text-[10px] mt-2">
          {t('tokenPackages.customRate', { rate: CUSTOM_RATE_RUB.toFixed(2) })}
        </p>
      </div>

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
