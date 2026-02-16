import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Modal, Button, Skeleton } from '@/shared/ui';
import { paymentApi } from '@/services/api/payment.api';
import { openTelegramInvoice, isTelegramEnvironment } from '@/services/telegram/telegram';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import type { SubscriptionPlan } from '@/types/subscription.types';
import type { PaymentMethodInfo, PaymentMethod } from '@/types/payment.types';

// ── Brand styles per payment method ──────────────────────────────

const METHOD_STYLES: Record<string, {
  selectedBorder: string;
  selectedBg: string;
  accentColor: string;
}> = {
  sbp: {
    selectedBorder: 'border-[#5B2D8E]',
    selectedBg: 'bg-[#5B2D8E]/10',
    accentColor: 'text-[#00AEEF]',
  },
  sberpay: {
    selectedBorder: 'border-[#21A038]',
    selectedBg: 'bg-[#21A038]/10',
    accentColor: 'text-[#21A038]',
  },
  card_ru: {
    selectedBorder: 'border-brand-primary',
    selectedBg: 'bg-brand-primary/10',
    accentColor: 'text-brand-primary',
  },
  telegram_stars: {
    selectedBorder: 'border-[#E5A100]',
    selectedBg: 'bg-[#E5A100]/10',
    accentColor: 'text-[#FFD700]',
  },
};

// ── Inline SVG icons ─────────────────────────────────────────────

const PaymentIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'sbp':
      // СБП (Система быстрых платежей) — official logo: multi-colored diamond rhombuses
      return (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="8" fill="white" />
          {/* SBP logo — 4 colored triangles forming the distinctive diamond pattern */}
          <g transform="translate(8, 5) scale(0.6)">
            {/* Top-left — blue */}
            <polygon points="20,0 0,12 0,20 20,8" fill="#5B57A2" />
            {/* Top-right — green */}
            <polygon points="20,0 40,12 40,20 20,8" fill="#21A038" />
            {/* Middle-left — orange/red */}
            <polygon points="0,20 0,30 20,42 20,32" fill="#F26126" />
            {/* Middle-right — blue */}
            <polygon points="40,20 40,30 20,42 20,32" fill="#1D71B8" />
            {/* Center-left — yellow */}
            <polygon points="0,20 20,8 20,32" fill="#FBB034" />
            {/* Center-right — teal */}
            <polygon points="40,20 20,8 20,32" fill="#00AEEF" />
          </g>
        </svg>
      );
    case 'sberpay':
      // Sber — official logo: gradient circle with checkmark-like swoosh
      return (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <defs>
            <linearGradient id="sber_grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#21A038" />
              <stop offset="100%" stopColor="#68D44F" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="8" fill="url(#sber_grad)" />
          {/* Sber circle mark with gradient arc */}
          <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
          <path
            d="M20 10 A10 10 0 0 1 29.5 16"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
          />
          <path
            d="M20 30 A10 10 0 0 1 10.5 24"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Horizontal bar through center */}
          <line x1="12" y1="20" x2="28" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'card':
      return (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="8" fill="#3B3B5C" />
          <rect x="6" y="10" width="28" height="20" rx="3" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" />
          <rect x="6" y="15" width="28" height="4" fill="white" fillOpacity="0.25" />
          <rect x="10" y="23" width="8" height="2" rx="1" fill="white" fillOpacity="0.6" />
          <rect x="22" y="23" width="4" height="2" rx="1" fill="white" fillOpacity="0.3" />
        </svg>
      );
    case 'stars':
      // Telegram Stars — official Telegram star icon (6-pointed star)
      return (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <defs>
            <linearGradient id="tg_star_grad" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#F5A623" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="8" fill="url(#tg_star_grad)" />
          {/* Telegram Star — 6-pointed star */}
          <path
            d="M20 6 L22.8 15.2 L32 15.2 L24.6 21 L27.4 30.2 L20 24.4 L12.6 30.2 L15.4 21 L8 15.2 L17.2 15.2 Z"
            fill="white"
          />
        </svg>
      );
    default:
      return <span className="text-2xl">💳</span>;
  }
};

