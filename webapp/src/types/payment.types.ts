export type PaymentMethod = 'telegram_stars' | 'yookassa' | 'sbp' | 'card_ru';

export interface CreatePaymentRequest {
  telegramId: string;
  tier: string;
  paymentMethod: PaymentMethod;
}

export interface TelegramStarsPaymentResponse {
  method: 'telegram_stars';
  invoiceUrl: string;
  starsAmount: number;
  priceUSD: number;
}

export interface ComingSoonPaymentResponse {
  method: 'yookassa' | 'sbp' | 'card_ru';
  status: 'coming_soon';
  priceRUB: number;
  message: string;
}

export interface ContactPaymentResponse {
  method: 'contact';
  message: string;
}

export type CreatePaymentResponse =
  | TelegramStarsPaymentResponse
  | ComingSoonPaymentResponse
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
