import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useReferralStore } from '@/features/referral/store/referralStore';
import { Card, Button, Badge, Skeleton, Modal } from '@/shared/ui';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { hapticImpact } from '@/services/telegram/haptic';
import toast from 'react-hot-toast';

const ReferralPage: React.FC = () => {
  const { t } = useTranslation('referral');
  const {
    links,
    stats,
    benefits,
    maxLinks,
    isLoading,
    isCreating,
    fetchReferralLinks,
    createReferralLink,
    fetchBenefits,
  } = useReferralStore();
  const { copy } = useCopyToClipboard();
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(0);

  useEffect(() => {
    fetchReferralLinks();
    fetchBenefits();
  }, [fetchReferralLinks, fetchBenefits]);

  const handleCreateLink = async () => {
    hapticImpact('medium');
    await createReferralLink();
  };

  const handleCopyLink = async (url: string) => {
    const success = await copy(url);
    if (success) {
      toast.success(t('common:copied'));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-2xl" variant="rectangular" />
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-20 rounded-2xl" variant="rectangular" />
          <Skeleton className="flex-1 h-20 rounded-2xl" variant="rectangular" />
        </div>
        <Skeleton className="h-36 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 rounded-2xl" variant="rectangular" />
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
        <h1 className="text-white text-2xl font-bold">{t('title')}</h1>
        <p className="text-gray-text mt-2 text-[15px] leading-relaxed px-2">
          {t('description', { botName: 'AI Models Bot' })}
        </p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex gap-3"
        >
          <Card className="flex-1 text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">Invited</p>
            <p className="text-white text-2xl font-bold mt-1">{stats.totalInvited}</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">Earned</p>
            <p className="text-white text-2xl font-bold mt-1">{stats.totalEarned}</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="text-gray-text text-xs uppercase tracking-wider">Bonus</p>
            <p className="text-purple-primary text-2xl font-bold mt-1">{stats.currentTierBonus}%</p>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="border-2 border-dashed border-purple-primary/40 rounded-xl p-4 space-y-2"
      >
        <Button
          variant="primary"
          fullWidth
          onClick={handleCreateLink}
          isLoading={isCreating}
          disabled={links.length >= maxLinks}
        >
          {t('createLink')}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setBenefitsOpen(true)}>
          {t('benefits')}
        </Button>
      </motion.div>

      {/* Referral Links */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-bold">{t('myLinks')}</h2>
          <Badge variant="gray">
            {links.length}/{maxLinks}
          </Badge>
        </div>

        {links.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-text text-sm">No referral links yet. Create one above!</p>
          </Card>
        ) : (
          <>
            {/* Link cards with horizontal scroll */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory flex gap-3 scrollbar-hide">
              {links.map((link, index) => (
                <div
                  key={link.id}
                  className="snap-center shrink-0 w-[calc(100%-16px)] first:ml-0"
                  onClick={() => setActiveLink(index)}
                >
                  <Card className="space-y-3">
                    <p className="text-gray-text text-xs uppercase tracking-wider font-bold">
                      {t('linkLabel', { number: index + 1 })}
                    </p>
                    <p className="text-white text-sm font-mono break-all bg-dark-border/50 rounded-lg px-3 py-2">
                      {link.url}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray">
                        {t('invited', { count: link.invitedCount })}
                      </Badge>
                      <Badge variant="gray">
                        {t('creditsPurchased', { count: link.creditsPurchased })}
                      </Badge>
                    </div>
                    <Button
                      variant="secondary"
                      fullWidth
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(link.url);
                      }}
                    >
                      {t('copyLink')}
                    </Button>
                  </Card>
                </div>
              ))}
            </div>

            {/* Pagination dots */}
            {links.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {links.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === activeLink ? 'bg-purple-primary' : 'bg-dark-border'
                    }`}
                  />
                ))}
              </div>
            )}

            {links.length > 1 && (
              <p className="text-gray-text text-xs text-center mt-2">
                {t('swipeHint')}
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* Benefits Modal */}
      <Modal
        isOpen={benefitsOpen}
        onClose={() => setBenefitsOpen(false)}
        title={t('benefits')}
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
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <span className="text-purple-600 font-bold text-sm">
                    {benefit.percentage}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm">{benefit.tier}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{benefit.description}</p>
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
