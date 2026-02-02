export type PaymentMethod = 'telegram_stars' | 'stripe' | 'yookassa';

export interface CreatePaymentRequest {
  packageId: string;
  paymentMethod: PaymentMethod;
  currency?: 'USD' | 'RUB';
}

export interface TelegramStarsPaymentResponse {
  method: 'telegram_stars';
  invoiceUrl: string;
  invoiceId: string;
}

export interface StripePaymentResponse {
  method: 'stripe';
  clientSecret: string;
  publicKey: string;
}

export interface YooKassaPaymentResponse {
  method: 'yookassa';
  confirmationUrl: string;
  paymentId: string;
}

export type CreatePaymentResponse =
  | TelegramStarsPaymentResponse
  | StripePaymentResponse
  | YooKassaPaymentResponse;

export interface PaymentVerifyResponse {
  status: 'pending' | 'succeeded' | 'failed';
  packageId?: string;
  creditsAdded?: number;
}
