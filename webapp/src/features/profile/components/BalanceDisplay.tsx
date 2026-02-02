import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { formatCredits, formatMoney } from '@/shared/utils/formatters';
import { hapticSelection } from '@/services/telegram/haptic';
import type { UserWallet } from '@/types/user.types';

interface BalanceDisplayProps {
  wallet: UserWallet;
}

interface BalanceItem {
  key: string;
  icon: string;
  labelKey: string;
  value: number;
  color: string;
  isMoney?: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ wallet }) => {
  const { t } = useTranslation('profile');
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCredits =
    wallet.textBalance +
    wallet.imageBalance +
    wallet.videoBalance +
    wallet.audioBalance;

  const balances: BalanceItem[] = [
    { key: 'text', icon: '🤖', labelKey: 'balances.text', value: wallet.textBalance, color: 'bg-blue-500' },
    { key: 'image', icon: '🖼', labelKey: 'balances.image', value: wallet.imageBalance, color: 'bg-green-500' },
    { key: 'video', icon: '🎬', labelKey: 'balances.video', value: wallet.videoBalance, color: 'bg-orange-500' },
    { key: 'audio', icon: '🎵', labelKey: 'balances.audio', value: wallet.audioBalance, color: 'bg-pink-500' },
  ];

  const maxBalance = Math.max(...balances.map((b) => b.value), 1);

  return (
    <div>
      {/* Compact view - clickable total */}
      <button
        onClick={() => {
          hapticSelection();
          setIsExpanded(!isExpanded);
        }}
        className="text-right w-full group"
      >
        <p className="text-gray-text text-sm uppercase tracking-wide">
          {t('creditBalance')}
        </p>
        <div className="flex items-center justify-end gap-1.5">
          <p className="text-white text-3xl font-bold tabular-nums">
            {formatCredits(totalCredits)}
          </p>
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4 text-gray-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </button>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2.5 pt-3 border-t border-dark-border">
              {balances.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-base w-6 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-text text-xs">{t(item.labelKey)}</span>
                      <span className="text-white text-sm font-semibold tabular-nums">
                        {formatCredits(item.value)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', item.color)}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max((item.value / maxBalance) * 100, 2)}%`,
                        }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Money balance */}
              {wallet.moneyBalance > 0 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2.5 pt-1"
                >
                  <span className="text-base w-6 text-center">💰</span>
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-gray-text text-xs">{t('balances.money')}</span>
                    <span className="text-white text-sm font-semibold">
                      {formatMoney(wallet.moneyBalance, wallet.currency)}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
