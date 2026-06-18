import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReferralStore } from '@/features/referral/store/referralStore';
import { Card, Button, Skeleton, Badge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { openTelegramLink } from '@/services/telegram/telegram';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import type { ReferralMode, WithdrawalStatus } from '@/types/referral.types';
import toast from 'react-hot-toast';

const TIER_ORDER = ['STARTER', 'PRO', 'PREMIUM', 'BUSINESS'] as const;

const CheckMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-content-tertiary text-xs font-medium mb-2 uppercase tracking-wider">{children}</h2>
);

const ReferralPage: React.FC = () => {
  const { t } = useTranslation(['referral', 'common', 'subscriptions']);
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

  const threshold = withdrawalThresholds.RUB;
  const currencySymbol = '₽';

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
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-28 rounded-2xl" variant="rectangular" />
          <Skeleton className="flex-1 h-28 rounded-2xl" variant="rectangular" />
        </div>
        <Skeleton className="h-36 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 max-w-2xl mx-auto w-full space-y-6 pb-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-display text-2xl font-semibold text-content-primary tracking-tight">{t('referral:title')}</h1>
        <p className="text-content-secondary mt-1.5 text-sm leading-relaxed">
          {t('referral:description')}
        </p>
      </header>

      {/* Invitee Bonus */}
      <Card variant="bordered">
        <p className="text-content-primary text-sm font-semibold">{t('referral:inviteeBonus.title')}</p>
        <p className="text-content-secondary text-xs mt-1">
          {t('referral:inviteeBonus.description', { bonus: inviteeBonus })}
        </p>
      </Card>

      {/* Commission Mode Toggle */}
      <section>
        <SectionTitle>{t('referral:commissionMode')}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleModeSwitch('TOKENS')}
            className={cn(
              'relative rounded-2xl p-4 text-left transition-colors duration-200 border',
              referralMode === 'TOKENS'
                ? 'border-brand-primary/60 bg-brand-primary/10'
                : 'border-border bg-surface-card hover:border-border-strong'
            )}
          >
            {referralMode === 'TOKENS' && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-surface-bg">
                <CheckMark />
              </span>
            )}
            <p className="text-content-primary font-semibold text-lg font-mono tracking-tight">{tokenRange.min}–{tokenRange.max}%</p>
            <p className="text-content-tertiary text-xs mt-1">{t('referral:inTokens')}</p>
          </button>

          <button
            onClick={() => handleModeSwitch('CASH')}
            className={cn(
              'relative rounded-2xl p-4 text-left transition-colors duration-200 border',
              referralMode === 'CASH'
                ? 'border-brand-accent/60 bg-brand-accent/10'
                : 'border-border bg-surface-card hover:border-border-strong'
            )}
          >
            {referralMode === 'CASH' && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center text-surface-bg">
                <CheckMark />
              </span>
            )}
            <p className="text-content-primary font-semibold text-lg font-mono tracking-tight">{cashRange.min}–{cashRange.max}%</p>
            <p className="text-content-tertiary text-xs mt-1">{t('referral:inCash')}</p>
          </button>
        </div>
      </section>

      {/* Tiered Rates Table */}
      <Card padding="sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-content-tertiary uppercase tracking-wider">
              <th className="text-left py-1.5 px-2 font-medium">{t('referral:ratesTable.plan')}</th>
              <th className="text-center py-1.5 px-2 font-medium">{t('referral:ratesTable.tokens')}</th>
              <th className="text-center py-1.5 px-2 font-medium">{t('referral:ratesTable.cash')}</th>
            </tr>
          </thead>
          <tbody>
            {TIER_ORDER.map((tier) => {
              const r = commissionRates[tier];
              if (!r) return null;
              return (
                <tr key={tier} className="border-t border-border">
                  <td className="py-2 px-2 text-content-primary font-medium">{t(`subscriptions:tiers.${tier.toLowerCase()}`)}</td>
                  <td className={cn('py-2 px-2 text-center font-mono font-semibold', referralMode === 'TOKENS' ? 'text-brand-primary' : 'text-content-secondary')}>
                    {r.tokenPercent}%
                  </td>
                  <td className={cn('py-2 px-2 text-center font-mono font-semibold', referralMode === 'CASH' ? 'text-brand-accent' : 'text-content-secondary')}>
                    {r.cashPercent}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.invited')}</p>
            <p className="text-content-primary text-xl font-semibold font-mono mt-1.5">{stats.totalInvited}</p>
          </Card>
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.tokensEarned')}</p>
            <p className="text-brand-primary text-xl font-semibold font-mono mt-1.5">{stats.tokensEarned}</p>
          </Card>
          <Card className="text-center" padding="sm">
            <p className="text-content-tertiary text-[10px] uppercase tracking-wider">{t('referral:stats.cashEarned')}</p>
            <p className="text-brand-accent text-xl font-semibold font-mono mt-1.5">
              {stats.cashEarned.toFixed(0)}{currencySymbol}
            </p>
          </Card>
        </div>
      )}

      {/* Referral Link */}
      <section>
        <SectionTitle>{t('referral:yourLink')}</SectionTitle>
        <Card className="space-y-3">
          {referralUrl ? (
            <p className="text-content-primary text-sm font-mono break-all bg-surface-secondary rounded-lg px-3 py-2.5">
              {referralUrl}
            </p>
          ) : (
            <div className="bg-surface-secondary rounded-lg px-3 py-2.5">
              <Skeleton variant="text" className="h-5 w-full rounded" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="primary" fullWidth size="sm" onClick={handleShare} disabled={!referralUrl}>
              {t('referral:share')}
            </Button>
            <Button variant="secondary" fullWidth size="sm" onClick={handleCopyLink} disabled={!referralUrl}>
              {t('referral:copyLink')}
            </Button>
          </div>
        </Card>
      </section>

      {/* Withdrawal Section */}
      {(referralMode === 'CASH' || (stats && stats.cashEarned > 0)) && (
        <section>
          <SectionTitle>{t('referral:withdrawal.title')}</SectionTitle>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-content-tertiary text-xs">{t('referral:withdrawal.available')}</p>
                <p className="text-content-primary text-lg font-semibold font-mono mt-0.5">{moneyBalance.toFixed(2)} {currencySymbol}</p>
              </div>
              {stats && stats.pendingWithdrawal > 0 && (
                <div className="text-right">
                  <p className="text-content-tertiary text-xs">{t('referral:withdrawal.pending')}</p>
                  <p className="text-warning text-lg font-semibold font-mono mt-0.5">{stats.pendingWithdrawal.toFixed(2)} {currencySymbol}</p>
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
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-content-primary text-sm placeholder-content-tertiary focus:outline-none focus:border-brand-primary/50 transition-colors tabular-nums"
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
        </section>
      )}

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <section>
          <SectionTitle>{t('referral:withdrawal.history')}</SectionTitle>
          <Card padding="sm" className="space-y-2">
            {withdrawals.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 px-2 rounded-lg bg-surface-secondary">
                <div>
                  <p className="text-content-primary text-sm font-medium font-mono">
                    {w.amount.toFixed(2)} ₽
                  </p>
                  <p className="text-content-tertiary text-[11px]">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <WithdrawalStatusBadge status={w.status} />
              </div>
            ))}
          </Card>
        </section>
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
