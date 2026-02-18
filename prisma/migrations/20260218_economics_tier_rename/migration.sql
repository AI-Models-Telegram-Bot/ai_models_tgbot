-- Rename SubscriptionTier enum values: BASIC→STARTER, VIP→PREMIUM, ELITE→BUSINESS
ALTER TYPE "SubscriptionTier" RENAME VALUE 'BASIC' TO 'STARTER';
ALTER TYPE "SubscriptionTier" RENAME VALUE 'VIP' TO 'PREMIUM';
ALTER TYPE "SubscriptionTier" RENAME VALUE 'ELITE' TO 'BUSINESS';

-- Add new fields to AIModel for multi-provider routing
ALTER TABLE "ai_models" ADD COLUMN "provider_priority" JSONB;
ALTER TABLE "ai_models" ADD COLUMN "base_cost" DOUBLE PRECISION;
