-- AlterTable: Add split balance fields to user_wallets
ALTER TABLE "user_wallets" ADD COLUMN "subscription_tokens" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_wallets" ADD COLUMN "purchased_tokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate existing token_balance → purchased_tokens (treat all existing tokens as purchased)
UPDATE "user_wallets" SET "purchased_tokens" = "token_balance";

-- AlterTable: Extend token_packages with new fields
ALTER TABLE "token_packages" ADD COLUMN "price_rub" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "token_packages" ADD COLUMN "price_stars" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "token_packages" ADD COLUMN "discount_percent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "token_packages" ADD COLUMN "is_popular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "token_packages" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "token_packages" ADD COLUMN "description" TEXT;

-- Update currency default on token_packages
ALTER TABLE "token_packages" ALTER COLUMN "currency" SET DEFAULT 'RUB';

-- AlterEnum: Add new values to WalletTransactionType
ALTER TYPE "WalletTransactionType" ADD VALUE 'TOKEN_PURCHASE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'SUBSCRIPTION_GRANT';

-- Seed default token packages (only if table is empty)
INSERT INTO "token_packages" ("id", "name", "tokens", "price", "currency", "price_rub", "price_stars", "discount_percent", "is_popular", "sort_order", "is_active", "created_at")
SELECT
  gen_random_uuid()::text, v.name, v.tokens, v.price_rub, 'RUB', v.price_rub, v.price_stars, v.discount_percent, v.is_popular, v.sort_order, true, NOW()
FROM (VALUES
  ('100 Tokens',  100,  199,  100, 0,     false, 1),
  ('500 Tokens',  500,  799,  400, 20,    true,  2),
  ('1000 Tokens', 1000, 1399, 700, 30,    false, 3),
  ('3000 Tokens', 3000, 3499, 1750, 42,   false, 4),
  ('5000 Tokens', 5000, 4999, 2500, 50,   false, 5)
) AS v(name, tokens, price_rub, price_stars, discount_percent, is_popular, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "token_packages" LIMIT 1);
