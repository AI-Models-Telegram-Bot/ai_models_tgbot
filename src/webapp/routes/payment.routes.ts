import { Router } from 'express';
import { Telegram } from 'telegraf';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { subscriptionService } from '../../services/SubscriptionService';
import { logger } from '../../utils/logger';
import { SubscriptionTier } from '@prisma/client';

const router = Router();

// Telegram API client for creating invoices
const telegram = new Telegram(config.bot.token);

/**
 * POST /api/webapp/payment/create
 * Creates a payment invoice for Telegram Stars.
 */
router.post('/payment/create', async (req, res) => {
  const { telegramId, tier, paymentMethod } = req.body;

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

    const planConfig = subscriptionService.getPlanConfig(tier as SubscriptionTier);
    if (!planConfig) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // For FREE tier, no payment needed
    if (tier === 'FREE') {
      return res.status(400).json({ message: 'Free tier does not require payment' });
    }

    // For ENTERPRISE tier, contact us flow
    if (tier === 'ENTERPRISE') {
      return res.json({
        method: 'contact',
        message: 'Please contact us for Enterprise pricing',
      });
    }

    // Handle different payment methods
    if (paymentMethod === 'telegram_stars') {
      // Convert USD price to Telegram Stars (roughly 1 star = $0.02)
      // Stars must be integer, minimum 1
      const starsAmount = Math.max(1, Math.round((planConfig.priceUSD || 0) * 50));

      // Create invoice link using Telegram Bot API
      // For Telegram Stars (XTR), provider_token must be empty string
      const invoiceLink = await telegram.createInvoiceLink({
        title: `${planConfig.name} Subscription`,
        description: `${planConfig.name} plan - Monthly subscription with ${planConfig.credits.text === null ? 'unlimited' : planConfig.credits.text} text credits, ${planConfig.credits.image === null ? 'unlimited' : planConfig.credits.image} image credits, and more.`,
        payload: JSON.stringify({
          userId: user.id,
          tier: tier,
          type: 'subscription',
        }),
        provider_token: '', // Empty for Telegram Stars
        currency: 'XTR', // XTR = Telegram Stars
        prices: [
          {
            label: `${planConfig.name} Plan`,
            amount: starsAmount, // Stars amount (integer)
          },
        ],
      });

      return res.json({
        method: 'telegram_stars',
        invoiceUrl: invoiceLink,
        starsAmount,
        priceUSD: planConfig.priceUSD,
      });
    } else if (paymentMethod === 'yookassa') {
      // YooKassa placeholder - would integrate with YooKassa API
      return res.json({
        method: 'yookassa',
        status: 'coming_soon',
        priceRUB: planConfig.priceRUB,
        message: 'YooKassa payments coming soon',
      });
    } else if (paymentMethod === 'sbp') {
      // SBP (System of Fast Payments) placeholder
      return res.json({
        method: 'sbp',
        status: 'coming_soon',
        priceRUB: planConfig.priceRUB,
        message: 'SBP payments coming soon',
      });
    } else if (paymentMethod === 'card_ru') {
      // Russian card payment placeholder
      return res.json({
        method: 'card_ru',
        status: 'coming_soon',
        priceRUB: planConfig.priceRUB,
        message: 'Russian card payments coming soon',
      });
    }

    return res.status(400).json({ message: 'Invalid payment method' });
  } catch (error: any) {
    logger.error('Failed to create payment', { error, telegramId, tier });
    return res.status(500).json({ message: error.message || 'Failed to create payment' });
  }
});

/**
 * POST /api/webapp/payment/verify
 * Verifies a completed payment.
 * Note: For Telegram Stars, verification happens via pre_checkout_query and successful_payment handlers in the bot.
 */
router.post('/payment/verify', async (req, res) => {
  const { paymentId, telegramId } = req.body;

  if (!paymentId || !telegramId) {
    return res.status(400).json({ message: 'paymentId and telegramId are required' });
  }

  try {
    // For Telegram Stars, the payment is handled by the bot's successful_payment handler
    // This endpoint can be used to check payment status from stored records

    // TODO: Implement payment record lookup
    return res.json({
      status: 'pending',
      message: 'Payment verification in progress. You will receive a notification when complete.',
    });
  } catch (error: any) {
    logger.error('Failed to verify payment', { error, paymentId, telegramId });
    return res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
});

/**
 * GET /api/webapp/payment/methods
 * Returns available payment methods.
 */
router.get('/payment/methods', (_req, res) => {
  return res.json({
    methods: [
      {
        id: 'telegram_stars',
        name: 'Telegram Stars',
        nameRu: 'Telegram Stars',
        icon: '⭐',
        available: true,
        description: 'Pay with Telegram Stars',
        descriptionRu: 'Оплата звёздами Telegram',
      },
      {
        id: 'yookassa',
        name: 'YooKassa',
        nameRu: 'ЮKassa',
        icon: '💳',
        available: false,
        description: 'Russian cards & wallets',
        descriptionRu: 'Российские карты и кошельки',
        comingSoon: true,
      },
      {
        id: 'sbp',
        name: 'SBP',
        nameRu: 'СБП',
        icon: '🏦',
        available: false,
        description: 'System of Fast Payments',
        descriptionRu: 'Система быстрых платежей',
        comingSoon: true,
      },
      {
        id: 'card_ru',
        name: 'Bank Card',
        nameRu: 'Банковская карта',
        icon: '💳',
        available: false,
        description: 'Mir, Visa, Mastercard (RU)',
        descriptionRu: 'Мир, Visa, Mastercard (РФ)',
        comingSoon: true,
      },
    ],
  });
});

export default router;
