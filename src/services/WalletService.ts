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
   * Get total token balance for user (subscriptionTokens + purchasedTokens)
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.tokenBalance;
  }

  /**
   * Get detailed balance breakdown
   */
  async getBalanceDetails(userId: string): Promise<{
    tokenBalance: number;
    subscriptionTokens: number;
    purchasedTokens: number;
  }> {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      tokenBalance: wallet.tokenBalance,
      subscriptionTokens: wallet.subscriptionTokens,
      purchasedTokens: wallet.purchasedTokens,
    };
  }

  /**
   * Check if user has enough tokens
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Reset subscription tokens to a new amount (called on subscription activation/renewal).
   * This REPLACES (not adds) subscription tokens and recalculates tokenBalance.
   */
  async addSubscriptionTokens(userId: string, amount: number) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const oldBalance = wallet.tokenBalance;
      const newSubscriptionTokens = amount;
      const newBalance = wallet.purchasedTokens + newSubscriptionTokens;
      const netChange = newSubscriptionTokens - wallet.subscriptionTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          subscriptionTokens: newSubscriptionTokens,
          tokenBalance: newBalance,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category: 'TEXT',
          transactionType: 'SUBSCRIPTION_GRANT',
          amount: netChange,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: `Subscription tokens set to ${amount}`,
        },
      });

      logger.info(`Subscription tokens reset to ${amount} for user ${userId}`, {
        transactionId: transaction.id,
        oldSubscription: wallet.subscriptionTokens,
        newBalance,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Add purchased tokens (from token package purchase, referral bonus, etc.).
   * These persist forever and are not affected by subscription resets.
   */
  async addPurchasedTokens(
    userId: string,
    amount: number,
    meta?: {
      description?: string;
      paymentId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const oldBalance = wallet.tokenBalance;
      const newPurchasedTokens = wallet.purchasedTokens + amount;
      const newBalance = wallet.subscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category: 'TEXT',
          transactionType: 'TOKEN_PURCHASE',
          amount,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: meta?.description,
          paymentId: meta?.paymentId,
          metadata: meta?.metadata as any,
        },
      });

      logger.info(`Added ${amount} purchased tokens to user ${userId}`, {
        transactionId: transaction.id,
        newBalance,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Add credits (generic — for admin grants, misc bonuses).
   * Adds to purchasedTokens pool by default.
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

      const oldBalance = wallet.tokenBalance;
      const newPurchasedTokens = wallet.purchasedTokens + amount;
      const newBalance = wallet.subscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType,
          amount,
          balanceBefore: oldBalance,
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
   * Spends subscription tokens first, then purchased tokens.
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

      // Spend subscription tokens first, then purchased
      const subDeduction = Math.min(wallet.subscriptionTokens, amount);
      const purchDeduction = amount - subDeduction;

      const newSubscriptionTokens = wallet.subscriptionTokens - subDeduction;
      const newPurchasedTokens = wallet.purchasedTokens - purchDeduction;
      const newBalance = newSubscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          subscriptionTokens: newSubscriptionTokens,
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
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
          metadata: {
            ...(meta.metadata || {}),
            subscriptionTokensUsed: subDeduction,
            purchasedTokensUsed: purchDeduction,
          } as any,
        },
      });

      logger.info(`Deducted ${amount} tokens (${category}) from user ${userId}`, {
        transactionId: transaction.id,
        newBalance,
        subUsed: subDeduction,
        purchUsed: purchDeduction,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Reserve credits for long-running operations (video).
   * Spends subscription tokens first, then purchased tokens.
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

      // Spend subscription tokens first, then purchased
      const subDeduction = Math.min(wallet.subscriptionTokens, estimatedAmount);
      const purchDeduction = estimatedAmount - subDeduction;

      const newSubscriptionTokens = wallet.subscriptionTokens - subDeduction;
      const newPurchasedTokens = wallet.purchasedTokens - purchDeduction;
      const newBalance = newSubscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          subscriptionTokens: newSubscriptionTokens,
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
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
          metadata: {
            subscriptionTokensUsed: subDeduction,
            purchasedTokensUsed: purchDeduction,
          } as any,
        },
      });

      logger.info(`Reserved ${estimatedAmount} tokens (${category}) for user ${userId}`, { reservationId });
    });

    return reservationId;
  }

  /**
   * Adjust reservation to actual cost after generation completes.
   * Adjustments always affect purchasedTokens for simplicity.
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
      const newPurchasedTokens = wallet.purchasedTokens + adjustmentAmount;
      const newBalance = wallet.subscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
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
   * Refunds go to purchasedTokens since we can't know original source after the fact.
   * Category is kept for analytics tracking on the transaction record.
   */
  async refundCredits(
    userId: string,
    category: WalletCategory,
    amount: number,
    meta: { requestId: string; priceItemCode: string; description?: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const oldBalance = wallet.tokenBalance;
      const newPurchasedTokens = wallet.purchasedTokens + amount;
      const newBalance = wallet.subscriptionTokens + newPurchasedTokens;

      await tx.userWallet.update({
        where: { userId },
        data: {
          purchasedTokens: newPurchasedTokens,
          tokenBalance: newBalance,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category,
          transactionType: 'REFUND',
          amount,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: meta.description || 'Refund for failed operation',
          requestId: meta.requestId,
          priceItemCode: meta.priceItemCode,
        },
      });

      logger.info(`Refunded ${amount} tokens (${category}) to user ${userId}`, {
        transactionId: transaction.id,
        newBalance,
      });

      return { wallet, transaction };
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
   * Add money to user wallet (cash referral earnings, etc.)
   * Category is always MONEY for real currency operations.
   */
  async addMoney(
    userId: string,
    amount: number,
    currency: string,
    transactionType: WalletTransactionType,
    meta?: {
      description?: string;
      paymentId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = wallet.moneyBalance;
      const newBalance = currentBalance + amount;

      await tx.userWallet.update({
        where: { userId },
        data: { moneyBalance: newBalance, currency },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          category: 'MONEY',
          transactionType,
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: meta?.description,
          paymentId: meta?.paymentId,
          metadata: meta?.metadata as any,
        },
      });

      logger.info(`Added ${amount} ${currency} to user ${userId} money balance`, {
        transactionId: transaction.id,
        newBalance,
      });

      return { wallet, transaction };
    });
  }

  /**
   * Grant initial tokens to new user wallet (signup bonus).
   * Goes to purchasedTokens so they persist forever.
   */
  async grantSignupBonus(userId: string, amount: number) {
    await this.getOrCreateWallet(userId);

    if (amount > 0) {
      await this.addPurchasedTokens(userId, amount, {
        description: 'Signup bonus',
      });
    }
  }
}

export const walletService = new WalletService();
