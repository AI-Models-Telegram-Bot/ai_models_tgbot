import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Skeleton } from '@/shared/ui';
import { subscriptionApi } from '@/services/api/subscription.api';
import type { SubscriptionPlan, TierModelsResponse, TierModel } from '@/types/subscription.types';

interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '∞';
  return credits.toLocaleString();
};

const CategoryIcon: React.FC<{ category: 'text' | 'image' | 'video' | 'audio' }> = ({ category }) => {
  const icons = {
    text: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    image: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
    video: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    audio: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  };
  return icons[category];
};

const categoryColors = {
  text: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  image: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  video: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  audio: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const ModelList: React.FC<{
  category: 'text' | 'image' | 'video' | 'audio';
  models: TierModel[];
}> = ({ category, models }) => {
  const { t } = useTranslation('subscriptions');
  const colors = categoryColors[category];
  const categoryLabels: Record<string, string> = {
    text: t('categories.text', 'Text Models'),
    image: t('categories.image', 'Image Generation'),
    video: t('categories.video', 'Video Generation'),
    audio: t('categories.audio', 'Audio & Voice'),
  };

  if (models.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-xl ${colors.bg} border ${colors.border} p-4`}>
      <div className="flex items-center mb-3" style={{ columnGap: 8 }}>
        <span className={colors.text}>
          <CategoryIcon category={category} />
        </span>
        <span className="text-white text-sm font-semibold">{categoryLabels[category]}</span>
      </div>
      <div className="space-y-2">
        {models.map((model) => (
          <div
            key={model.id}
            className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center min-w-0" style={{ columnGap: 8 }}>
              <span className="text-white text-sm truncate">{model.name}</span>
              {model.isUnlimited && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-accent/20 text-brand-accent">
                  {t('unlimited', 'Unlimited')}
                </span>
              )}
            </div>
            {!model.isUnlimited && (
              <span className="shrink-0 text-content-tertiary text-xs font-mono ml-2">
                {model.creditCost} {t('tokensShort', 'tk')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FeaturesModal: React.FC<FeaturesModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const { t } = useTranslation(['subscriptions', 'common', 'profile']);
  const [modelsData, setModelsData] = useState<TierModelsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !modelsData) {
      setIsLoading(true);
      setError(null);
      subscriptionApi
        .getModelsForTier(plan.tier)
        .then((data) => {
          setModelsData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load models');
          setIsLoading(false);
        });
    }
  }, [isOpen, plan.tier, modelsData]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModelsData(null);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan.name} size="lg">
      <div className="p-5 space-y-4 pb-8">
        {/* Token overview */}
        <div>
          <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
            {t('subscriptions:tokensPerMonth', 'Monthly Tokens')}
          </h4>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className={`text-lg font-bold font-mono ${plan.tokens === null ? 'text-brand-accent' : 'text-white'}`}>
              {formatCredits(plan.tokens)}
            </p>
            <p className="text-content-tertiary text-xs">{t('subscriptions:tokensLabel', 'tokens')}</p>
          </div>
        </div>

        {/* AI Models by Category */}
        <div>
          <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
            {t('subscriptions:availableModels', 'Available AI Models')}
          </h4>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton variant="rectangular" height={120} className="rounded-xl" />
              <Skeleton variant="rectangular" height={120} className="rounded-xl" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-content-secondary text-sm">{error}</p>
              <button
                onClick={() => {
                  setModelsData(null);
                  setError(null);
                }}
                className="text-brand-primary text-sm mt-2"
              >
                {t('common:retry', 'Retry')}
              </button>
            </div>
          ) : modelsData ? (
            <div className="space-y-3">
              <ModelList category="text" models={modelsData.models.text} />
              <ModelList category="image" models={modelsData.models.image} />
              <ModelList category="video" models={modelsData.models.video} />

              {modelsData.models.text.length === 0 &&
                modelsData.models.image.length === 0 &&
                modelsData.models.video.length === 0 && (
                  <p className="text-content-tertiary text-sm text-center py-4">
                    {t('subscriptions:noModelsAvailable', 'No models available for this tier')}
                  </p>
                )}
            </div>
          ) : null}
        </div>

        {/* Features & Extras */}
        {plan.features.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
              {t('subscriptions:featuresTitle', 'Features')}
            </h4>
            <div className="space-y-2">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start" style={{ columnGap: 10 }}>
                  <span className="text-brand-primary mt-0.5 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.15" />
                      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-content-secondary text-sm">{t(`subscriptions:${feature}`, feature)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap" style={{ rowGap: 8, columnGap: 8 }}>
          {plan.prioritySupport && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
              {t('subscriptions:prioritySupport', 'Priority Support')}
            </span>
          )}
          {plan.referralBonus > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-medium">
              {plan.referralBonus}% {t('subscriptions:referralBonus', 'Referral Bonus')}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};
