import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Modal, Button, Skeleton } from '@/shared/ui';
import { paymentApi } from '@/services/api/payment.api';
import { openTelegramInvoice, openExternalLink, isTelegramEnvironment } from '@/services/telegram/telegram';
import { hapticImpact, hapticNotification } from '@/services/telegram/haptic';
import type { TokenPackage } from '@/types/tokenPackage.types';
import type { PaymentMethodInfo, PaymentMethod } from '@/types/payment.types';

import sbpIcon from '@/assets/icons/sbp.svg';
import sberpayIcon from '@/assets/icons/sberpay.svg';
import telegramStarsIcon from '@/assets/icons/telegram-stars.svg';

const METHOD_STYLES: Record<string, {
  selectedBorder: string;
  selectedBg: string;
  accentColor: string;
}> = {
  sbp: { selectedBorder: 'border-[#5B2D8E]', selectedBg: 'bg-[#5B2D8E]/10', accentColor: 'text-[#00AEEF]' },
  sberpay: { selectedBorder: 'border-[#21A038]', selectedBg: 'bg-[#21A038]/10', accentColor: 'text-[#21A038]' },
  card_ru: { selectedBorder: 'border-brand-primary', selectedBg: 'bg-brand-primary/10', accentColor: 'text-brand-primary' },
  telegram_stars: { selectedBorder: 'border-[#E5A100]', selectedBg: 'bg-[#E5A100]/10', accentColor: 'text-[#FFD700]' },
};

const ICON_MAP: Record<string, string> = { sbp: sbpIcon, sberpay: sberpayIcon, stars: telegramStarsIcon };

const PaymentIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconSrc = ICON_MAP[type];
  if (iconSrc) return <img src={iconSrc} alt={type} className="w-7 h-7 object-contain" />;
  if (type === 'card') {
    return (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="8" fill="#3B3B5C" />
        <rect x="6" y="10" width="28" height="20" rx="3" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" />
        <rect x="6" y="15" width="28" height="4" fill="white" fillOpacity="0.25" />
        <rect x="10" y="23" width="8" height="2" rx="1" fill="white" fillOpacity="0.6" />
      </svg>
    );
  }
  return <span className="text-2xl">💳</span>;
};

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: TokenPackage;
  telegramId: string;
  onSuccess?: () => void;
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen, onClose, pkg, telegramId, onSuccess,
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
          const filtered = isTelegramEnvironment()
            ? data.methods
            : data.methods.filter((m) => m.id !== 'telegram_stars');
          setMethods(filtered);
          const firstAvailable = filtered.find((m) => m.available);
          if (firstAvailable) setSelectedMethod(firstAvailable.id);
          setIsLoading(false);
        })
        .catch((err) => { setError(err.message); setIsLoading(false); });
    }
  }, [isOpen, methods.length]);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    setError(null);
    hapticImpact('medium');

    try {
      const successUrl = isTelegramEnvironment()
        ? `${window.location.origin}/payment/success?source=bot`
        : `${window.location.origin}/payment/success`;

      const isCustom = pkg.id.startsWith('custom:');
      const response = await paymentApi.createTokenPurchase({
        telegramId,
        ...(isCustom ? { customTokens: pkg.tokens } : { packageId: pkg.id }),
        paymentMethod: selectedMethod,
        returnUrl: successUrl,
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
        if (isTelegramEnvironment()) {
          openExternalLink(response.confirmationUrl);
          setIsProcessing(false);
          onClose();
        } else {
          window.location.href = response.confirmationUrl;
        }
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

  const isRubMethod = selectedMethod && selectedMethod !== 'telegram_stars';
  const buttonPrice = isRubMethod
    ? `${pkg.priceRUB.toLocaleString()} ₽`
    : `${pkg.priceStars} Stars`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('subscriptions:tokenPackages.tokenPurchase')} size="md">
      <div className="p-5 space-y-4">
        {/* Package summary */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center" style={{ columnGap: 6 }}>
                <span>⚡</span>
                <p className="text-white font-semibold">{pkg.tokens.toLocaleString()} {t('subscriptions:tokenPackages.tokens')}</p>
              </div>
              <p className="text-content-tertiary text-xs mt-0.5">
                {t('subscriptions:tokenPackages.purchaseDescription')}
              </p>
            </div>
            <p className="text-lg font-bold text-white font-mono">
              {pkg.priceRUB.toLocaleString()} ₽
            </p>
          </div>
        </div>

        {/* Payment methods */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} className="rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => {
              const style = METHOD_STYLES[method.id];
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => { if (method.available) { hapticImpact('light'); setSelectedMethod(method.id); } }}
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
                    <p className="text-white text-sm font-medium">{lang === 'ru' ? method.nameRu : method.name}</p>
                    <p className="text-content-tertiary text-xs truncate">{lang === 'ru' ? method.descriptionRu : method.description}</p>
                  </div>
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

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <Button variant="primary" fullWidth size="lg" onClick={handlePayment} disabled={!selectedMethod || isProcessing || isLoading}>
          {isProcessing ? (
            <span className="flex items-center justify-center" style={{ columnGap: 8 }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('subscriptions:payment.processing')}
            </span>
          ) : (
            <>{t('subscriptions:payment.pay')} {buttonPrice}</>
          )}
        </Button>

        <div className="text-content-tertiary text-[10px] text-center leading-relaxed">
          <p>
            {lang === 'ru' ? (
              <>
                Нажимая «Оплатить», вы соглашаетесь с{' '}
                <Link to="/public-offer" className="text-brand-primary hover:underline" onClick={onClose}>Публичной офертой</Link>
                {' '}и{' '}
                <Link to="/privacy-policy" className="text-brand-primary hover:underline" onClick={onClose}>Политикой конфиденциальности</Link>
              </>
            ) : (
              <>
                By clicking "Pay", you agree to the{' '}
                <Link to="/public-offer" className="text-brand-primary hover:underline" onClick={onClose}>Public Offer</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-brand-primary hover:underline" onClick={onClose}>Privacy Policy</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
};
