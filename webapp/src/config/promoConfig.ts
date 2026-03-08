/**
 * March 8 (International Women's Day) Promotion Config
 * Active: March 7–9, 2026 (covers timezone differences)
 */

export interface PromoConfig {
  id: string;
  name: string;
  nameRu: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  /** Applies to subscription plans */
  appliesToPlans: boolean;
  /** Applies to token packages */
  appliesToTokens: boolean;
}

const MARCH8_PROMO: PromoConfig = {
  id: 'march8_2026',
  name: '8 March Sale',
  nameRu: '8 Марта — Праздничная скидка',
  discountPercent: 15,
  startDate: new Date('2026-03-07T00:00:00+03:00'), // March 7, midnight MSK
  endDate: new Date('2026-03-09T23:59:59+03:00'),   // March 9, end of day MSK
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

export function isPromoActive(): boolean {
  return getActivePromo() !== null;
}

export function getDiscountedPrice(originalPrice: number): number {
  const promo = getActivePromo();
  if (!promo) return originalPrice;
  return Math.round(originalPrice * (1 - promo.discountPercent / 100));
}

export function getPromoEndDate(): Date | null {
  const promo = getActivePromo();
  return promo ? promo.endDate : null;
}

/** For dev/testing — force promo active */
export function getActivePromoForced(): PromoConfig {
  return MARCH8_PROMO;
}
