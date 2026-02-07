import apiClient from './client';
import type { SubscriptionPlansResponse, CurrentSubscriptionResponse, TierModelsResponse } from '@/types/subscription.types';

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<SubscriptionPlansResponse>('/subscriptions/plans').then((r) => r.data),

  getCurrentSubscription: (telegramId: string) =>
    apiClient
      .get<CurrentSubscriptionResponse>(`/subscriptions/current/${telegramId}`)
      .then((r) => r.data),

  getModelsForTier: (tier: string) =>
    apiClient
      .get<TierModelsResponse>(`/subscriptions/models/${tier}`)
      .then((r) => r.data),

  upgrade: (telegramId: string, tier: string) =>
    apiClient
      .post('/subscriptions/upgrade', { telegramId, tier })
      .then((r) => r.data),

  cancel: (telegramId: string) =>
    apiClient
      .post('/subscriptions/cancel', { telegramId })
      .then((r) => r.data),
};
