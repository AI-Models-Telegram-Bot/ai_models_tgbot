import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { generateReferralCode } from '../utils/helpers';
import { config } from '../config';
import { Language } from '../locales';

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
        await this.grantReferralBonus(userData.referredByCode);
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
    const totalBonus = count * config.tokens.referralBonus;

    return { count, totalBonus };
  }

  async updateLanguage(userId: string, language: Language): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { language },
    });
  }

  private async grantReferralBonus(referralCode: string): Promise<void> {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (referrer) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: {
          tokenBalance: { increment: config.tokens.referralBonus },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: referrer.id,
          type: 'REFERRAL_BONUS',
          amount: 0,
          tokensAmount: config.tokens.referralBonus,
          description: 'Referral bonus',
          status: 'COMPLETED',
        },
      });
    }
  }
}

export const userService = new UserService();
