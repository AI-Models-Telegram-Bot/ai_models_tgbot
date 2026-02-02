import { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from '../src/config/subscriptions';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('Seeding subscription plans...');

  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        priceUSD: plan.priceUSD,
        priceRUB: plan.priceRUB,
        textCredits: plan.credits.text,
        imageCredits: plan.credits.image,
        videoCredits: plan.credits.video,
        audioCredits: plan.credits.audio,
        modelAccess: plan.modelAccess as any,
        features: plan.features,
        referralBonus: plan.referralBonus,
        prioritySupport: plan.prioritySupport,
        apiAccess: plan.apiAccess,
      },
      create: {
        tier: plan.tier,
        name: plan.name,
        priceUSD: plan.priceUSD,
        priceRUB: plan.priceRUB,
        textCredits: plan.credits.text,
        imageCredits: plan.credits.image,
        videoCredits: plan.credits.video,
        audioCredits: plan.credits.audio,
        modelAccess: plan.modelAccess as any,
        features: plan.features,
        referralBonus: plan.referralBonus,
        prioritySupport: plan.prioritySupport,
        apiAccess: plan.apiAccess,
      },
    });

    console.log(`  Upserted plan: ${plan.name} (${plan.tier})`);
  }

  console.log('Subscription plans seeded successfully.');
}

seedSubscriptionPlans()
  .catch((e) => {
    console.error('Error seeding subscription plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
