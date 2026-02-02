import apiClient from './client';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentVerifyResponse,
} from '@/types/payment.types';

export const paymentApi = {
  create: (data: CreatePaymentRequest) =>
    apiClient
      .post<CreatePaymentResponse>('/payment/create', data)
      .then((r) => r.data),

  verify: (paymentId: string, method: string) =>
    apiClient
      .post<PaymentVerifyResponse>('/payment/verify', { paymentId, method })
      .then((r) => r.data),
};
