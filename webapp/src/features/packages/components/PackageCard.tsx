import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@/shared/ui';
import { hapticImpact } from '@/services/telegram/haptic';
import type { Package } from '@/types/package.types';

interface PackageCardProps {
  pkg: Package;
  index: number;
  onDetailsClick: () => void;
  onPurchaseClick: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  index,
  onDetailsClick,
  onPurchaseClick,
}) => {
  const { t } = useTranslation('packages');
  const isPopular = pkg.tier === 'PRO';

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.08 }}
    >
      <Card
        className={
          isPopular
            ? 'ring-2 ring-purple-primary/60 relative overflow-visible'
            : ''
        }
      >
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-3 left-4">
            <Badge variant="purple" className="text-xs px-3 py-1 shadow-purple-glow">
              Popular
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white text-[22px] font-bold">{pkg.name}</h3>
            <p className="text-gray-text text-sm mt-0.5">
              {t('credits', { count: pkg.credits })}
            </p>
          </div>
          {pkg.isUnlimited && pkg.unlimitedModels?.length ? (
            <Badge variant="purple" className="mt-1">
              {pkg.unlimitedModels.join(', ')}
            </Badge>
          ) : null}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-white text-xl font-bold">${pkg.priceUSD}</span>
          <span className="text-gray-tertiary">/</span>
          <span className="text-gray-text text-base">{pkg.priceRUB} &#8381;</span>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mt-4">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-purple-primary mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white text-[15px] leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="space-y-2 mt-5">
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            onClick={onDetailsClick}
          >
            {t('whatsIncluded')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              hapticImpact('medium');
              onPurchaseClick();
            }}
          >
            {t('common:buy')}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
