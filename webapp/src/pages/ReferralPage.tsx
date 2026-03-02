import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useReferralStore } from '@/features/referral/store/referralStore';
import { Card, Button, Skeleton, Badge } from '@/shared/ui';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { openTelegramLink } from '@/services/telegram/telegram';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import type { ReferralMode, WithdrawalStatus } from '@/types/referral.types';
import toast from 'react-hot-toast';

const TIER_ORDER = ['STARTER', 'PRO', 'PREMIUM', 'BUSINESS'] as const;
const TIER_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PREMIUM: 'Premium',
  BUSINESS: 'Business',
};

const ReferralPage: React.FC = () => {
  const { t } = useTranslation(['referral', 'common']);
  const { isLoading: isTelegramLoading } = useTelegramUser();
  const {
    referralUrl,
    referralMode,
    commissionRates,
    inviteeBonus,
    withdrawalThresholds,
    walletCurrency,
    moneyBalance,
    stats,
    withdrawals,
    isLoading,
    fetchReferralInfo,
    fetchBenefits,
    setMode,
    requestWithdrawal,
    fetchWithdrawals,
  } = useReferralStore();
  const { copy } = useCopyToClipboard();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!isTelegramLoading) {
      fetchReferralInfo();
      fetchBenefits();
      fetchWithdrawals();
    }
  }, [isTelegramLoading, fetchReferralInfo, fetchBenefits, fetchWithdrawals]);

  const handleCopyLink = async () => {
    hapticImpact('light');
    const success = await copy(referralUrl);
    if (success) {
      hapticNotification('success');
      toast.success(t('common:copied'));
    }
  };

  const handleShare = () => {
    hapticImpact('medium');
    const text = t('referral:shareText', { bonus: inviteeBonus });
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`;
    openTelegramLink(shareUrl);
  };

  const handleModeSwitch = async (mode: ReferralMode) => {
    hapticImpact('medium');
    try {
      await setMode(mode);
      hapticNotification('success');
    } catch {
      hapticNotification('error');
      toast.error(t('referral:modeError'));
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    setWithdrawing(true);
    try {
      await requestWithdrawal(amount, walletCurrency);
      hapticNotification('success');
      toast.success(t('referral:withdrawSuccess'));
      setWithdrawAmount('');
    } catch (err: any) {
      hapticNotification('error');
      toast.error(err?.message || t('referral:withdrawError'));
    } finally {
      setWithdrawing(false);
    }
  };

  const threshold = walletCurrency === 'RUB' ? withdrawalThresholds.RUB : withdrawalThresholds.USD;
  const currencySymbol = walletCurrency === 'RUB' ? '\u20BD' : '$';

  // Compute min/max ranges for the mode toggle cards
  const tokenRange = { min: 100, max: 0 };
  const cashRange = { min: 100, max: 0 };
  for (const tier of TIER_ORDER) {
    const r = commissionRates[tier];
    if (!r) continue;
    if (r.tokenPercent < tokenRange.min) tokenRange.min = r.tokenPercent;
    if (r.tokenPercent > tokenRange.max) tokenRange.max = r.tokenPercent;
    if (r.cashPercent < cashRange.min) cashRange.min = r.cashPercent;
    if (r.cashPercent > cashRange.max) cashRange.max = r.cashPercent;
  }

  if (isLoading || isTelegramLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-2xl" variant="rectangular" />
        <div className="flex" style={{ columnGap: 12 }}>
          <Skeleton className="flex-1 h-28 rounded-2xl" variant="rectangular" />
          <Skeleton className="flex-1 h-28 rounded-2xl" variant="rectangular" />
        </div>
        <Skeleton className="h-36 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center pt-2"
      >
        <h1 className="text-white text-2xl font-bold">{t('referral:title')}</h1>
        <p className="text-content-tertiary mt-2 text-[15px] leading-relaxed px-2">
          {t('referral:description')}
        </p>
      </motion.div>

      {/* Invitee Bonus Banner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.03 }}
      >
        <Card className="flex items-center" padding="sm" variant="bordered">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mr-3">
            <span className="text-lg">&#127873;</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">{t('referral:inviteeBonus.title')}</p>
            <p className="text-content-tertiary text-xs mt-0.5">
              {t('referral:inviteeBonus.description', { bonus: inviteeBonus })}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Commission Mode Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-white text-sm font-semibold mb-2 uppercase tracking-wider">
          {t('referral:commissionMode')}
        </h2>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          <button
            onClick={() => handleModeSwitch('TOKENS')}
            className={`relative rounded-2xl p-4 text-left transition-all duration-300 border-2 ${
              referralMode === 'TOKENS'
                ? 'border-brand-primary bg-brand-primary/10 shadow-neon'
                : 'border-white/10 bg-surface-card hover:border-white/20'
            }`}
          >
            {referralMode === 'TOKENS' && (
              <div className="absolute top-2.5 right-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}
            <div className="text-2xl mb-2">&#9889;</div>
            <p className="text-white font-bold text-base">{tokenRange.min}–{tokenRange.max}%</p>
            <p className="text-content-tertiary text-xs mt-0.5">{t('referral:inTokens')}</p>
          </button>

          <button
            onClick={() => handleModeSwitch('CASH')}
            className={`relative rounded-2xl p-4 text-left transition-all duration-300 border-2 ${
              referralMode === 'CASH'
                ? 'border-brand-accent bg-brand-accent/10 shadow-gold'
                : 'border-white/10 bg-surface-card hover:border-white/20'
            }`}
          >
            {referralMode === 'CASH' && (
              <div className="absolute top-2.5 right-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0f0f23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}
            <div className="text-2xl mb-2">&#128176;</div>
            <p className="text-white font-bold text-base">{cashRange.min}–{cashRange.max}%</p>
            <p className="text-content-tertiary text-xs mt-0.5">{t('referral:inCash')}</p>
          </button>
        </div>
      </motion.div>

      {/* Tiered Rates Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <Card padding="sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-content-tertiary uppercase tracking-wider">
                <th className="text-left py-1.5 px-2 font-medium">{t('referral:ratesTable.plan')}</th>
                <th className="text-center py-1.5 px-2 font-medium">&#9889; {t('referral:ratesTable.tokens')}</th>
                <th className="text-center py-1.5 px-2 font-medium">&#128176; {t('referral:ratesTable.cash')}</th>
              </tr>
            </thead>
            <tbody>
              {TIER_ORDER.map((tier) => {
                const r = commissionRates[tier];
                if (!r) return null;
                return (
                  <tr key={tier} className="border-t border-white/5">
                    <td className="py-2 px-2 text-white font-medium">{TIER_LABELS[tier]}</td>
                    <td className={`py-2 px-2 text-center font-mono font-semibold ${referralMode === 'TOKENS' ? 'text-brand-primary' : 'text-content-secondary'}`}>
                      {r.tokenPercent}%
                    </td>
                    <td className={`py-2 px-2 text-center font-mono font-semibold ${referralMode === 'CASH' ? 'text-brand-accent' : 'text-content-secondary'}`}>
                      {r.cashPercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3"
          style={{ gap: 10 }}
        >
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.invited')}</p>
            <p className="text-white text-xl font-bold mt-1">{stats.totalInvited}</p>
          </Card>
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.tokensEarned')}</p>
            <p className="text-brand-primary text-xl font-bold mt-1">{stats.tokensEarned}</p>
          </Card>
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.cashEarned')}</p>
            <p className="text-brand-accent text-xl font-bold mt-1">
              {stats.cashEarned.toFixed(0)}{currencySymbol}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Referral Link */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-white text-sm font-semibold mb-2 uppercase tracking-wider">{t('referral:yourLink')}</h2>
        <Card className="space-y-3">
          {referralUrl ? (
            <p className="text-white text-sm font-mono break-all bg-white/5 rounded-lg px-3 py-2">
              {referralUrl}
            </p>
          ) : (
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <Skeleton variant="text" className="h-5 w-full rounded" />
            </div>
          )}
          <div className="flex" style={{ columnGap: 8 }}>
            <Button variant="primary" fullWidth size="sm" onClick={handleShare} disabled={!referralUrl}>
              {t('referral:share')}
            </Button>
            <Button variant="secondary" fullWidth size="sm" onClick={handleCopyLink} disabled={!referralUrl}>
              {t('referral:copyLink')}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Withdrawal Section */}
      {(referralMode === 'CASH' || (stats && stats.cashEarned > 0)) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white text-sm font-semibold mb-2 uppercase tracking-wider">
            {t('referral:withdrawal.title')}
          </h2>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-content-tertiary text-xs">{t('referral:withdrawal.available')}</p>
                <p className="text-white text-lg font-bold">{moneyBalance.toFixed(2)} {currencySymbol}</p>
              </div>
              {stats && stats.pendingWithdrawal > 0 && (
                <div className="text-right">
                  <p className="text-content-tertiary text-xs">{t('referral:withdrawal.pending')}</p>
                  <p className="text-yellow-400 text-lg font-bold">{stats.pendingWithdrawal.toFixed(2)} {currencySymbol}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`${threshold}+`}
                min={threshold}
                step="0.01"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-content-tertiary focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
              <Button
                variant="primary"
                fullWidth
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < threshold || parseFloat(withdrawAmount) > moneyBalance}
              >
                {withdrawing ? '...' : t('referral:withdrawal.request')}
              </Button>
            </div>
            <p className="text-content-tertiary text-xs">
              {t('referral:withdrawal.minimum', { amount: threshold, currency: currencySymbol })}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-white text-sm font-semibold mb-2 uppercase tracking-wider">
            {t('referral:withdrawal.history')}
          </h2>
          <Card padding="sm" className="space-y-2">
            {withdrawals.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 px-2 rounded-lg bg-white/5">
                <div>
                  <p className="text-white text-sm font-medium">
                    {w.amount.toFixed(2)} {w.currency === 'RUB' ? '\u20BD' : '$'}
                  </p>
                  <p className="text-content-tertiary text-[11px]">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <WithdrawalStatusBadge status={w.status} />
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const { t } = useTranslation('referral');
  const map: Record<WithdrawalStatus, { variant: 'warning' | 'cyan' | 'error' | 'success'; label: string }> = {
    PENDING: { variant: 'warning', label: t('withdrawal.statusPending') },
    APPROVED: { variant: 'cyan', label: t('withdrawal.statusApproved') },
    REJECTED: { variant: 'error', label: t('withdrawal.statusRejected') },
    PAID: { variant: 'success', label: t('withdrawal.statusPaid') },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default ReferralPage;
