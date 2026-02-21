import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCredits, formatMoney } from '@/shared/utils/formatters';
import type { UserWallet } from '@/types/user.types';

interface BalanceDisplayProps {
  wallet: UserWallet;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ wallet }) => {
  const { t } = useTranslation('profile');

  return (
    <div>
      <p className="text-content-secondary text-sm uppercase tracking-wide text-right">
        {t('tokenBalance', 'Token Balance')}
      </p>
      <div className="flex items-center justify-end">
        <span className="text-base mr-1.5">⚡</span>
        <p className="text-white text-3xl font-bold tabular-nums">
          {formatCredits(wallet.tokenBalance)}
        </p>
      </div>

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
