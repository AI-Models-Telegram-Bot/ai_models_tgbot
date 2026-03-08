import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { UserCard } from '@/features/profile/components/UserCard';
import { CurrentPlanCard } from '@/features/profile/components/CurrentPlanCard';
import { CreditAllocationBar } from '@/features/subscriptions/components/CreditAllocationBar';
import { ParticleBackground, Skeleton, Card } from '@/shared/ui';
import { useTelegramUser } from '@/services/telegram/useTelegramUser';
import { isTelegramEnvironment } from '@/services/telegram/telegram';
import { formatCredits } from '@/shared/utils/formatters';
import { getActivePromo } from '@/config/promoConfig';

// ── Profile promo decorations ─────────────────────────────────

const ProfilePromoHeart: React.FC<{ style: React.CSSProperties; delay: number; size?: number }> = ({ style, delay, size = 20 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={style}
    animate={{
      opacity: [0.3, 0.7, 0.3],
      scale: [0.9, 1.15, 0.9],
      y: [0, -6, 0],
      rotate: [0, 8, -5, 0],
    }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ filter: 'drop-shadow(0 2px 8px rgba(255,107,157,0.5))' }}>
      <defs>
        <linearGradient id={`ph${size}${delay}`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffb3d0" />
          <stop offset="100%" stopColor="#ff2d6f" />
        </linearGradient>
      </defs>
      <path d="M16 28 C16 28 3 20 3 11 C3 6 7 3 11 3 C13.5 3 15.5 4.5 16 6 C16.5 4.5 18.5 3 21 3 C25 3 29 6 29 11 C29 20 16 28 16 28Z" fill={`url(#ph${size}${delay})`} />
      <path d="M11 8 C9 8 7 10 7 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  </motion.div>
);

const ProfilePromoStar: React.FC<{ style: React.CSSProperties; delay: number; size?: number; color?: string }> = ({ style, delay, size = 12, color = '#ffd700' }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={style}
    animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.3, 0.4], rotate: [0, 90, 180] }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
      <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill={color} opacity="0.85" />
    </svg>
  </motion.div>
);

const ProfilePromoBanner: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const isRu = i18n.language.startsWith('ru');
  const promo = getActivePromo();
  if (!promo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      onClick={onNavigate}
    >
      {/* Background */}
      <div className="absolute inset-0 promo-gradient-bg" />
      <div className="absolute inset-0 promo-shimmer-sweep" />

      {/* Floating decorations */}
      <ProfilePromoHeart style={{ top: 4, right: 8 }} delay={0} size={18} />
      <ProfilePromoHeart style={{ bottom: 6, left: 12 }} delay={1.2} size={14} />
      <ProfilePromoStar style={{ top: 8, left: 8 }} delay={0.5} size={11} color="#ffd700" />
      <ProfilePromoStar style={{ bottom: 10, right: 28 }} delay={1.8} size={9} color="#ff85b3" />
      <ProfilePromoStar style={{ top: '50%', right: '45%' }} delay={2.5} size={8} color="#ffffff" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center" style={{ columnGap: 10 }}>
          <span className="text-2xl">🌸</span>
          <div>
            <p className="text-white text-sm font-semibold">
              {isRu ? 'С 8 Марта!' : "Happy Women's Day!"}
            </p>
            <p className="text-white/60 text-xs">
              {isRu ? `Скидка ${promo.discountPercent}% на всё` : `${promo.discountPercent}% off everything`}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center"
          style={{ columnGap: 4 }}
        >
          <span className="promo-mini-badge">−{promo.discountPercent}%</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, wallet, currentPlan, stats, isLoading, error, fetchUserProfile, fetchWebProfile } =
    useProfileStore();

  const isTelegram = isTelegramEnvironment();

  // Use hook that polls for Telegram readiness (handles menu button timing)
  const { telegramId, isLoading: isTelegramLoading } = useTelegramUser();

  // Fetch profile on mount
  useEffect(() => {
    if (isTelegram && telegramId) {
      fetchUserProfile(telegramId);
    } else if (!isTelegram) {
      fetchWebProfile();
    }
  }, [fetchUserProfile, fetchWebProfile, telegramId, isTelegram]);

  // Auto-refresh: refetch on visibility change + every 60s
  useEffect(() => {
    const refresh = () => {
      if (isTelegram && telegramId) fetchUserProfile(telegramId);
      else if (!isTelegram) fetchWebProfile();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(refresh, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [fetchUserProfile, fetchWebProfile, telegramId, isTelegram]);

  // Still waiting for Telegram SDK to initialize (Telegram env only)
  if (isTelegram && isTelegramLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-32 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 w-full rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-32 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 w-full rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-content-secondary text-sm">{error}</p>
        <button
          onClick={() => isTelegram && telegramId ? fetchUserProfile(telegramId) : fetchWebProfile()}
          className="mt-4 text-brand-primary text-sm font-medium"
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  // Data loaded but user/wallet still null — shouldn't normally happen, show loading
  if (!user || !wallet) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-32 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 w-full rounded-2xl" variant="rectangular" />
        <Skeleton className="h-48 w-full rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <div className="relative z-10 p-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* Promo banner */}
        <ProfilePromoBanner onNavigate={() => navigate('/subscriptions')} />

        {/* User profile + balance */}
        <UserCard user={user} wallet={wallet} />
        <CurrentPlanCard
          plan={currentPlan}
          onViewPlans={() => navigate('/subscriptions')}
        />

        {/* Token Usage */}
        {currentPlan && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-content-tertiary uppercase tracking-wider mb-3">
                {t('profile:tokenUsage', 'Token Usage')}
              </h3>
              <CreditAllocationBar
                label={t('profile:tokens', 'Tokens')}
                icon="⚡"
                used={wallet.tokenBalance}
                total={currentPlan.tokens}
                color="bg-brand-primary"
              />
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        {stats && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <p className="text-content-tertiary text-xs uppercase tracking-wider">
                  {t('profile:totalRequests', 'Requests')}
                </p>
                <p className="text-white text-xl font-bold font-mono mt-1">
                  {formatCredits(stats.totalRequests)}
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-content-tertiary text-xs uppercase tracking-wider">
                  {t('profile:totalSpent', 'Total Spent')}
                </p>
                <p className="text-white text-xl font-bold font-mono mt-1">
                  {stats.totalSpent.toFixed(2)} ₽
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
