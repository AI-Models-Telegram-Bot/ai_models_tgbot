import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatCredits, formatMoney } from '@/shared/utils/formatters';
import type { UserWallet } from '@/types/user.types';

interface BalanceDisplayProps {
  wallet: UserWallet;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ wallet }) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-end" style={{ columnGap: 8 }}>
        <p className="text-content-secondary text-sm uppercase tracking-wide">
          {t('tokenBalance', 'Token Balance')}
        </p>
        <button
          onClick={() => navigate('/subscriptions?tab=tokens')}
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-primary/15 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/25 transition-colors"
        >
          {t('topUp', 'Top Up')}
        </button>
      </div>
      <div className="flex items-center justify-end">
        <span className="text-base mr-1.5">⚡</span>
        <p className="text-white text-3xl font-bold tabular-nums">
          {formatCredits(wallet.tokenBalance)}
        </p>
      </div>

      {/* Balance breakdown */}
      {(wallet.subscriptionTokens > 0 || wallet.purchasedTokens > 0) && (
        <div className="flex items-center justify-end mt-1" style={{ columnGap: 8 }}>
          {wallet.subscriptionTokens > 0 && (
            <span className="text-content-tertiary text-xs">
              {t('subscriptionTokens', 'Subscription')}: {formatCredits(wallet.subscriptionTokens)}
            </span>
          )}
          {wallet.purchasedTokens > 0 && (
            <span className="text-content-tertiary text-xs">
              {t('purchasedTokens', 'Purchased')}: {formatCredits(wallet.purchasedTokens)}
            </span>
          )}
        </div>
      )}

      {/* Money balance */}
      {wallet.moneyBalance > 0 && (
        <div className="flex items-center justify-end mt-1">
          <span className="text-base mr-1.5">💰</span>
          <span className="text-content-secondary text-sm font-semibold">
            {formatMoney(wallet.moneyBalance, wallet.currency)}
          </span>
        </div>
      )}
    </div>
  );
};
