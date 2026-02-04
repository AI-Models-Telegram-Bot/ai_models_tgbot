import React from 'react';
import { Modal } from '@/shared/ui';
import type { SubscriptionPlan } from '@/types/subscription.types';

interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return 'Unlimited';
  return credits.toLocaleString();
};

export const FeaturesModal: React.FC<FeaturesModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan.name} size="md">
      <div className="p-5 space-y-5">
        {/* Credits overview */}
        <div>
          <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
            Credits per month
          </h4>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {[
              { label: 'Text', value: plan.credits.text, color: 'bg-cyan-500' },
              { label: 'Image', value: plan.credits.image, color: 'bg-pink-500' },
              { label: 'Video', value: plan.credits.video, color: 'bg-purple-500' },
              { label: 'Audio', value: plan.credits.audio, color: 'bg-emerald-500' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"
              >
                <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-1.5`} />
                <p className="text-white text-sm font-semibold font-mono">
                  {formatCredits(item.value)}
                </p>
                <p className="text-content-tertiary text-[10px] mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All features */}
        <div>
          <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
            All features
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
                <span className="text-content-secondary text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {plan.prioritySupport && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
              Priority Support
            </span>
          )}
          {plan.apiAccess && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-medium">
              API Access
            </span>
          )}
          {plan.referralBonus > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-medium">
              {plan.referralBonus}% Referral Bonus
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};
