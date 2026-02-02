export interface ReferralLink {
  id: string;
  url: string;
  code: string;
  invitedCount: number;
  creditsPurchased: number;
  createdAt: string;
}

export interface ReferralStats {
  totalInvited: number;
  totalEarned: number;
  currentTierBonus: number;
}

export interface ReferralLinksResponse {
  links: ReferralLink[];
  stats: ReferralStats;
  maxLinks: number;
}

export interface ReferralBenefit {
  tier: string;
  percentage: number;
  requirements: string;
  description: string;
}
