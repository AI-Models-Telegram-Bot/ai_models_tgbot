export type PaymentMethod = 'telegram_stars' | 'yookassa' | 'sbp' | 'sberpay' | 'card_ru';

export interface CreatePaymentRequest {
  telegramId?: string;
  tier: string;
  paymentMethod: PaymentMethod;
  returnUrl?: string;
}

export interface TelegramStarsPaymentResponse {
  method: 'telegram_stars';
  invoiceUrl: string;
  starsAmount: number;
  priceUSD: number;
}

export interface YooKassaPaymentResponse {
  method: 'yookassa';
  confirmationUrl: string;
  paymentId: string;
  priceRUB: number;
}

export interface ContactPaymentResponse {
  method: 'contact';
  message: string;
}

export type CreatePaymentResponse =
  | TelegramStarsPaymentResponse
  | YooKassaPaymentResponse
  | ContactPaymentResponse;

export interface PaymentVerifyResponse {
  status: 'pending' | 'succeeded' | 'failed';
  message?: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  nameRu: string;
  icon: string;
  available: boolean;
  description: string;
  descriptionRu: string;
  comingSoon?: boolean;
}

export interface PaymentMethodsResponse {
  methods: PaymentMethodInfo[];
}
