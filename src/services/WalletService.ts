import { WalletCategory, WalletTransactionType, UserWallet } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class WalletService {
  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<UserWallet> {
    let wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: { userId },
      });
      logger.info(`Created wallet for user ${userId}`);
    }

    return wallet;
  }

  /**
   * Get token balance for user
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.tokenBalance;
  }

  /**
   * Check if user has enough tokens
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Add credits (purchase, bonus, refund, admin).
   * Category is kept for analytics tracking on the transaction record.
   */
  async addCredits(
    userId: string,
    category: WalletCategory,
    amount: number,
    transactionType: WalletTransactionType,
    meta?: {
      description?: string;
      paymentId?: string;
      requestId?: string;
      priceItemCode?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = wallet.tokenBalance;
      const newBalance = currentBalance + amount;

      await tx.userWallet.update({
        where: { userId },
        data: { tokenBalance: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType,
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: meta?.description,
          paymentId: meta?.paymentId,
          requestId: meta?.requestId,
          priceItemCode: meta?.priceItemCode,
          metadata: meta?.metadata as any,
        },
      });

      logger.info(`Added ${amount} tokens (${category}) to user ${userId}`, {
        transactionId: transaction.id,
        newBalance,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Deduct credits atomically with balance check.
   * Category is kept for analytics tracking on the transaction record.
   */
  async deductCredits(
    userId: string,
    category: WalletCategory,
    amount: number,
    meta: {
      requestId: string;
      priceItemCode: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = wallet.tokenBalance;
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Required: ${amount}, Available: ${currentBalance}`);
      }

      const newBalance = currentBalance - amount;

      await tx.userWallet.update({
        where: { userId },
        data: { tokenBalance: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType: 'DEDUCTION',
          amount: -amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          requestId: meta.requestId,
          priceItemCode: meta.priceItemCode,
          description: meta.description,
          metadata: meta.metadata as any,
        },
      });

      logger.info(`Deducted ${amount} tokens (${category}) from user ${userId}`, {
        transactionId: transaction.id,
        newBalance,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Reserve credits for long-running operations (video).
   * Category is kept for analytics tracking on the transaction record.
   */
  async reserveCredits(
    userId: string,
    category: WalletCategory,
    estimatedAmount: number,
    meta: {
      requestId: string;
      priceItemCode: string;
      description?: string;
    }
  ): Promise<string> {
    const reservationId = `rsv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = wallet.tokenBalance;
      if (currentBalance < estimatedAmount) {
        throw new Error(`Insufficient balance for reservation. Required: ${estimatedAmount}, Available: ${currentBalance}`);
      }

      const newBalance = currentBalance - estimatedAmount;

      await tx.userWallet.update({
        where: { userId },
        data: { tokenBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType: 'RESERVATION',
          amount: -estimatedAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          requestId: meta.requestId,
          priceItemCode: meta.priceItemCode,
          description: meta.description || 'Reserved credits',
          isReservation: true,
          reservationId,
        },
      });

      logger.info(`Reserved ${estimatedAmount} tokens (${category}) for user ${userId}`, { reservationId });
    });

    return reservationId;
  }

  /**
   * Adjust reservation to actual cost after generation completes
   */
  async adjustReservation(
    userId: string,
    category: WalletCategory,
    reservationId: string,
    actualAmount: number,
    meta: { requestId: string; priceItemCode: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.walletTransaction.findFirst({
        where: { userId, reservationId, isReservation: true, transactionType: 'RESERVATION' },
      });

      if (!reservation) throw new Error('Reservation not found');

      const reservedAmount = Math.abs(reservation.amount);
      const difference = actualAmount - reservedAmount;

      if (difference === 0) return;

      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = wallet.tokenBalance;
      const adjustmentAmount = -difference; // Positive if refunding, negative if charging more
      const newBalance = currentBalance + adjustmentAmount;

      await tx.userWallet.update({
        where: { userId },
        data: { tokenBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType: 'ADJUSTMENT',
          amount: adjustmentAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          requestId: meta.requestId,
          priceItemCode: meta.priceItemCode,
          description: difference > 0
            ? `Additional charge (actual: ${actualAmount}, reserved: ${reservedAmount})`
            : `Refund overpayment (actual: ${actualAmount}, reserved: ${reservedAmount})`,
          reservationId,
        },
      });

      logger.info(`Adjusted reservation ${reservationId}: reserved=${reservedAmount}, actual=${actualAmount}`);
    });
  }

  /**
   * Refund full deduction (for failed operations).
   * Category is kept for analytics tracking on the transaction record.
   */
  async refundCredits(
    userId: string,
    category: WalletCategory,
    amount: number,
    meta: { requestId: string; priceItemCode: string; description?: string }
  ) {
    return this.addCredits(userId, category, amount, 'REFUND', {
      description: meta.description || 'Refund for failed operation',
      requestId: meta.requestId,
      priceItemCode: meta.priceItemCode,
    });
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(
    userId: string,
    options?: { category?: WalletCategory; limit?: number; offset?: number }
  ) {
    return prisma.walletTransaction.findMany({
      where: {
        userId,
        ...(options?.category && { category: options.category }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get price for a specific item
   */
  async getPrice(itemCode: string) {
    const price = await prisma.priceItem.findFirst({
      where: { itemCode, isActive: true },
    });

    if (!price) throw new Error(`Price item ${itemCode} not found or inactive`);
    return price;
  }

  /**
   * Calculate cost for a generation
   */
  async calculateCost(itemCode: string, units: number = 1): Promise<{ credits: number; priceItem: any }> {
    const priceItem = await this.getPrice(itemCode);
    let credits = priceItem.creditsPerUnit * units;

    if (priceItem.minCredits && credits < priceItem.minCredits) {
      credits = priceItem.minCredits;
    }
    if (priceItem.maxCredits && credits > priceItem.maxCredits) {
      credits = priceItem.maxCredits;
    }

    return { credits, priceItem };
  }

  /**
   * Grant initial tokens to new user wallet (signup bonus)
   */
  async grantSignupBonus(userId: string, amount: number) {
    await this.getOrCreateWallet(userId);

    if (amount > 0) {
      await this.addCredits(userId, 'TEXT', amount, 'BONUS', {
        description: 'Signup bonus',
      });
    }
  }
}

export const walletService = new WalletService();
