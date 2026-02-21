import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { SUBSCRIPTION_PLANS, getPlanByTier, SubscriptionPlanConfig } from '../config/subscriptions';
import { walletService } from './WalletService';

export class SubscriptionService {
  /**
   * Get user subscription, creating FREE tier if none exists.
   */
  async getUserSubscription(userId: string) {
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await prisma.userSubscription.create({
        data: {
          userId,
          tier: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: null, // FREE tier has no expiry
        },
      });
      logger.info(`Created FREE subscription for user ${userId}`);
    }

    return subscription;
  }

  /**
   * Get the plan config for a given tier.
   */
  getPlanConfig(tier: SubscriptionTier): SubscriptionPlanConfig | undefined {
    return getPlanByTier(tier as any);
  }

  /**
   * Get all subscription plans from the database.
   */
  async getAllPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceUSD: 'asc' },
    });
  }

  /**
   * Get all plan configs (from code, not DB).
   */
  getAllPlanConfigs(): SubscriptionPlanConfig[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Upgrade user to a new tier.
   */
  async upgradeTier(userId: string, newTier: SubscriptionTier) {
    const plan = getPlanByTier(newTier as any);
    if (!plan) {
      throw new Error(`Invalid subscription tier: ${newTier}`);
    }

    if (newTier === 'ENTERPRISE') {
      throw new Error('Enterprise tier requires custom setup. Please contact support.');
    }

    const now = new Date();
    const periodEnd = plan.duration === 'lifetime'
      ? null
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscription = await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        tier: newTier,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        tier: newTier,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Grant tokens based on the new tier
    const tokens = plan.tokens;
    if (tokens !== null && tokens > 0) {
      await walletService.addCredits(userId, 'TEXT', tokens, 'BONUS', {
        description: `${plan.name} subscription tokens`,
      });
    }

    logger.info(`User ${userId} upgraded to ${newTier}, credits granted`);
    return subscription;
  }

  /**
   * Cancel subscription at period end.
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (subscription.tier === 'FREE') {
      throw new Error('Cannot cancel free tier');
    }

    const updated = await prisma.userSubscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    logger.info(`User ${userId} scheduled subscription cancellation`);
    return updated;
  }

  /**
   * Check and expire past-due subscriptions (for cron job).
   */
  async checkAndExpireSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await prisma.userSubscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lte: now },
        status: 'ACTIVE',
        tier: { not: 'FREE' },
      },
    });

    for (const sub of expiredSubscriptions) {
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        },
      });
      logger.info(`Subscription expired for user ${sub.userId}, downgraded to FREE`);
    }

    return expiredSubscriptions.length;
  }

  /**
   * Get token limit for a tier.
   */
  getTokenLimit(tier: SubscriptionTier): number | null {
    const plan = getPlanByTier(tier as any);
    return plan?.tokens ?? 0;
  }
}

export const subscriptionService = new SubscriptionService();
