import { TokenPackage } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/** Base rate for custom (one-off) token purchases: ₽ per token */
export const CUSTOM_TOKEN_RATE_RUB = 3.49;
/** Base rate for custom purchases: Telegram Stars per token */
export const CUSTOM_TOKEN_RATE_STARS = 2.5;
/** Minimum tokens for a custom purchase */
export const CUSTOM_MIN_TOKENS = 50;
/** Maximum tokens for a custom purchase */
export const CUSTOM_MAX_TOKENS = 50000;

const DEFAULT_PACKAGES = [
  { name: '100 Tokens',  tokens: 100,  priceRUB: 349,   priceStars: 250,  discountPercent: 0,  isPopular: false, sortOrder: 1 },
  { name: '500 Tokens',  tokens: 500,  priceRUB: 1490,  priceStars: 1050, discountPercent: 15, isPopular: true,  sortOrder: 2 },
  { name: '1000 Tokens', tokens: 1000, priceRUB: 2790,  priceStars: 1900, discountPercent: 20, isPopular: false, sortOrder: 3 },
  { name: '3000 Tokens', tokens: 3000, priceRUB: 7490,  priceStars: 5000, discountPercent: 28, isPopular: false, sortOrder: 4 },
  { name: '5000 Tokens', tokens: 5000, priceRUB: 10990, priceStars: 7500, discountPercent: 37, isPopular: false, sortOrder: 5 },
];

export class TokenPackageService {
  /**
   * Seed default token packages if the table is empty,
   * or update existing packages to match current pricing.
   * Called on application startup.
   */
  async seedDefaults(): Promise<void> {
    const count = await prisma.tokenPackage.count();

    if (count === 0) {
      for (const pkg of DEFAULT_PACKAGES) {
        await prisma.tokenPackage.create({
          data: {
            name: pkg.name,
            tokens: pkg.tokens,
            price: pkg.priceRUB,
            currency: 'RUB',
            priceRUB: pkg.priceRUB,
            priceStars: pkg.priceStars,
            discountPercent: pkg.discountPercent,
            isPopular: pkg.isPopular,
            sortOrder: pkg.sortOrder,
            isActive: true,
          },
        });
      }
      logger.info(`Seeded ${DEFAULT_PACKAGES.length} default token packages`);
      return;
    }

    // Update existing packages to match current pricing (idempotent)
    for (const pkg of DEFAULT_PACKAGES) {
      await prisma.tokenPackage.updateMany({
        where: { tokens: pkg.tokens },
        data: {
          name: pkg.name,
          price: pkg.priceRUB,
          priceRUB: pkg.priceRUB,
          priceStars: pkg.priceStars,
          discountPercent: pkg.discountPercent,
          isPopular: pkg.isPopular,
          sortOrder: pkg.sortOrder,
        },
      });
    }
    logger.info('Token package pricing updated to current defaults');
  }

  /**
   * Get all active token packages ordered by sortOrder.
   */
  async getActivePackages(): Promise<TokenPackage[]> {
    return prisma.tokenPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single token package by ID.
   */
  async getPackageById(id: string): Promise<TokenPackage | null> {
    return prisma.tokenPackage.findUnique({ where: { id } });
  }

  /**
   * Calculate price for a custom token amount (no volume discount).
   * Uses the base rate from the smallest package.
   */
  calculateCustomPrice(tokens: number): { priceRUB: number; priceStars: number } {
    if (tokens < CUSTOM_MIN_TOKENS || tokens > CUSTOM_MAX_TOKENS) {
      throw new Error(`Custom token amount must be between ${CUSTOM_MIN_TOKENS} and ${CUSTOM_MAX_TOKENS}`);
    }
    return {
      priceRUB: Math.ceil(tokens * CUSTOM_TOKEN_RATE_RUB),
      priceStars: Math.ceil(tokens * CUSTOM_TOKEN_RATE_STARS),
    };
  }
}

export const tokenPackageService = new TokenPackageService();
