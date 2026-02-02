import { WalletCategory } from '@prisma/client';
import { subscriptionService } from './SubscriptionService';
import { walletService } from './WalletService';
import { getPlanByTier, SubscriptionPlanConfig, ModelAccessCategory } from '../config/subscriptions';
import { logger } from '../utils/logger';

export interface ModelAccessResult {
  allowed: boolean;
  unlimited: boolean;
  reason?: string;
}

export class ModelAccessService {
  /**
   * Check if a user can use a specific model based on their subscription tier.
   */
  async canUseModel(
    userId: string,
    modelSlug: string,
    category: WalletCategory
  ): Promise<ModelAccessResult> {
    const subscription = await subscriptionService.getUserSubscription(userId);
    const plan = getPlanByTier(subscription.tier as any);

    if (!plan) {
      return { allowed: false, unlimited: false, reason: 'No active subscription' };
    }

    const categoryKey = category.toLowerCase() as 'text' | 'image' | 'video' | 'audio';
    const categoryAccess: ModelAccessCategory | undefined = plan.modelAccess[categoryKey];

    if (!categoryAccess) {
      return { allowed: false, unlimited: false, reason: 'Invalid category' };
    }

    // Check if model is in allowed list
    const isAllowed =
      categoryAccess.allowed.includes('*') ||
      categoryAccess.allowed.includes(modelSlug);

    if (!isAllowed) {
      return {
        allowed: false,
        unlimited: false,
        reason: `Model "${modelSlug}" is not included in your ${plan.name} plan. Upgrade to access it.`,
      };
    }

    // Check if model usage is unlimited
    const isUnlimited =
      categoryAccess.unlimited?.includes('*') ||
      categoryAccess.unlimited?.includes(modelSlug) ||
      false;

    return { allowed: true, unlimited: isUnlimited };
  }

  /**
   * Deduct credits for model usage. Skips deduction if the model is unlimited for the user.
   */
  async deductCredits(
    userId: string,
    modelSlug: string,
    category: WalletCategory,
    amount: number
  ): Promise<boolean> {
    const access = await this.canUseModel(userId, modelSlug, category);

    if (!access.allowed) {
      logger.warn(`User ${userId} denied access to ${modelSlug}`, { reason: access.reason });
      return false;
    }

    if (access.unlimited) {
      logger.debug(`User ${userId} has unlimited access to ${modelSlug}, skipping deduction`);
      return true;
    }

    // Check sufficient balance and deduct
    const hasSufficient = await walletService.hasSufficientBalance(userId, category, amount);
    if (!hasSufficient) {
      return false;
    }

    await walletService.deductCredits(userId, category, amount, {
      requestId: 'access-check',
      priceItemCode: modelSlug,
      description: `Model usage: ${modelSlug}`,
    });

    return true;
  }
}

export const modelAccessService = new ModelAccessService();
