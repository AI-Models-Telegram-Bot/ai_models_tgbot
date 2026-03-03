import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Skeleton } from '@/shared/ui';
import { TokenPackageCard } from './TokenPackageCard';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { useTokenPackageStore } from '../store/tokenPackageStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { getTelegramUser } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { formatCredits } from '@/shared/utils/formatters';
import type { TokenPackage } from '@/types/tokenPackage.types';

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

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

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
