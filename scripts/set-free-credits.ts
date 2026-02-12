/**
 * Set user wallet balances to match Free plan credits.
 * Uses the actual Free plan config: text=100, image=50, video=10, audio=50
 *
 * Usage:
 *   npx ts-node scripts/set-free-credits.ts           # Set for ALL users
 *   npx ts-node scripts/set-free-credits.ts <userId>   # Set for specific user
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Free plan credits from subscriptions.ts
const FREE_CREDITS = { text: 100, image: 50, video: 10, audio: 50 };

async function setCredits(userId: string, label: string) {
  let wallet = await prisma.userWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.userWallet.create({ data: { userId } });
    console.log(`  Created wallet for ${label}`);
  }

  const updates = {
    textBalance: FREE_CREDITS.text,
    imageBalance: FREE_CREDITS.image,
    videoBalance: FREE_CREDITS.video,
    audioBalance: FREE_CREDITS.audio,
  };

  await prisma.userWallet.update({
    where: { userId },
    data: updates,
  });

  // Log transactions for each category
  const categories = [
    { cat: 'TEXT' as const, amount: FREE_CREDITS.text, key: 'textBalance' as const },
    { cat: 'IMAGE' as const, amount: FREE_CREDITS.image, key: 'imageBalance' as const },
    { cat: 'VIDEO' as const, amount: FREE_CREDITS.video, key: 'videoBalance' as const },
    { cat: 'AUDIO' as const, amount: FREE_CREDITS.audio, key: 'audioBalance' as const },
  ];

  for (const { cat, amount, key } of categories) {
    const before = wallet[key];
    const diff = amount - before;
    if (diff !== 0) {
      await prisma.walletTransaction.create({
        data: {
          userId,
          category: cat,
          transactionType: 'BONUS',
          amount: diff,
          balanceBefore: before,
          balanceAfter: amount,
          description: 'Free plan credit adjustment',
        },
      });
    }
    console.log(`  ${cat}: ${before} → ${amount}`);
  }
}

async function main() {
  const targetId = process.argv[2];

  if (targetId) {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, firstName: true, telegramId: true },
    });
    if (!user) {
      console.error(`User not found: ${targetId}`);
      process.exit(1);
    }
    const label = user.telegramId ? `tg:${user.telegramId}` : user.id;
    console.log(`Setting Free plan credits for: ${label} (${user.firstName || 'no name'})`);
    await setCredits(user.id, label);
    console.log('Done!');
  } else {
    const allUsers = await prisma.user.findMany({
      select: { id: true, firstName: true, telegramId: true },
    });

    console.log(`Setting Free plan credits for ${allUsers.length} user(s):\n`);
    for (const user of allUsers) {
      const label = user.telegramId ? `tg:${user.telegramId}` : user.id;
      console.log(`${label} (${user.firstName || 'no name'}):`);
      await setCredits(user.id, label);
      console.log('');
    }
    console.log('Done!');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
