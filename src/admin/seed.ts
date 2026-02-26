/**
 * Seed script to create the first SUPER_ADMIN user.
 *
 * Usage:
 *   npx ts-node src/admin/seed.ts <username> <password> <telegramId>
 *
 * Example:
 *   npx ts-node src/admin/seed.ts admin MySecurePass123! 123456789
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const [, , username, password, telegramIdStr] = process.argv;

  if (!username || !password || !telegramIdStr) {
    console.error('Usage: npx ts-node src/admin/seed.ts <username> <password> <telegramId>');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('Password must be at least 12 characters');
    process.exit(1);
  }

  const telegramId = BigInt(telegramIdStr);
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.adminUser.findFirst({
      where: { OR: [{ username }, { telegramId }] },
    });

    if (existing) {
      console.error(`Admin already exists: ${existing.username} (telegramId: ${existing.telegramId})`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        role: 'SUPER_ADMIN',
        telegramId,
      },
    });

    console.log(`✅ SUPER_ADMIN created: ${admin.username} (id: ${admin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
