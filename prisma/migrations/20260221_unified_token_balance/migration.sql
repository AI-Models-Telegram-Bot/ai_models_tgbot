-- Unified Token Balance Migration
-- Consolidates textBalance + imageBalance + videoBalance + audioBalance into a single tokenBalance

-- Step 1: Add tokenBalance column to user_wallets
ALTER TABLE "user_wallets" ADD COLUMN "token_balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Step 2: Populate tokenBalance as sum of all 4 category balances
UPDATE "user_wallets"
SET "token_balance" = "text_balance" + "image_balance" + "video_balance" + "audio_balance";

-- Step 3: Drop old balance columns
ALTER TABLE "user_wallets" DROP COLUMN "text_balance";
ALTER TABLE "user_wallets" DROP COLUMN "image_balance";
ALTER TABLE "user_wallets" DROP COLUMN "video_balance";
ALTER TABLE "user_wallets" DROP COLUMN "audio_balance";

-- Step 4: Add tokens column to subscription_plans
ALTER TABLE "subscription_plans" ADD COLUMN "tokens" INTEGER;

-- Step 5: Populate tokens as sum of all 4 credit columns (NULL means unlimited)
UPDATE "subscription_plans"
SET "tokens" = COALESCE("text_credits", 0) + COALESCE("image_credits", 0) + COALESCE("video_credits", 0) + COALESCE("audio_credits", 0)
WHERE "text_credits" IS NOT NULL OR "image_credits" IS NOT NULL OR "video_credits" IS NOT NULL OR "audio_credits" IS NOT NULL;

-- For tiers where ALL credits are NULL (unlimited), keep tokens as NULL
UPDATE "subscription_plans"
SET "tokens" = NULL
WHERE "text_credits" IS NULL AND "image_credits" IS NULL AND "video_credits" IS NULL AND "audio_credits" IS NULL;

-- Step 6: Drop old credit columns
ALTER TABLE "subscription_plans" DROP COLUMN "text_credits";
ALTER TABLE "subscription_plans" DROP COLUMN "image_credits";
ALTER TABLE "subscription_plans" DROP COLUMN "video_credits";
ALTER TABLE "subscription_plans" DROP COLUMN "audio_credits";
