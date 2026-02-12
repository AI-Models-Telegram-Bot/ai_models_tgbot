/**
 * Grant signup bonus tokens to users who haven't received them yet.
 *
 * Usage:
 *   npx ts-node scripts/grant-signup-bonus.ts          # Grant to all users missing bonus
 *   npx ts-node scripts/grant-signup-bonus.ts <userId>  # Grant to specific user by ID
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BONUS_AMOUNT = parseInt(process.env.FREE_TOKENS_ON_REGISTRATION || '5', 10);

async function grantBonus(userId: string, label: string) {
  // Ensure wallet exists
  let wallet = await prisma.userWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.userWallet.create({ data: { userId } });
    console.log(`  Created wallet for ${label}`);
  }

  const categories = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as const;
  const balanceKeys = {
    TEXT: 'textBalance',
    IMAGE: 'imageBalance',
    VIDEO: 'videoBalance',
    AUDIO: 'audioBalance',
  } as const;

  for (const cat of categories) {
    const key = balanceKeys[cat];
    const currentBalance = wallet[key];

    await prisma.$transaction(async (tx) => {
      const newBalance = currentBalance + BONUS_AMOUNT;

      await tx.userWallet.update({
        where: { userId },
        data: { [key]: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          category: cat,
          transactionType: 'BONUS',
          amount: BONUS_AMOUNT,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: 'Signup bonus',
        },
      });
    });

    console.log(`  +${BONUS_AMOUNT} ${cat} credits (${currentBalance} → ${currentBalance + BONUS_AMOUNT})`);
  }
}

async function main() {
  const targetId = process.argv[2];

  if (targetId) {
    // Grant to specific user by ID
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, firstName: true, telegramId: true },
    });
    if (!user) {
      console.error(`User not found: ${targetId}`);
      process.exit(1);
    }
    const label = user.telegramId ? `tg:${user.telegramId}` : user.id;
    console.log(`Granting ${BONUS_AMOUNT} tokens per category to: ${label} (${user.firstName || 'no name'})`);
    await grantBonus(user.id, label);
    console.log('Done!');
  } else {
    // Find all users who never received a BONUS transaction
    const usersWithBonus = await prisma.walletTransaction.findMany({
      where: { transactionType: 'BONUS', description: 'Signup bonus' },
      select: { userId: true },
      distinct: ['userId'],
    });

    const bonusUserIds = new Set(usersWithBonus.map((t) => t.userId));

    const allUsers = await prisma.user.findMany({
      select: { id: true, firstName: true, telegramId: true },
    });

    const usersNeedingBonus = allUsers.filter((u) => !bonusUserIds.has(u.id));

    if (usersNeedingBonus.length === 0) {
      console.log('All users already have signup bonus.');
      return;
    }

    console.log(`Found ${usersNeedingBonus.length} user(s) without signup bonus:\n`);
    for (const user of usersNeedingBonus) {
      const label = user.telegramId ? `tg:${user.telegramId}` : user.id;
      console.log(`Granting to: ${label} (${user.firstName || 'no name'})`);
      await grantBonus(user.id, label);
      console.log('');
    }
    console.log('Done! All users granted signup bonus.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
