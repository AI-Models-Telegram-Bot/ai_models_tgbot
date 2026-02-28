import { Telegram } from 'telegraf';
import { prisma } from '../config/database';
import { config } from '../config';
import { walletService } from './WalletService';
import {
  REFERRAL_COMMISSION,
  WITHDRAWAL_THRESHOLDS,
  SUBSCRIPTION_PLANS,
  SubscriptionTier,
} from '../config/subscriptions';
import { Language } from '../locales';
import { logger } from '../utils/logger';

export class ReferralCommissionService {
  /**
   * Process referral commission when a referred user pays for a subscription.
   * Non-fatal: errors are caught to never break the payment flow.
   */
  async processCommission(params: {
    payingUserId: string;
    paymentAmount: number;
    paymentCurrency: string;
    tier: string;
    paymentId?: string;
  }): Promise<void> {
    try {
      // 1. Look up the paying user and check if they have a referrer
      const payingUser = await prisma.user.findUnique({
        where: { id: params.payingUserId },
        select: { id: true, referredBy: true, username: true, firstName: true },
      });

      if (!payingUser?.referredBy) return;

      // 2. Find the referrer by referralCode
      const referrer = await prisma.user.findUnique({
        where: { referralCode: payingUser.referredBy },
        select: {
          id: true,
          telegramId: true,
          language: true,
          referralMode: true,
        },
      });

      if (!referrer) return;

      // 3. Ensure referrer wallet exists
      await walletService.getOrCreateWallet(referrer.id);

      // 4. Calculate and grant commission
      const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === params.tier);

      if (referrer.referralMode === 'CASH') {
        // 15% of payment amount in cash
        const cashAmount = Math.round(params.paymentAmount * REFERRAL_COMMISSION.CASH_PERCENT / 100 * 100) / 100;

        await walletService.addMoney(
          referrer.id,
          cashAmount,
          params.paymentCurrency,
          'REFERRAL_COMMISSION',
          {
            description: `Referral commission: ${params.tier} subscription`,
            paymentId: params.paymentId,
            metadata: {
              referredUserId: params.payingUserId,
              commissionPercent: REFERRAL_COMMISSION.CASH_PERCENT,
              mode: 'CASH',
            },
          },
        );

        await this.notifyCommission(referrer, payingUser, {
          mode: 'CASH',
          amount: cashAmount,
          currency: params.paymentCurrency,
          tier: params.tier,
        });
      } else {
        // 35% of plan tokens
        const planTokens = plan?.tokens || 0;
        const tokenAmount = Math.round(planTokens * REFERRAL_COMMISSION.TOKEN_PERCENT / 100);

        if (tokenAmount > 0) {
          await walletService.addCredits(
            referrer.id,
            'TEXT',
            tokenAmount,
            'REFERRAL_COMMISSION',
            {
              description: `Referral commission: ${params.tier} subscription`,
              paymentId: params.paymentId,
              metadata: {
                referredUserId: params.payingUserId,
                commissionPercent: REFERRAL_COMMISSION.TOKEN_PERCENT,
                mode: 'TOKENS',
                planTokens,
              },
            },
          );
        }

        await this.notifyCommission(referrer, payingUser, {
          mode: 'TOKENS',
          amount: tokenAmount,
          currency: '',
          tier: params.tier,
        });
      }

      logger.info('Referral commission processed', {
        referrerId: referrer.id,
        payingUserId: params.payingUserId,
        mode: referrer.referralMode,
        tier: params.tier,
      });
    } catch (error) {
      logger.error('Failed to process referral commission', {
        error,
        payingUserId: params.payingUserId,
      });
      // Non-fatal: don't throw
    }
  }

  /**
   * Get referral earnings breakdown for a user.
   */
  async getEarnings(userId: string) {
    const [tokenEarnings, cashEarnings, pendingWithdrawals] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          userId,
          transactionType: 'REFERRAL_COMMISSION',
          category: 'TEXT',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.aggregate({
        where: {
          userId,
          transactionType: 'REFERRAL_COMMISSION',
          category: 'MONEY',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.withdrawalRequest.aggregate({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      tokensEarned: Math.round(tokenEarnings._sum.amount || 0),
      tokenCommissions: tokenEarnings._count,
      cashEarned: Math.round((cashEarnings._sum.amount || 0) * 100) / 100,
      cashCommissions: cashEarnings._count,
      pendingWithdrawal: Math.round((pendingWithdrawals._sum.amount || 0) * 100) / 100,
    };
  }

  /**
   * Create a cash withdrawal request.
   */
  async requestWithdrawal(userId: string, amount: number, currency: string) {
    const wallet = await walletService.getOrCreateWallet(userId);

    const threshold = currency === 'RUB'
      ? WITHDRAWAL_THRESHOLDS.RUB
      : WITHDRAWAL_THRESHOLDS.USD;

    if (amount < threshold) {
      throw new Error(`Minimum withdrawal is ${threshold} ${currency}`);
    }

    if (wallet.moneyBalance < amount) {
      throw new Error('Insufficient money balance');
    }

    // Check for existing pending withdrawal
    const pendingExists = await prisma.withdrawalRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (pendingExists) {
      throw new Error('You already have a pending withdrawal request');
    }

    // Deduct from money balance and create request atomically
    return await prisma.$transaction(async (tx) => {
      const w = await tx.userWallet.findUnique({ where: { userId } });
      if (!w || w.moneyBalance < amount) {
        throw new Error('Insufficient balance');
      }

      await tx.userWallet.update({
        where: { userId },
        data: { moneyBalance: w.moneyBalance - amount },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          category: 'MONEY',
          transactionType: 'DEDUCTION',
          amount: -amount,
          balanceBefore: w.moneyBalance,
          balanceAfter: w.moneyBalance - amount,
          description: 'Withdrawal request',
        },
      });

      return tx.withdrawalRequest.create({
        data: { userId, amount, currency },
      });
    });
  }

  /**
   * Get withdrawal history for a user.
   */
  async getWithdrawals(userId: string) {
    return prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async notifyCommission(
    referrer: { id: string; telegramId: bigint | null; language: string },
    payingUser: { username: string | null; firstName: string | null },
    params: { mode: string; amount: number; currency: string; tier: string },
  ): Promise<void> {
    if (!referrer.telegramId) return;
    try {
      const telegram = new Telegram(config.bot.token);
      const lang = (referrer.language as Language) || 'en';
      const userName = payingUser.username ? `@${payingUser.username}` : (payingUser.firstName || 'A user');

      let earningLine: string;
      if (params.mode === 'CASH') {
        const formatted = params.amount.toFixed(2);
        earningLine = lang === 'ru'
          ? `💰 +${formatted} ${params.currency} на баланс`
          : `💰 +${formatted} ${params.currency} to balance`;
      } else {
        earningLine = lang === 'ru'
          ? `⚡ +${params.amount} токенов`
          : `⚡ +${params.amount} tokens`;
      }

      const message = lang === 'ru'
        ? `🎉 <b>Реферальная комиссия!</b>\n\n${userName} оплатил подписку ${params.tier}.\n\n${earningLine}\n\nПриглашайте больше друзей, чтобы зарабатывать ещё!`
        : `🎉 <b>Referral commission!</b>\n\n${userName} purchased a ${params.tier} subscription.\n\n${earningLine}\n\nInvite more friends to earn more!`;

      await telegram.sendMessage(referrer.telegramId.toString(), message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.warn('Failed to send commission notification', { error, referrerId: referrer.id });
    }
  }
}

export const referralCommissionService = new ReferralCommissionService();
