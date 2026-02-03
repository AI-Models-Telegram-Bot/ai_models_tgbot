import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Modal } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { hapticImpact } from '@/services/telegram/haptic';
import type { PaymentMethod } from '@/types/payment.types';
import type { Package } from '@/types/package.types';

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package | null;
  onSelect: (method: PaymentMethod) => void;
}

interface MethodOption {
  id: PaymentMethod;
  icon: string;
  labelKey: string;
  description: string;
  priceDisplay: (pkg: Package) => string;
}

const methods: MethodOption[] = [
  {
    id: 'telegram_stars',
    icon: '⭐',
    labelKey: 'payment:telegramStars',
    description: 'Pay directly in Telegram',
    priceDisplay: (pkg) => `${pkg.priceStars} Stars`,
  },
  {
    id: 'stripe',
    icon: '💳',
    labelKey: 'payment:creditCard',
    description: 'Visa, Mastercard, Apple Pay',
    priceDisplay: (pkg) => `$${pkg.priceUSD}`,
  },
  {
    id: 'yookassa',
    icon: '🇷🇺',
    labelKey: 'payment:russianMethods',
    description: 'SberPay, YooMoney, bank cards',
    priceDisplay: (pkg) => `${pkg.priceRUB} ₽`,
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  isOpen,
  onClose,
  pkg,
  onSelect,
}) => {
  const { t } = useTranslation();

  if (!pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payment:selectMethod', { defaultValue: 'Select Payment Method' })} size="sm">
      <div className="p-4 space-y-3 pb-8">
        {/* Package summary */}
        <div className="text-center pb-3 border-b border-gray-200">
          <p className="text-gray-900 text-lg font-bold">{pkg.name}</p>
          <p className="text-gray-500 text-sm">{pkg.credits} credits</p>
        </div>

        {/* Payment methods */}
        {methods.map((method, index) => (
          <motion.button
            key={method.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => {
              hapticImpact('light');
              onSelect(method.id);
            }}
            className={cn(
              'w-full flex items-center p-4 rounded-xl',
              'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50',
              'transition-all duration-150 active:scale-[0.98]',
              'text-left'
            )}
          >
            <span className="text-2xl text-center mr-3" style={{ width: 32 }}>{method.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium text-[15px]">
                {t(method.labelKey, { defaultValue: method.labelKey.split(':')[1] })}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{method.description}</p>
            </div>
            <span className="text-gray-900 font-semibold text-sm shrink-0">
              {method.priceDisplay(pkg)}
            </span>
          </motion.button>
        ))}
      </div>
    </Modal>
  );
};
