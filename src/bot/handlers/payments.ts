import { BotContext } from '../types';
import { subscriptionService } from '../../services/SubscriptionService';
import { logger } from '../../utils/logger';
import { SubscriptionTier } from '@prisma/client';

/**
 * Handle pre_checkout_query - must answer within 10 seconds
 * This is called before the payment is finalized.
 */
export async function handlePreCheckoutQuery(ctx: BotContext) {
  try {
    const query = ctx.preCheckoutQuery;
    if (!query) return;

    // Parse the payload to validate
    const payload = JSON.parse(query.invoice_payload);

    if (payload.type === 'subscription') {
      // Validate the subscription tier
      const validTiers = Object.values(SubscriptionTier);
      if (!validTiers.includes(payload.tier)) {
        await ctx.answerPreCheckoutQuery(false, 'Invalid subscription tier');
        return;
      }

      // All good - approve the checkout
      await ctx.answerPreCheckoutQuery(true);
    } else {
      // Unknown payload type
      await ctx.answerPreCheckoutQuery(false, 'Unknown payment type');
    }
  } catch (error) {
    logger.error('Error in pre_checkout_query handler', { error });
    await ctx.answerPreCheckoutQuery(false, 'An error occurred. Please try again.');
  }
}

/**
 * Handle successful_payment - payment completed
 * This is called after the user has paid.
 */
export async function handleSuccessfulPayment(ctx: BotContext) {
  try {
    const message = ctx.message;
    if (!message || !('successful_payment' in message)) return;

    const payment = message.successful_payment;
    const payload = JSON.parse(payment.invoice_payload);

    logger.info('Successful payment received', {
      paymentId: payment.telegram_payment_charge_id,
      providerPaymentId: payment.provider_payment_charge_id,
      totalAmount: payment.total_amount,
      currency: payment.currency,
      payload,
    });

    if (payload.type === 'subscription' && payload.userId && payload.tier) {
      // Upgrade the user's subscription
      const subscription = await subscriptionService.upgradeTier(
        payload.userId,
        payload.tier as SubscriptionTier
      );

      const planConfig = subscriptionService.getPlanConfig(subscription.tier);
      const planName = planConfig?.name || subscription.tier;

      // Get user's language
      const lang = ctx.user?.languageCode?.startsWith('ru') ? 'ru' : 'en';

      // Send confirmation message
      const messages = {
        en: `🎉 *Payment Successful!*\n\nYou've been upgraded to *${planName}*!\n\nYour new subscription is now active. Enjoy your enhanced AI capabilities!`,
        ru: `🎉 *Оплата прошла успешно!*\n\nВы перешли на тариф *${planName}*!\n\nВаша подписка активирована. Наслаждайтесь расширенными возможностями ИИ!`,
      };

      await ctx.reply(messages[lang], { parse_mode: 'Markdown' });

      logger.info('Subscription upgraded after payment', {
        userId: payload.userId,
        tier: payload.tier,
        paymentId: payment.telegram_payment_charge_id,
      });
    }
  } catch (error) {
    logger.error('Error in successful_payment handler', { error });
    await ctx.reply('Your payment was received but there was an issue activating your subscription. Please contact support.');
  }
}
