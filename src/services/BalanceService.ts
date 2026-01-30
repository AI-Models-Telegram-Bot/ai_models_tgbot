import { Transaction, TransactionType, WalletCategory } from '@prisma/client';
import { prisma } from '../config/database';
import { walletService } from './WalletService';

/**
 * BalanceService now delegates to WalletService for multi-wallet operations.
 * Kept for backward compatibility with existing handlers during migration.
 */
export class BalanceService {
  /**
   * Check if user has enough credits in the specified wallet category
   */
  async hasEnoughTokens(userId: string, amount: number, category?: WalletCategory): Promise<boolean> {
    if (category) {
      return walletService.hasSufficientBalance(userId, category, amount);
    }
    // Legacy: check old tokenBalance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });
    return (user?.tokenBalance ?? 0) >= amount;
  }

  /**
   * Get balance for a category from the wallet
   */
  async getBalance(userId: string, category?: WalletCategory): Promise<number> {
    if (category) {
      return walletService.getBalance(userId, category);
    }
    // Legacy fallback
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });
    return user?.tokenBalance ?? 0;
  }

  /**
   * Get all wallet balances
   */
  async getAllBalances(userId: string) {
    return walletService.getAllBalances(userId);
  }

  /**
   * Deduct credits from wallet category
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
   * Refund credits to wallet category
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
