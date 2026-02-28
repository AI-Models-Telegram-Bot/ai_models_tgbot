-- CreateEnum: ReferralMode
CREATE TYPE "ReferralMode" AS ENUM ('TOKENS', 'CASH');

-- CreateEnum: WithdrawalStatus
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- AlterEnum: WalletTransactionType - add REFERRAL_COMMISSION
ALTER TYPE "WalletTransactionType" ADD VALUE 'REFERRAL_COMMISSION';

-- AlterTable: users - add referral_mode
ALTER TABLE "users" ADD COLUMN "referral_mode" "ReferralMode" NOT NULL DEFAULT 'TOKENS';

-- CreateTable: withdrawal_requests
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_created_at_idx" ON "withdrawal_requests"("user_id", "created_at");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