// ── Component ────────────────────────────────────────────────────

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  telegramId: string;
  onSuccess?: () => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  plan,
  telegramId,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation(['subscriptions', 'common']);
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
          // Filter out Telegram Stars on web — only available inside Telegram app
          const filtered = isTelegramEnvironment()
            ? data.methods
            : data.methods.filter((m) => m.id !== 'telegram_stars');
          setMethods(filtered);
          const firstAvailable = filtered.find((m) => m.available);
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
        returnUrl: `${window.location.origin}/payment/success`,
      });

      if (response.method === 'telegram_stars' && 'invoiceUrl' in response) {
        openTelegramInvoice(response.invoiceUrl, (status) => {
          if (status === 'paid') {
            hapticNotification('success');
            onSuccess?.();
            onClose();
          } else if (status === 'cancelled') {
            hapticNotification('warning');
            setError(t('subscriptions:payment.cancelled'));
          } else if (status === 'failed') {
            hapticNotification('error');
            setError(t('subscriptions:payment.failed'));
          }
          setIsProcessing(false);
        });
      } else if (response.method === 'yookassa' && 'confirmationUrl' in response) {
        window.location.href = response.confirmationUrl;
      } else if (response.method === 'contact') {
        setError(t('subscriptions:payment.enterpriseContact'));
        setIsProcessing(false);
      }
    } catch (err: any) {
      hapticNotification('error');
      setError(err.message || t('subscriptions:payment.createError'));
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsProcessing(false);
      setSelectedMethod(methods.find((m) => m.available)?.id || null);
    }
  }, [isOpen, methods]);

  // Show RUB for Russian methods, USD for Telegram Stars
  const isRubMethod = selectedMethod && selectedMethod !== 'telegram_stars';
  const buttonPrice = isRubMethod
    ? plan.priceRUB ? `${plan.priceRUB.toLocaleString()} ₽` : ''
    : plan.priceUSD ? `$${plan.priceUSD}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('subscriptions:payment.selectMethod')}
      size="md"
    >
      <div className="p-5 space-y-4">
        {/* Plan summary */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{plan.name}</p>
              <p className="text-content-tertiary text-xs mt-0.5">
                {t('subscriptions:payment.monthlySubscription')}
              </p>
            </div>
            <div className="text-right">
              {plan.priceRUB ? (
                <p className="text-lg font-bold text-white font-mono">
                  {plan.priceRUB.toLocaleString()} ₽
                </p>
              ) : null}
              {plan.priceUSD ? (
                <p className={`font-mono ${plan.priceRUB ? 'text-xs text-content-tertiary' : 'text-lg font-bold text-white'}`}>
                  ${plan.priceUSD}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Payment methods */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton variant="rectangular" height={60} className="rounded-xl" />
            <Skeleton variant="rectangular" height={60} className="rounded-xl" />
            <Skeleton variant="rectangular" height={60} className="rounded-xl" />
          </div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => {
              const style = METHOD_STYLES[method.id];
              const isSelected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  onClick={() => {
                    if (method.available) {
                      hapticImpact('light');
                      setSelectedMethod(method.id);
                    }
                  }}
                  disabled={!method.available || isProcessing}
                  className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? `${style?.selectedBorder || 'border-brand-primary'} ${style?.selectedBg || 'bg-brand-primary/10'}`
                      : method.available
                      ? 'border-white/10 bg-white/5 hover:border-white/20'
                      : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0">
                    <PaymentIcon type={method.icon} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white text-sm font-medium">
                      {lang === 'ru' ? method.nameRu : method.name}
                    </p>
                    <p className="text-content-tertiary text-xs truncate">
                      {lang === 'ru' ? method.descriptionRu : method.description}
                    </p>
                  </div>
                  {method.comingSoon && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-content-tertiary/20 text-content-tertiary ml-2">
                      {t('subscriptions:payment.soon')}
                    </span>
                  )}
                  {isSelected && method.available && (
                    <span className={`${style?.accentColor || 'text-brand-primary'} ml-2 shrink-0`}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
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
              {t('subscriptions:payment.processing')}
            </span>
          ) : (
            <>
              {t('subscriptions:payment.pay')}{buttonPrice ? ` ${buttonPrice}` : ''}
            </>
          )}
        </Button>

        <div className="text-content-tertiary text-[10px] text-center leading-relaxed">
          <p>
            {lang === 'ru' ? (
              <>
                Нажимая «Оплатить», вы соглашаетесь с{' '}
                <Link to="/public-offer" className="text-brand-primary hover:underline" onClick={onClose}>
                  Публичной офертой
                </Link>
                {' '}и{' '}
                <Link to="/privacy-policy" className="text-brand-primary hover:underline" onClick={onClose}>
                  Политикой конфиденциальности
                </Link>
              </>
            ) : (
              <>
                By clicking "Pay", you agree to the{' '}
                <Link to="/public-offer" className="text-brand-primary hover:underline" onClick={onClose}>
                  Public Offer
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-brand-primary hover:underline" onClick={onClose}>
                  Privacy Policy
                </Link>
              </>
            )}
          </p>
          <p className="mt-1">
            {lang === 'ru'
              ? 'Оплата через защищённую платёжную систему ЮКасса'
              : 'Payment via secure YooKassa payment system'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
