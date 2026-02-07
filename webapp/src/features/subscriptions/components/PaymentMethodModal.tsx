import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Skeleton } from '@/shared/ui';
import { paymentApi } from '@/services/api/payment.api';
import { openTelegramInvoice } from '@/services/telegram/telegram';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import type { SubscriptionPlan } from '@/types/subscription.types';
import type { PaymentMethodInfo, PaymentMethod } from '@/types/payment.types';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  telegramId: string;
  onSuccess?: () => void;
}

const formatPrice = (priceUSD: number | null, priceRUB: number | null, lang: string) => {
  if (priceUSD === null) return lang === 'ru' ? 'По запросу' : 'Contact Us';
  if (priceUSD === 0) return lang === 'ru' ? 'Бесплатно' : 'Free';
  const rub = priceRUB ? `${priceRUB.toLocaleString()} ₽` : '';
  const usd = `$${priceUSD}`;
  return lang === 'ru' && rub ? `${rub} / ${usd}` : usd;
};

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  plan,
  telegramId,
  onSuccess,
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const [methods, setMethods] = useState<PaymentMethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (isOpen && methods.length === 0) {
      setIsLoading(true);
      paymentApi
        .getMethods()
        .then((data) => {
          setMethods(data.methods);
          // Auto-select first available method
          const firstAvailable = data.methods.find((m) => m.available);
          if (firstAvailable) {
            setSelectedMethod(firstAvailable.id);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [isOpen, methods.length]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setError(null);
    hapticImpact('medium');

    try {
      const response = await paymentApi.create({
        telegramId,
        tier: plan.tier,
        paymentMethod: selectedMethod,
      });

      if (response.method === 'telegram_stars' && 'invoiceUrl' in response) {
        // Open Telegram invoice
        openTelegramInvoice(response.invoiceUrl, (status) => {
          if (status === 'paid') {
            hapticNotification('success');
            onSuccess?.();
            onClose();
          } else if (status === 'cancelled') {
            hapticNotification('warning');
            setError(lang === 'ru' ? 'Платёж отменён' : 'Payment cancelled');
          } else if (status === 'failed') {
            hapticNotification('error');
            setError(lang === 'ru' ? 'Платёж не удался' : 'Payment failed');
          }
          setIsProcessing(false);
        });
      } else if ('status' in response && response.status === 'coming_soon') {
        setError(lang === 'ru' ? 'Этот способ оплаты скоро будет доступен' : 'This payment method is coming soon');
        setIsProcessing(false);
      } else if (response.method === 'contact') {
        // Contact us flow
        setError(lang === 'ru'
          ? 'Для Enterprise тарифа свяжитесь с нами напрямую'
          : 'For Enterprise plan, please contact us directly');
        setIsProcessing(false);
      }
    } catch (err: any) {
      hapticNotification('error');
      setError(err.message || (lang === 'ru' ? 'Ошибка создания платежа' : 'Failed to create payment'));
      setIsProcessing(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsProcessing(false);
      setSelectedMethod(methods.find((m) => m.available)?.id || null);
    }
  }, [isOpen, methods]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'ru' ? 'Выберите способ оплаты' : 'Select Payment Method'}
      size="md"
    >
      <div className="p-5 space-y-5">
        {/* Plan summary */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{plan.name}</p>
              <p className="text-content-tertiary text-xs mt-0.5">
                {lang === 'ru' ? 'Месячная подписка' : 'Monthly subscription'}
              </p>
            </div>
            <p className="text-xl font-bold text-white font-mono">
              {formatPrice(plan.priceUSD, plan.priceRUB, lang)}
            </p>
          </div>
        </div>

        {/* Payment methods */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton variant="rectangular" height={64} className="rounded-xl" />
            <Skeleton variant="rectangular" height={64} className="rounded-xl" />
          </div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  if (method.available) {
                    hapticImpact('light');
                    setSelectedMethod(method.id);
                  }
                }}
                disabled={!method.available || isProcessing}
                className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                  selectedMethod === method.id
                    ? 'border-brand-primary bg-brand-primary/10'
                    : method.available
                    ? 'border-white/10 bg-white/5 hover:border-white/20'
                    : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl mr-3">{method.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">
                    {lang === 'ru' ? method.nameRu : method.name}
                  </p>
                  <p className="text-content-tertiary text-xs">
                    {lang === 'ru' ? method.descriptionRu : method.description}
                  </p>
                </div>
                {method.comingSoon && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-content-tertiary/20 text-content-tertiary">
                    {lang === 'ru' ? 'Скоро' : 'Soon'}
                  </span>
                )}
                {selectedMethod === method.id && method.available && (
                  <span className="text-brand-primary ml-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Pay button */}
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing || isLoading}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center" style={{ columnGap: 8 }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {lang === 'ru' ? 'Обработка...' : 'Processing...'}
            </span>
          ) : (
            <>
              {selectedMethod === 'telegram_stars' && '⭐ '}
              {lang === 'ru' ? 'Оплатить' : 'Pay'} {formatPrice(plan.priceUSD, plan.priceRUB, lang)}
            </>
          )}
        </Button>

        <p className="text-content-tertiary text-[10px] text-center">
          {lang === 'ru'
            ? 'Нажимая "Оплатить", вы соглашаетесь с условиями подписки'
            : 'By clicking "Pay", you agree to the subscription terms'}
        </p>
      </div>
    </Modal>
  );
};
