import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useReferralStore } from '@/features/referral/store/referralStore';
import { Card, Button, Skeleton, Modal } from '@/shared/ui';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import { openTelegramLink } from '@/services/telegram/telegram';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import toast from 'react-hot-toast';

const ReferralPage: React.FC = () => {
  const { t } = useTranslation(['referral', 'common']);
  const { isLoading: isTelegramLoading } = useTelegramUser();
  const {
    referralUrl,
    stats,
    benefits,
    isLoading,
    fetchReferralInfo,
    fetchBenefits,
  } = useReferralStore();
  const { copy } = useCopyToClipboard();
  const [benefitsOpen, setBenefitsOpen] = useState(false);

  // Wait for Telegram SDK to initialize before fetching (initData must be ready for auth)
  useEffect(() => {
    if (!isTelegramLoading) {
      fetchReferralInfo();
      fetchBenefits();
    }
  }, [isTelegramLoading, fetchReferralInfo, fetchBenefits]);

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
    const text = t('referral:shareText');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`;
    openTelegramLink(shareUrl);
  };

  if (isLoading || isTelegramLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-2xl" variant="rectangular" />
        <div className="flex" style={{ columnGap: 12 }}>
          <Skeleton className="flex-1 h-20 rounded-2xl" variant="rectangular" />
          <Skeleton className="flex-1 h-20 rounded-2xl" variant="rectangular" />
        </div>
        <Skeleton className="h-36 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center pt-2"
      >
        <h1 className="text-white text-2xl font-bold">{t('referral:title')}</h1>
        <p className="text-gray-text mt-2 text-[15px] leading-relaxed px-2">
          {t('referral:description')}
        </p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3"
          style={{ gap: 12 }}
        >
          <Card className="text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">{t('referral:stats.invited')}</p>
            <p className="text-white text-2xl font-bold mt-1">{stats.totalInvited}</p>
          </Card>
          <Card className="text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">{t('referral:stats.earned')}</p>
            <p className="text-white text-2xl font-bold mt-1">{stats.totalEarned}</p>
          </Card>
          <Card className="text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">{t('referral:stats.bonus')}</p>
            <p className="text-purple-primary text-2xl font-bold mt-1">{stats.currentTierBonus}%</p>
          </Card>
        </motion.div>
      )}

      {/* Referral Link */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-white text-lg font-bold mb-3">{t('referral:yourLink')}</h2>
        <Card className="space-y-3">
          {referralUrl ? (
            <p className="text-white text-sm font-mono break-all bg-dark-border/50 rounded-lg px-3 py-2">
              {referralUrl}
            </p>
          ) : (
            <div className="bg-dark-border/50 rounded-lg px-3 py-2">
              <Skeleton variant="text" className="h-5 w-full rounded" />
            </div>
          )}
          <div className="flex" style={{ columnGap: 8 }}>
            <Button
              variant="primary"
              fullWidth
              size="sm"
              onClick={handleShare}
              disabled={!referralUrl}
            >
              {t('referral:share')}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={handleCopyLink}
              disabled={!referralUrl}
            >
              {t('referral:copyLink')}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Benefits button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Button variant="secondary" fullWidth onClick={() => setBenefitsOpen(true)}>
          {t('referral:benefits')}
        </Button>
      </motion.div>

      {/* Benefits Modal */}
      <Modal
        isOpen={benefitsOpen}
        onClose={() => setBenefitsOpen(false)}
        title={t('referral:benefits')}
        size="sm"
      >
        <div className="p-4 space-y-3 pb-8">
          <AnimatePresence>
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.tier}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10"
                style={{ columnGap: 12 }}
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-brand-primary font-bold text-sm">
                    {benefit.percentage}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{benefit.name}</p>
                  <p className="text-content-tertiary text-xs mt-0.5">
                    {t('referral:bonusDescription', { percentage: benefit.percentage })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
};

export default ReferralPage;
