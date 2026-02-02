import apiClient from './client';
import type {
  ReferralLinksResponse,
  ReferralLink,
  ReferralBenefit,
} from '@/types/referral.types';

export const referralApi = {
  getLinks: () =>
    apiClient.get<ReferralLinksResponse>('/referral/links').then((r) => r.data),

  createLink: () =>
    apiClient
      .post<{ link: ReferralLink }>('/referral/create')
      .then((r) => r.data),

  getBenefits: () =>
    apiClient
      .get<{ benefits: ReferralBenefit[] }>('/referral/benefits')
      .then((r) => r.data),
};
