import { User } from '@prisma/client';
import { Telegram } from 'telegraf';
import { prisma } from '../config/database';
import { generateReferralCode } from '../utils/helpers';
import { config } from '../config';
import { Language } from '../locales';
import { walletService } from './WalletService';
import { SUBSCRIPTION_PLANS, SubscriptionTier, REFERRAL_INVITEE_BONUS } from '../config/subscriptions';
import { logger } from '../utils/logger';

/** Tokens granted to the referrer when someone signs up via their link */
const REFERRAL_SIGNUP_BONUS = 15;

export class UserService {
  async findOrCreate(telegramId: bigint, userData: {
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    referredByCode?: string;
  }): Promise<User> {
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // Set language based on Telegram language code
      const defaultLang: Language = userData.languageCode?.startsWith('ru') ? 'ru' : 'en';

      user = await prisma.user.create({
        data: {
          telegramId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          languageCode: userData.languageCode,
          language: defaultLang,
          referralCode: generateReferralCode(),
          referredBy: userData.referredByCode,
          tokenBalance: config.tokens.freeOnRegistration,
        },
      });

      // Grant referral bonus if referred
      if (userData.referredByCode) {
        await this.grantReferralBonus(userData.referredByCode, user);
      }
    }

    return user;
  }

  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId },
    });
  }

  async updateBalance(userId: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        tokenBalance: { increment: amount },
      },
    });
  }

  async getReferralStats(userId: string): Promise<{ count: number; totalBonus: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: true,
      },
    });

    const count = user?.referrals.length || 0;

    // Sum actual earned credits from wallet BONUS transactions with referral description
    const bonusTransactions = await prisma.walletTransaction.aggregate({
      where: {
        userId,
        transactionType: 'BONUS',
        description: { startsWith: 'Referral bonus' },
      },
      _sum: { amount: true },
    });

    const totalBonus = bonusTransactions._sum.amount || 0;

    return { count, totalBonus: Math.round(totalBonus) };
  }

  async updateLanguage(userId: string, language: Language): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { language },
    });
  }

  private async grantReferralBonus(referralCode: string, newUser: User): Promise<void> {
    try {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        include: { subscription: { select: { tier: true } } },
      });

      if (!referrer) return;

      // Get referrer's tier to determine bonus percentage
      const referrerTier = (referrer.subscription?.tier || 'FREE') as SubscriptionTier;
      const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === referrerTier);
      const bonusPercent = plan?.referralBonus ?? 3;

      // Calculate token bonus: base signup bonus scaled by tier percentage
      const tokenBonus = Math.round(REFERRAL_SIGNUP_BONUS * (1 + bonusPercent / 100));

      // Ensure wallets exist
      await walletService.getOrCreateWallet(referrer.id);
      await walletService.getOrCreateWallet(newUser.id);

      // Grant referrer bonus (purchased tokens — persist forever)
      if (tokenBonus > 0) {
        await walletService.addPurchasedTokens(referrer.id, tokenBonus, {
          description: `Referral bonus: new user joined`,
        });
      }

      // Grant invitee bonus tokens (purchased tokens — persist forever)
      if (REFERRAL_INVITEE_BONUS > 0) {
        await walletService.addPurchasedTokens(newUser.id, REFERRAL_INVITEE_BONUS, {
          description: `Welcome bonus: joined via referral link`,
        });
      }

      // Notify referrer via Telegram
      if (referrer.telegramId) {
        await this.notifyReferrer(referrer, newUser, tokenBonus);
      }

      // Notify invitee about their bonus
      if (newUser.telegramId) {
        await this.notifyInvitee(newUser);
      }

      logger.info(`Referral bonus granted: referrer ${referrer.id} +${tokenBonus}tk, invitee ${newUser.id} +${REFERRAL_INVITEE_BONUS}tk`, {
        referrerId: referrer.id,
        newUserId: newUser.id,
      });
    } catch (error) {
      logger.error('Failed to grant referral bonus', { error, referralCode });
    }
  }

  private async notifyReferrer(referrer: User, newUser: User, tokenBonus: number): Promise<void> {
    try {
      const telegram = new Telegram(config.bot.token);
      const lang = (referrer.language as Language) || 'en';
      const newUserName = newUser.username ? `@${newUser.username}` : (newUser.firstName || 'Someone');

      const message = lang === 'ru'
        ? `🎉 <b>Новый реферал!</b>\n\n${newUserName} присоединился по вашей ссылке.\n\n💰 <b>Ваш бонус:</b>\n⚡ +${tokenBonus} токенов\n\nПриглашайте больше друзей, чтобы заработать ещё!`
        : `🎉 <b>New referral!</b>\n\n${newUserName} joined via your link.\n\n💰 <b>Your bonus:</b>\n⚡ +${tokenBonus} tokens\n\nInvite more friends to earn more!`;

      await telegram.sendMessage(referrer.telegramId!.toString(), message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.warn('Failed to send referral notification', { error, referrerId: referrer.id });
    }
  }

  private async notifyInvitee(newUser: User): Promise<void> {
    try {
      const telegram = new Telegram(config.bot.token);
      const lang = (newUser.language as Language) || 'en';

      const message = lang === 'ru'
        ? `🎁 <b>Добро пожаловать!</b>\n\nВы присоединились по реферальной ссылке и получили <b>⚡ ${REFERRAL_INVITEE_BONUS} бонусных токенов</b>!\n\nИспользуйте их для генерации текста, изображений и видео.`
        : `🎁 <b>Welcome!</b>\n\nYou joined via a referral link and received <b>⚡ ${REFERRAL_INVITEE_BONUS} bonus tokens</b>!\n\nUse them to generate text, images, and videos.`;

      await telegram.sendMessage(newUser.telegramId!.toString(), message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.warn('Failed to send invitee notification', { error, userId: newUser.id });
    }
  }
}

export const userService = new UserService();
