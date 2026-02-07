export interface ReferralStats {
  totalInvited: number;
  totalEarned: number;
  currentTierBonus: number;
}

export interface ReferralInfoResponse {
  referralCode: string;
  referralUrl: string;
  stats: ReferralStats;
}

export interface ReferralBenefit {
  tier: string;
  name: string;
  percentage: number;
}
