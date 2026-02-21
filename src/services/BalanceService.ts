import { Transaction, WalletCategory } from '@prisma/client';
import { prisma } from '../config/database';
import { walletService } from './WalletService';

/**
 * BalanceService now delegates to WalletService for unified token operations.
 * Kept for backward compatibility with existing handlers.
 */
export class BalanceService {
  /**
   * Check if user has enough tokens
   */
  async hasEnoughTokens(userId: string, amount: number): Promise<boolean> {
    return walletService.hasSufficientBalance(userId, amount);
  }

  /**
   * Get token balance
   */
  async getBalance(userId: string): Promise<number> {
    return walletService.getBalance(userId);
  }

  /**
   * Deduct credits from wallet (category kept for analytics)
   */
  async deductFromWallet(
    userId: string,
    category: WalletCategory,
    amount: number,
    meta: { requestId: string; priceItemCode: string; description?: string }
  ) {
    return walletService.deductCredits(userId, category, amount, meta);
  }

  /**
   * Refund credits to wallet (category kept for analytics)
   */
  async refundToWallet(
    userId: string,
    category: WalletCategory,
    amount: number,
    meta: { requestId: string; priceItemCode: string; description?: string }
  ) {
    return walletService.refundCredits(userId, category, amount, meta);
  }

  async getTransactionHistory(userId: string, limit = 10): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get wallet transaction history
   */
  async getWalletHistory(userId: string, category?: WalletCategory, limit = 10) {
    return walletService.getTransactionHistory(userId, { category, limit });
  }
}

export const balanceService = new BalanceService();
