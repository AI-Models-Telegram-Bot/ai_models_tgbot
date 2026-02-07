import apiClient from './client';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentVerifyResponse,
  PaymentMethodsResponse,
} from '@/types/payment.types';

export const paymentApi = {
  create: (data: CreatePaymentRequest) =>
    apiClient
      .post<CreatePaymentResponse>('/payment/create', data)
      .then((r) => r.data),

  verify: (paymentId: string, telegramId: string) =>
    apiClient
      .post<PaymentVerifyResponse>('/payment/verify', { paymentId, telegramId })
      .then((r) => r.data),

  getMethods: () =>
    apiClient
      .get<PaymentMethodsResponse>('/payment/methods')
      .then((r) => r.data),
};
