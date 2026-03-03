import { TokenPackage } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const DEFAULT_PACKAGES = [
  { name: '100 Tokens',  tokens: 100,  priceRUB: 199,  priceStars: 100,  discountPercent: 0,  isPopular: false, sortOrder: 1 },
  { name: '500 Tokens',  tokens: 500,  priceRUB: 799,  priceStars: 400,  discountPercent: 20, isPopular: true,  sortOrder: 2 },
  { name: '1000 Tokens', tokens: 1000, priceRUB: 1399, priceStars: 700,  discountPercent: 30, isPopular: false, sortOrder: 3 },
  { name: '3000 Tokens', tokens: 3000, priceRUB: 3499, priceStars: 1750, discountPercent: 42, isPopular: false, sortOrder: 4 },
  { name: '5000 Tokens', tokens: 5000, priceRUB: 4999, priceStars: 2500, discountPercent: 50, isPopular: false, sortOrder: 5 },
];

export class TokenPackageService {
  /**
   * Seed default token packages if the table is empty.
   * Called on application startup.
   */
  async seedDefaults(): Promise<void> {
    const count = await prisma.tokenPackage.count();
    if (count > 0) return;

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
}

export const tokenPackageService = new TokenPackageService();
