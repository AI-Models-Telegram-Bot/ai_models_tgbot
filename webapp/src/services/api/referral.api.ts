import apiClient from './client';
import type {
  ReferralInfoResponse,
  ReferralBenefit,
  ReferralMode,
  WithdrawalRequest,
} from '@/types/referral.types';

export const referralApi = {
  getInfo: () =>
    apiClient.get<ReferralInfoResponse>('/referral/links').then((r) => r.data),

  getBenefits: () =>
    apiClient
      .get<{ benefits: ReferralBenefit[] }>('/referral/benefits')
      .then((r) => r.data),

  setMode: (mode: ReferralMode) =>
    apiClient
      .put<{ referralMode: ReferralMode }>('/referral/mode', { mode })
      .then((r) => r.data),

  requestWithdrawal: (amount: number, currency: string) =>
    apiClient
      .post<{ withdrawal: WithdrawalRequest }>('/referral/withdraw', { amount, currency })
      .then((r) => r.data),

  getWithdrawals: () =>
    apiClient
      .get<{ withdrawals: WithdrawalRequest[] }>('/referral/withdrawals')
      .then((r) => r.data),
};
