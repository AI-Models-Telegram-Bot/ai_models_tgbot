-- AlterTable: Change token_cost from INTEGER to DOUBLE PRECISION (Float)
ALTER TABLE "ai_models" ALTER COLUMN "token_cost" SET DATA TYPE DOUBLE PRECISION;
