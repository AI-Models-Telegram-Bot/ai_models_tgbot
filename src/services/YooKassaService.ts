import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { Telegram } from 'telegraf';
import { SubscriptionTier, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';
import { getPlanByTier } from '../config/subscriptions';
import { subscriptionService } from './SubscriptionService';
import { logger } from '../utils/logger';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

interface YooKassaAmount {
  value: string;
  currency: string;
}

interface YooKassaConfirmation {
  type: string;
  return_url?: string;
  confirmation_url?: string;
}

interface YooKassaPaymentResponse {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  amount: YooKassaAmount;
  confirmation?: YooKassaConfirmation;
  description?: string;
  metadata?: Record<string, string>;
  created_at: string;
  paid: boolean;
}

interface YooKassaWebhookEvent {
  type: string;
  event: string;
  object: YooKassaPaymentResponse;
}

export class YooKassaService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: YOOKASSA_API_URL,
      auth: {
        username: config.yookassa.shopId,
        password: config.yookassa.secretKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a YooKassa payment for a subscription tier.
   * Returns the confirmation URL the user should be redirected to.
   */
  async createPayment(
    userId: string,
    tier: SubscriptionTier,
    returnUrl: string,
    paymentMethodType?: 'sbp' | 'sberbank' | 'bank_card',
  ): Promise<{ confirmationUrl: string; paymentId: string }> {
    const planConfig = getPlanByTier(tier as any);
    if (!planConfig) {
      throw new Error(`Plan config not found for tier: ${tier}`);
    }

    if (planConfig.priceRUB === null || planConfig.priceRUB === 0) {
      throw new Error(`Tier ${tier} does not have a RUB price`);
    }

    // Create a PENDING payment record in the database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: planConfig.priceRUB,
        currency: 'RUB',
        status: 'PENDING',
        provider: 'YOOKASSA',
        tier,
        description: `${planConfig.name} subscription`,
        metadata: { tier },
      },
    });

    const idempotencyKey = crypto.randomUUID();

    // Append paymentId to return URL so the success page can poll status
    const separator = returnUrl.includes('?') ? '&' : '?';
    const returnUrlWithPayment = `${returnUrl}${separator}paymentId=${payment.id}`;

    try {
      const response = await this.client.post<YooKassaPaymentResponse>(
        '/payments',
        {
          amount: {
            value: planConfig.priceRUB.toFixed(2),
            currency: 'RUB',
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: returnUrlWithPayment,
          },
          description: `${planConfig.name} plan subscription`,
          ...(paymentMethodType && {
            payment_method_data: { type: paymentMethodType },
          }),
          metadata: {
            userId,
            tier,
            paymentId: payment.id,
          },
        },
        {
          headers: {
            'Idempotence-Key': idempotencyKey,
          },
        },
      );

      const yooPayment = response.data;

      // Update the local record with the external (YooKassa) payment ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: { externalId: yooPayment.id },
      });

      const confirmationUrl = yooPayment.confirmation?.confirmation_url;
      if (!confirmationUrl) {
        throw new Error('YooKassa response missing confirmation URL');
      }

      logger.info('YooKassa payment created', {
        paymentId: payment.id,
        externalId: yooPayment.id,
        tier,
        amount: planConfig.priceRUB,
      });

      return { confirmationUrl, paymentId: payment.id };
    } catch (error: any) {
      // Mark the payment as canceled on API failure
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELED' },
      });

      const detail = error.response?.data || error.message;
      logger.error('YooKassa payment creation failed', { error: detail, userId, tier });
      throw new Error(`YooKassa payment creation failed: ${JSON.stringify(detail)}`);
    }
  }

  /**
   * Handle incoming webhook notification from YooKassa.
   * Idempotent: if the payment has already been processed, it is skipped.
   */
  async handleWebhook(body: YooKassaWebhookEvent): Promise<void> {
    const event = body.event;
    const yooPayment = body.object;

    if (!yooPayment?.id) {
      logger.warn('YooKassa webhook: missing payment object or id', { body });
      return;
    }

    logger.info('YooKassa webhook received', {
      event,
      externalId: yooPayment.id,
      status: yooPayment.status,
    });

    // Find the local payment record by external ID
    const payment = await prisma.payment.findUnique({
      where: { externalId: yooPayment.id },
    });

    if (!payment) {
      logger.warn('YooKassa webhook: payment not found for external id', {
        externalId: yooPayment.id,
      });
      return;
    }

    // Idempotency: skip if already in a terminal state
    if (payment.status === 'SUCCEEDED' || payment.status === 'CANCELED') {
      logger.info('YooKassa webhook: payment already processed, skipping', {
        paymentId: payment.id,
        status: payment.status,
      });
      return;
    }

    if (event === 'payment.succeeded') {
      await this.handlePaymentSucceeded(payment.id, payment.userId, payment.tier);
    } else if (event === 'payment.canceled') {
      await this.handlePaymentCanceled(payment.id);
    } else if (event === 'payment.waiting_for_capture') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'WAITING_FOR_CAPTURE' },
      });
    } else {
      logger.info('YooKassa webhook: unhandled event type', { event });
    }
  }

  /**
   * Get the current status of a payment from the local database.
   */
  async getPaymentStatus(paymentId: string): Promise<{
    paymentId: string;
    status: PaymentStatus;
    tier: SubscriptionTier | null;
    amount: number;
    currency: string;
    createdAt: Date;
  }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      tier: payment.tier,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };
  }

  // ── Private helpers ────────────────────────────────────────

  private async handlePaymentSucceeded(
    paymentId: string,
    userId: string,
    tier: SubscriptionTier | null,
  ): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCEEDED' },
    });

    if (tier && tier !== 'FREE') {
      try {
        await subscriptionService.upgradeTier(userId, tier);
        logger.info('Subscription upgraded after YooKassa payment', {
          paymentId,
          userId,
          tier,
        });

        // Send Telegram notification to the user
        await this.sendPaymentNotification(userId, tier);
      } catch (err: any) {
        logger.error('Failed to upgrade subscription after payment', {
          paymentId,
          userId,
          tier,
          error: err.message,
        });
      }
    }
  }

  private async sendPaymentNotification(userId: string, tier: SubscriptionTier): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.telegramId) return;

      const planConfig = getPlanByTier(tier as any);
      const planName = planConfig?.name || tier;
      const lang = user.languageCode?.startsWith('ru') ? 'ru' : 'en';

      const messages = {
        en: `🎉 *Payment Successful!*\n\nYou've been upgraded to *${planName}*!\n\nYour new subscription is now active. Enjoy your enhanced AI capabilities!`,
        ru: `🎉 *Оплата прошла успешно!*\n\nВы перешли на тариф *${planName}*!\n\nВаша подписка активирована. Наслаждайтесь расширенными возможностями ИИ!`,
      };

      const telegram = new Telegram(config.bot.token);
      await telegram.sendMessage(user.telegramId.toString(), messages[lang], { parse_mode: 'Markdown' });
    } catch (err: any) {
      logger.warn('Failed to send YooKassa payment notification via Telegram', { userId, error: err.message });
    }
  }

  private async handlePaymentCanceled(paymentId: string): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELED' },
    });

    logger.info('YooKassa payment canceled', { paymentId });
  }
}

export const yookassaService = new YooKassaService();
