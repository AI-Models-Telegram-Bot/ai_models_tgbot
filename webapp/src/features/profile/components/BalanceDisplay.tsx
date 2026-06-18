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
      <div className="flex items-center justify-between gap-2">
        <p className="text-content-tertiary text-xs uppercase tracking-wider">
          {t('tokenBalance', 'Token Balance')}
        </p>
        <button
          onClick={() => navigate('/subscriptions?tab=tokens')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-primary/12 text-brand-primary hover:bg-brand-primary/20 transition-colors"
        >
          {t('topUp', 'Top Up')}
        </button>
      </div>
      <p className="text-content-primary text-3xl font-semibold tabular-nums font-mono mt-1 tracking-tight">
        {formatCredits(wallet.tokenBalance)}
      </p>

      {/* Balance breakdown */}
      {(wallet.subscriptionTokens > 0 || wallet.purchasedTokens > 0) && (
        <div className="flex items-center gap-3 mt-2">
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
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <span className="text-content-tertiary text-xs uppercase tracking-wider">
            {t('moneyBalance', 'Balance')}
          </span>
          <span className="text-content-secondary text-sm font-semibold font-mono">
            {formatMoney(wallet.moneyBalance, wallet.currency)}
          </span>
        </div>
      )}
    </div>
  );
};
