import apiClient from './client';
import type { ReferralInfoResponse, ReferralBenefit } from '@/types/referral.types';

export const referralApi = {
  getInfo: () =>
    apiClient.get<ReferralInfoResponse>('/referral/links').then((r) => r.data),

  getBenefits: () =>
    apiClient
      .get<{ benefits: ReferralBenefit[] }>('/referral/benefits')
      .then((r) => r.data),
};
