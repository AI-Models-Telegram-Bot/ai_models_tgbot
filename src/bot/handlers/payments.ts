import { BotContext } from '../types';
import { subscriptionService } from '../../services/SubscriptionService';
import { walletService } from '../../services/WalletService';
import { referralCommissionService } from '../../services/ReferralCommissionService';
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

    const payload = JSON.parse(query.invoice_payload);

    if (payload.type === 'subscription') {
      const validTiers = Object.values(SubscriptionTier);
      if (!validTiers.includes(payload.tier)) {
        await ctx.answerPreCheckoutQuery(false, 'Invalid subscription tier');
        return;
      }
      await ctx.answerPreCheckoutQuery(true);
    } else if (payload.type === 'token_purchase') {
      if (!payload.userId || !payload.packageId || !payload.tokens) {
        await ctx.answerPreCheckoutQuery(false, 'Invalid token purchase payload');
        return;
      }
      await ctx.answerPreCheckoutQuery(true);
    } else {
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

    if (payload.type === 'token_purchase' && payload.userId && payload.tokens) {
      // Token package purchase via Telegram Stars
      const tokens = Number(payload.tokens);

      await walletService.getOrCreateWallet(payload.userId);
      await walletService.addPurchasedTokens(payload.userId, tokens, {
        description: `Token purchase via Telegram Stars: ${tokens} tokens`,
        paymentId: payment.telegram_payment_charge_id,
      });

      const lang = ctx.user?.languageCode?.startsWith('ru') ? 'ru' : 'en';
      const messages = {
        en: `⚡ *+${tokens} tokens added!*\n\nYour token purchase is complete. Your balance has been updated.`,
        ru: `⚡ *+${tokens} токенов зачислено!*\n\nПокупка токенов завершена. Баланс обновлён.`,
      };

      await ctx.reply(messages[lang], { parse_mode: 'Markdown' });

      logger.info('Token purchase completed via Stars', {
        userId: payload.userId,
        tokens,
        paymentId: payment.telegram_payment_charge_id,
      });
    } else if (payload.type === 'subscription' && payload.userId && payload.tier) {
      // Subscription upgrade via Telegram Stars
      const subscription = await subscriptionService.upgradeTier(
        payload.userId,
        payload.tier as SubscriptionTier
      );

      const planConfig = subscriptionService.getPlanConfig(subscription.tier);
      const planName = planConfig?.name || subscription.tier;

      const lang = ctx.user?.languageCode?.startsWith('ru') ? 'ru' : 'en';
      const messages = {
        en: `🎉 *Payment Successful!*\n\nYou've been upgraded to *${planName}*!\n\nYour new subscription is now active. Enjoy your enhanced AI capabilities!`,
        ru: `🎉 *Оплата прошла успешно!*\n\nВы перешли на тариф *${planName}*!\n\nВаша подписка активирована. Наслаждайтесь расширенными возможностями ИИ!`,
      };

      await ctx.reply(messages[lang], { parse_mode: 'Markdown' });

      // Process referral commission (Stars → USD at ~$0.02/star)
      const starsUsd = payment.total_amount * 0.02;
      await referralCommissionService.processCommission({
        payingUserId: payload.userId,
        paymentAmount: starsUsd,
        paymentCurrency: 'USD',
        tier: payload.tier,
      });

      logger.info('Subscription upgraded after payment', {
        userId: payload.userId,
        tier: payload.tier,
        paymentId: payment.telegram_payment_charge_id,
      });
    }
  } catch (error) {
    logger.error('Error in successful_payment handler', { error });
    await ctx.reply('Your payment was received but there was an issue processing it. Please contact support.');
  }
}
