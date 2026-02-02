import { BotContext } from '../types';
import { logger } from '../../utils/logger';

export async function handleWebAppData(ctx: BotContext): Promise<void> {
  if (!ctx.message || !('web_app_data' in ctx.message)) return;

  const data = ctx.message.web_app_data;

  try {
    const payload = JSON.parse(data.data);

    switch (payload.action) {
      case 'subscription_purchased':
        await ctx.reply(
          `✅ Subscription activated!\n\n` +
          `Tier: ${payload.tier}\n` +
          `Thank you for upgrading!`,
          { parse_mode: 'HTML' }
        );
        break;

      case 'subscription_canceled':
        await ctx.reply(
          'Your subscription has been scheduled for cancellation at the end of the billing period.'
        );
        break;

      default:
        logger.info('Unknown WebApp action', { payload });
    }
  } catch (err) {
    logger.error('Failed to parse web_app_data', { error: err, data: data.data });
  }
}
