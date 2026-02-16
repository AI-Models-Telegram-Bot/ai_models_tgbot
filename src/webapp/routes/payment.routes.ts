import { Router } from 'express';
import { Telegram } from 'telegraf';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { subscriptionService } from '../../services/SubscriptionService';
import { yookassaService } from '../../services/YooKassaService';
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
    } else if (['yookassa', 'sbp', 'sberpay', 'card_ru'].includes(paymentMethod)) {
      // All Russian payment methods go through YooKassa with specific payment_method_data.type
      const yookassaMethodMap: Record<string, 'sbp' | 'sberbank' | 'bank_card' | undefined> = {
        sbp: 'sbp',
        sberpay: 'sberbank',
        card_ru: 'bank_card',
        yookassa: undefined,
      };
      const yookassaType = yookassaMethodMap[paymentMethod];
      const baseReturnUrl = req.body.returnUrl || `${config.webapp.url || 'https://webapp.vseonix.com'}/payment/success`;

      const { confirmationUrl, paymentId } = await yookassaService.createPayment(
        user.id,
        tier as SubscriptionTier,
        baseReturnUrl,
        yookassaType,
      );

      return res.json({
        method: 'yookassa',
        confirmationUrl,
        paymentId,
        priceRUB: planConfig.priceRUB,
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
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.userId !== user.id) {
      return res.status(403).json({ message: 'Payment does not belong to this user' });
    }

    const statusMap: Record<string, string> = {
      SUCCEEDED: 'succeeded',
      CANCELED: 'failed',
      PENDING: 'pending',
      WAITING_FOR_CAPTURE: 'pending',
    };

    return res.json({
      status: statusMap[payment.status] || 'pending',
      message: payment.status === 'SUCCEEDED'
        ? 'Payment completed successfully'
        : payment.status === 'CANCELED'
        ? 'Payment was canceled'
        : 'Payment is being processed',
    });
  } catch (error: any) {
    logger.error('Failed to verify payment', { error, paymentId, telegramId });
    return res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
});

/**
 * GET /api/webapp/payment/status/:paymentId
 * Returns the current status of a payment from the database.
 */
router.get('/payment/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({ message: 'paymentId is required' });
  }

  try {
    const status = await yookassaService.getPaymentStatus(paymentId);
    return res.json(status);
  } catch (error: any) {
    logger.error('Failed to get payment status', { error: error.message, paymentId });
    return res.status(404).json({ message: error.message || 'Payment not found' });
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
        id: 'sbp',
        name: 'SBP (Fast Payments)',
        nameRu: 'СБП',
        icon: 'sbp',
        available: true,
        description: 'System of Fast Payments',
        descriptionRu: 'Система быстрых платежей',
      },
      {
        id: 'sberpay',
        name: 'SberPay',
        nameRu: 'SberPay',
        icon: 'sberpay',
        available: true,
        description: 'Pay with SberPay',
        descriptionRu: 'Оплата через SberPay',
      },
      {
        id: 'card_ru',
        name: 'Bank Card',
        nameRu: 'Банковская карта',
        icon: 'card',
        available: true,
        description: 'Mir, Visa, Mastercard',
        descriptionRu: 'Мир, Visa, Mastercard',
      },
      {
        id: 'telegram_stars',
        name: 'Telegram Stars',
        nameRu: 'Telegram Stars',
        icon: 'stars',
        available: true,
        description: 'Pay with Telegram Stars',
        descriptionRu: 'Оплата звёздами Telegram',
      },
    ],
  });
});

export default router;
