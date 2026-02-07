import { Router } from 'express';
import { prisma } from '../../config/database';
import { subscriptionService } from '../../services/SubscriptionService';
import { logger } from '../../utils/logger';
import { SubscriptionTier } from '@prisma/client';

const router = Router();

/**
 * GET /api/webapp/subscriptions/plans
 * Returns all subscription plans.
 */
router.get('/subscriptions/plans', async (_req, res) => {
  try {
    const plans = subscriptionService.getAllPlanConfigs();
    return res.json({ plans });
  } catch (error) {
    logger.error('Failed to get subscription plans', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/subscriptions/models/:tier
 * Returns all AI models available for a given tier, grouped by category.
 */
router.get('/subscriptions/models/:tier', async (req, res) => {
  const { tier } = req.params;

  const validTiers: string[] = Object.values(SubscriptionTier);
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ message: `Invalid tier: ${tier}` });
  }

  try {
    const planConfig = subscriptionService.getPlanConfig(tier as SubscriptionTier);
    if (!planConfig) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Get all active models from DB
    const allModels = await prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Filter models based on tier's modelAccess config
    const filterModels = (
      models: typeof allModels,
      category: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO',
      access: { allowed: string[]; unlimited?: string[] }
    ) => {
      const categoryModels = models.filter((m) => m.category === category);

      // If '*' in allowed, include all models in this category
      if (access.allowed.includes('*')) {
        return categoryModels.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          creditCost: m.tokenCost,
          isUnlimited: access.unlimited?.includes('*') || access.unlimited?.includes(m.slug) || false,
        }));
      }

      // Otherwise filter to allowed slugs only
      return categoryModels
        .filter((m) => access.allowed.includes(m.slug))
        .map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          creditCost: m.tokenCost,
          isUnlimited: access.unlimited?.includes(m.slug) || false,
        }));
    };

    const models = {
      text: filterModels(allModels, 'TEXT', planConfig.modelAccess.text),
      image: filterModels(allModels, 'IMAGE', planConfig.modelAccess.image),
      video: filterModels(allModels, 'VIDEO', planConfig.modelAccess.video),
      audio: filterModels(allModels, 'AUDIO', planConfig.modelAccess.audio),
    };

    return res.json({
      tier,
      credits: planConfig.credits,
      models,
    });
  } catch (error) {
    logger.error('Failed to get models for tier', { error, tier });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/webapp/subscriptions/current/:telegramId
 * Returns user's current subscription.
 */
router.get('/subscriptions/current/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscription = await subscriptionService.getUserSubscription(user.id);
    const planConfig = subscriptionService.getPlanConfig(subscription.tier);

    return res.json({
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan: planConfig
        ? {
            name: planConfig.name,
            credits: planConfig.credits,
            features: planConfig.features,
            referralBonus: planConfig.referralBonus,
            modelAccess: planConfig.modelAccess,
          }
        : null,
    });
  } catch (error) {
    logger.error('Failed to get current subscription', { error, telegramId });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/webapp/subscriptions/upgrade
 * Initiates a subscription upgrade.
 */
router.post('/subscriptions/upgrade', async (req, res) => {
  const { telegramId, tier } = req.body;

  if (!telegramId || !tier) {
    return res.status(400).json({ message: 'telegramId and tier are required' });
  }

  const validTiers: string[] = Object.values(SubscriptionTier);
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ message: `Invalid tier: ${tier}` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscription = await subscriptionService.upgradeTier(user.id, tier as SubscriptionTier);
    const planConfig = subscriptionService.getPlanConfig(subscription.tier);

    return res.json({
      message: 'Subscription upgraded successfully',
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      },
      plan: planConfig
        ? { name: planConfig.name, credits: planConfig.credits }
        : null,
    });
  } catch (error: any) {
    logger.error('Failed to upgrade subscription', { error, telegramId, tier });
    return res.status(400).json({ message: error.message || 'Failed to upgrade' });
  }
});

/**
 * POST /api/webapp/subscriptions/cancel
 * Cancels subscription at period end.
 */
router.post('/subscriptions/cancel', async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ message: 'telegramId is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscription = await subscriptionService.cancelSubscription(user.id);

    return res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: {
        tier: subscription.tier,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      },
    });
  } catch (error: any) {
    logger.error('Failed to cancel subscription', { error, telegramId });
    return res.status(400).json({ message: error.message || 'Failed to cancel' });
  }
});

export default router;
