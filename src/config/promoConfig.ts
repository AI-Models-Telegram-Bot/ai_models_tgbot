/**
 * March 8 (International Women's Day) Promotion Config — Backend
 * Active: March 7–9, 2026 (covers timezone differences)
 */

export interface PromoConfig {
  id: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  appliesToPlans: boolean;
  appliesToTokens: boolean;
}

const MARCH8_PROMO: PromoConfig = {
  id: 'march8_2026',
  discountPercent: 15,
  startDate: new Date('2026-03-07T00:00:00+03:00'),
  endDate: new Date('2026-03-09T23:59:59+03:00'),
  appliesToPlans: true,
  appliesToTokens: true,
};

export function getActivePromo(): PromoConfig | null {
  const now = new Date();
  if (now >= MARCH8_PROMO.startDate && now <= MARCH8_PROMO.endDate) {
    return MARCH8_PROMO;
  }
  return null;
}

export function applyPromoDiscount(price: number, type: 'plan' | 'tokens'): number {
  const promo = getActivePromo();
  if (!promo) return price;
  if (type === 'plan' && !promo.appliesToPlans) return price;
  if (type === 'tokens' && !promo.appliesToTokens) return price;
  return Math.round(price * (1 - promo.discountPercent / 100));
}
